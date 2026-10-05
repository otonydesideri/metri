# Persistência: exemplos

## OrderPrismaMapper

```ts
import { UniqueEntityID } from '@metri/core/entities';
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Prisma,
} from '@metri/db/client';
import { OrderItem } from '../../../../domain/enterprise/order-item.entity';
import { Order } from '../../../../domain/enterprise/order.entity';
import type { OrderStatus } from '../../../../domain/enterprise/enums/order-status.enum';

type RawOrder = PrismaOrder & { items: PrismaOrderItem[] };

export class OrderPrismaMapper {
  static toDomain(raw: RawOrder): Order {
    const items = raw.items.map((item) =>
      OrderItem.reconstitute(
        {
          productId: new UniqueEntityID(item.productId),
          quantity: item.quantity,
          unitPriceInCents: item.unitPriceInCents,
        },
        new UniqueEntityID(item.id),
      ),
    );

    const order = Order.reconstitute(
      {
        customerId: new UniqueEntityID(raw.customerId),
        items,
        status: raw.status as OrderStatus,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );

    return order;
  }

  static toPrisma(order: Order): Prisma.OrderUncheckedCreateInput {
    return {
      id: order.id.toValue(),
      customerId: order.customerId.toValue(),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
```

## OrderPrismaRepositoryImpl

```ts
import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../../../domain/application/repositories/order-repository.contract';
import type { Order } from '../../../../domain/enterprise/order.entity';
import { OrderItemPrismaMapper } from '../mappers/order-item.prisma-mapper';
import { OrderPrismaMapper } from '../mappers/order.prisma-mapper';
import { TransactionContext } from '../transactions/transaction-context';

@Injectable()
export class OrderPrismaRepositoryImpl implements OrderRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.context.client().order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!data) {
      return null;
    }

    const order = OrderPrismaMapper.toDomain(data);

    return order;
  }

  async findManyByIds(ids: string[]): Promise<Order[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.context.client().order.findMany({
      where: { id: { in: ids } },
      include: { items: true },
    });

    const orders = rows.map(OrderPrismaMapper.toDomain);

    return orders;
  }

  async save(order: Order): Promise<void> {
    const data = OrderPrismaMapper.toPrisma(order);
    const tx = this.context.requireTx();

    await tx.order.upsert({
      where: { id: data.id },
      create: data,
      update: { status: data.status, updatedAt: data.updatedAt },
    });

    await tx.orderItem.deleteMany({ where: { orderId: data.id } });
    await tx.orderItem.createMany({
      data: order.items.map((item) => OrderItemPrismaMapper.toPrisma(item, data.id)),
    });

    this.context.track(order.id);
  }
}
```

## PrismaService

```ts title="apps/app-api/src/infra/persistence/prisma/prisma.service.ts"
import { PrismaClient } from '@metri/db/client';
import {
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../../common/env/env.service';

// how long a connection attempt waits before the boot fails
const CONNECTION_TIMEOUT_MS = 3_000;

// The Postgres answer the driver adapter attaches to the error; absent when the server never answered.
type DriverCause = { kind?: string; originalMessage?: string };

function driverCauseOf(error: unknown): DriverCause {
	const { meta } = error as {
		meta?: { driverAdapterError?: { cause?: DriverCause } };
	};
	return meta?.driverAdapterError?.cause ?? {};
}

// What to do, in the boot error: the Postgres off, the database missing or the connection refused.
function unreachableMessage(databaseUrl: string, error: unknown): string {
	const url = new URL(databaseUrl);
	const address = `${url.hostname}:${url.port || '5432'}`;
	const database = url.pathname.slice(1);
	const { kind, originalMessage } = driverCauseOf(error);
	if (kind === undefined) {
		return `O Postgres do DATABASE_URL (.env da raiz) não responde em ${address}. Suba o banco com pnpm db:up, ou o Postgres que o projeto usa, e rode de novo.`;
	}
	if (kind === 'DatabaseDoesNotExist') {
		return `O banco ${database} não existe no Postgres de ${address}. Crie-o com as migrations: pnpm --filter @metri/db migrate:dev.`;
	}
	return `O Postgres de ${address} recusou a conexão ao banco ${database} (${originalMessage ?? kind}). Confira o DATABASE_URL do .env da raiz.`;
}

/** SOURCE OF TRUTH: PrismaService.
 * WHAT: builds the @metri/db `PrismaClient` with the Postgres driver adapter, reading DATABASE_URL through `EnvService` in the constructor; on module init, fails the boot within seconds, saying what to do, when the database does not answer; disconnects on module destroy.
 * WHY: a client is born in the constructor, never at the top level of a file (infrastructure/runtime, "Env e montagem de client"; backend/persistence); without the check at boot, a database that is off only shows up in the first request (infrastructure/runtime, "Banco de desenvolvimento").
 * WHERE: injected, through `client`, by the repositories and queries of infra/persistence/prisma, by `DatabaseHealth` and by the test factories; never by a controller or a use case (backend/boundaries).
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
	readonly client: PrismaClient;
	private readonly databaseUrl: string;

	constructor(env: EnvService) {
		this.databaseUrl = env.getOrThrow('DATABASE_URL');
		this.client = new PrismaClient({
			adapter: new PrismaPg({
				connectionString: this.databaseUrl,
				connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
			}),
		});
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.client.$queryRaw`SELECT 1`;
		} catch (error) {
			// without the cause: the message says what to do, and the driver's stack would bury it
			throw new Error(unreachableMessage(this.databaseUrl, error));
		}
	}

	async onModuleDestroy(): Promise<void> {
		await this.client.$disconnect();
	}
}
```

## schema.prisma

```prisma title="packages/db/prisma/schema.prisma"
// The generator of the client and the datasource. Each model lives in `models/<module>.prisma`, the file of the
// module that owns the table (backend/persistence, "Propriedade de tabela no schema"). After changing a model:
// `pnpm --filter @metri/db migrate:dev --name <name>`, then `pnpm --filter @metri/db generate`.

generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "esm"
}

datasource db {
  provider = "postgresql"
}
```

## prisma.config.ts

```ts title="packages/db/prisma.config.ts"
import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The project's one DATABASE_URL is in the root .env; a variable already in the environment wins.
const ENV_FILE = new URL('../../.env', import.meta.url);
if (existsSync(ENV_FILE)) {
	process.loadEnvFile(ENV_FILE);
}

/** SOURCE OF TRUTH: the Prisma config of @metri/db.
 * WHAT: points the Prisma CLI to the multi-file schema in `prisma/`, to the migrations and to the DATABASE_URL.
 * WHY: in Prisma 7 the URL lives here, not in the schema (backend/persistence, "Aplicação").
 * WHERE: read by every `prisma` command of the package (`generate`, `migrate:dev`, which creates a missing database, `migrate:deploy`), run by hand and by the app-api e2e setup.
 */
export default defineConfig({
	schema: 'prisma',
	migrations: { path: 'prisma/migrations' },
	datasource: { url: process.env.DATABASE_URL },
});
```
