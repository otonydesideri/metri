# Persistência: exemplos

## OrderPrismaMapper

```ts
import { UniqueEntityID } from '@metri/core/entities';
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Prisma,
} from '@metri/db/postgres';
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
import { DomainEvents } from '@metri/core/events';
import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../../../domain/application/repositories/order-repository.contract';
import type { Order } from '../../../../domain/enterprise/order.entity';
import { OrderItemPrismaMapper } from '../mappers/order-item.prisma-mapper';
import { OrderPrismaMapper } from '../mappers/order.prisma-mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OrderPrismaRepositoryImpl implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
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

    const rows = await this.prisma.order.findMany({
      where: { id: { in: ids } },
      include: { items: true },
    });

    const orders = rows.map(OrderPrismaMapper.toDomain);

    return orders;
  }

  async save(order: Order): Promise<void> {
    const data = OrderPrismaMapper.toPrisma(order);

    // root and items are written together or not at all
    await this.prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: data.id },
        create: data,
        update: { status: data.status, updatedAt: data.updatedAt },
      });

      await tx.orderItem.deleteMany({ where: { orderId: data.id } });
      await tx.orderItem.createMany({
        data: order.items.map((item) => OrderItemPrismaMapper.toPrisma(item, data.id)),
      });
    });

    DomainEvents.dispatchEventsForAggregate(order.id);
  }
}
```

## PrismaService

```ts title="apps/app-api/src/infra/persistence/prisma/prisma.service.ts"
import { PrismaClient } from '@metri/db/postgres';
import {
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../../common/env/env.service';

/** SOURCE OF TRUTH: PrismaService.
 * WHAT: the @metri/db `PrismaClient` with the Postgres driver adapter, built from the DATABASE_URL of `EnvService`; connects on module init and disconnects on module destroy.
 * WHY: a client is born in the constructor, never at the top level of a file (infrastructure/runtime, "Env e montagem de client"; backend/persistence).
 * WHERE: injected by the repositories and queries of infra/persistence/prisma, by `DatabaseHealth` and by the test factories; never by a controller or a use case (backend/boundaries).
 */
@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor(env: EnvService) {
		super({
			adapter: new PrismaPg({
				connectionString: env.getOrThrow('DATABASE_URL'),
			}),
		});
	}

	async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	async onModuleDestroy(): Promise<void> {
		await this.$disconnect();
	}
}
```

## schema.prisma

```prisma title="packages/db/src/postgres/models/schema.prisma"
// The generator of the client and the datasource. Each model lives beside this file, in `<module>.prisma`, the file of the
// module that owns the table (backend/persistence, "Propriedade de tabela no schema"). After changing a model:
// `pnpm --filter @metri/db migrate:dev --name <name>`, then `pnpm --filter @metri/db generate`.

generator client {
  provider     = "prisma-client"
  output       = "../generated/client"
  moduleFormat = "esm"
}

datasource db {
  provider = "postgresql"
}
```

## prisma.config.ts

```ts title="packages/db/src/postgres/prisma.config.ts"
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/** SOURCE OF TRUTH: the Prisma config of the Postgres connector of @metri/db.
 * WHAT: points the Prisma CLI to the multi-file schema in `models/`, to `migrations/` and to the DATABASE_URL of the package's own `.env`.
 * WHY: one folder per data connector under `src/`, with its config, schema and migrations inside it (backend/persistence); in Prisma 7 the URL lives here, not in the schema, and a variable already in the environment wins over the `.env`.
 * WHERE: passed by `--config` to every `prisma` command of the package (`generate`, `migrate:dev`, `migrate:deploy`), run by hand and by the app-api e2e setup.
 */
export default defineConfig({
	schema: 'models',
	migrations: {
		path: 'migrations',
	},
	datasource: {
		url: env('DATABASE_URL'),
	},
});
```

## index.ts do conector

```ts title="packages/db/src/postgres/index.ts"
/** SOURCE OF TRUTH: the Postgres connector of @metri/db.
 * WHAT: the generated Prisma client and its types, exported as `@metri/db/postgres`.
 * WHY: consumers import the connector, never the generated folder (backend/persistence).
 * WHERE: imported by the `PrismaService` of app-api and by its e2e setup.
 */
export * from './generated/client/client';
```
