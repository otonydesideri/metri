# Testes: exemplos

## make-order.factory.ts

```ts
// test/factories/make-order.factory.ts
import { faker } from '@faker-js/faker';
import { UniqueEntityID } from '@metri/core/entities';
import { Injectable } from '@nestjs/common';
import { Order, type OrderProps } from '../../src/domain/enterprise/order.entity';
import { OrderStatus } from '../../src/domain/enterprise/enums/order-status.enum';
import { OrderPrismaMapper } from '../../src/infra/persistence/prisma/mappers/order.prisma-mapper';
import { PrismaService } from '../../src/infra/persistence/prisma/prisma.service';

export function makeOrder(
  override: Partial<OrderProps> = {},
  id?: UniqueEntityID,
): Order {
  return Order.reconstitute(
    {
      customerId: new UniqueEntityID(),
      items: [],
      status: OrderStatus.Draft,
      createdAt: faker.date.recent(),
      ...override,
    },
    id ?? new UniqueEntityID(),
  );
}

/** Writes a real `order` through Prisma — used in e2e, unlike `makeOrder` (in-memory entity, unit tests only). */
@Injectable()
export class OrderFactory {
  constructor(private readonly prisma: PrismaService) {}

  async makePrismaOrder(
    override: Partial<OrderProps> = {},
    id?: UniqueEntityID,
  ): Promise<Order> {
    const order = makeOrder(override, id);

    await this.prisma.order.create({
      data: OrderPrismaMapper.toPrisma(order),
    });

    return order;
  }
}
```

## OrderInMemoryRepositoryImpl

```ts
export class OrderInMemoryRepositoryImpl implements OrderRepository {
  public items: Order[] = [];

  async findById(id: string): Promise<Order | null> {
    const order = this.items.find((item) => item.id.toValue() === id);

    if (!order) {
      return null;
    }

    return order;
  }

  async save(order: Order): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(order.id));

    if (index === -1) {
      this.items.push(order);
    } else {
      this.items[index] = order;
    }

    DomainEvents.dispatchEventsForAggregate(order.id);
  }
}
```

## Order

```ts
describe('Order', () => {
  it('create() sem item → falha', () => {
    const result = Order.create({ customerId: new UniqueEntityID(), items: [] });

    expect(result.isFailure()).toBe(true);
    expect(result.isFailure() && result.value).toBeInstanceOf(EmptyOrderError);
  });

  it('confirm() muda o status e marca updatedAt', () => {
    const item = OrderItem.create({
      productId: new UniqueEntityID(),
      quantity: 1,
      unitPriceInCents: 5000,
    }).value;
    const orderOrError = Order.create({
      customerId: new UniqueEntityID(),
      items: [item],
    });
    const sut = orderOrError.value;

    expect(sut.updatedAt).toBeUndefined();

    const result = sut.confirm();

    expect(result.isSuccess()).toBe(true);
    expect(sut.status).toBe(OrderStatus.Confirmed);
    expect(sut.updatedAt).toBeInstanceOf(Date);
  });
});
```

## ConfirmOrderUseCase

```ts
describe('ConfirmOrderUseCase', () => {
  let inMemory: InMemoryRepositoriesProps;
  let sut: ConfirmOrderUseCase;

  beforeEach(() => {
    inMemory = makeInMemoryRepositories();
    sut = new ConfirmOrderUseCase(inMemory.OrderRepository);
  });

  it('pedido não encontrado → falha', async () => {
    const result = await sut.execute({ orderId: 'order-1' });

    expect(result.isFailure()).toBe(true);
    expect(result.isFailure() && result.value).toBeInstanceOf(OrderNotFoundError);
  });

  it('rascunho → confirmado', async () => {
    const order = makeOrder();
    inMemory.OrderRepository.items.push(order);

    const result = await sut.execute({ orderId: order.id.toValue() });

    expect(result.isSuccess()).toBe(true);
    expect(order.status).toBe(OrderStatus.Confirmed);
  });
});
```

## confirm-order.e2e-spec.ts

```ts
// infra/http/controllers/order/confirm-order.e2e-spec.ts
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UniqueEntityID } from '@metri/core/entities';
import request from 'supertest';
import { OrderFactory } from '../../../../../test/factories/make-order.factory';
import { AppModule } from '../../../../app.module';
import { PersistenceModule } from '../../../persistence/persistence.module';
import { PrismaService } from '../../../persistence/prisma/prisma.service';

describe('POST /api/orders/:orderId/confirm (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orderFactory: OrderFactory;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, PersistenceModule],
      providers: [OrderFactory],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleRef.get(PrismaService);
    orderFactory = moduleRef.get(OrderFactory);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rascunho existente → confirmado', async () => {
    const order = await orderFactory.makePrismaOrder();

    const response = await request(app.getHttpServer()).post(`/api/orders/${order.id.toValue()}/confirm`);

    expect(response.status).toBe(200);

    const saved = await prisma.order.findUnique({
      where: { id: order.id.toValue() },
    });
    expect(saved?.status).toBe('CONFIRMED');
  });
});
```

## setup-e2e

```ts title="apps/app-api/test/setup-e2e.ts"
// The isolated database of each e2e file (backend/testing, "Convenção de nome e execução"): before the file,
// creates on the Postgres server of DATABASE_URL a new database named after the project's one, never a schema in
// the same database, applies the @metri/db migrations to it and points the process DATABASE_URL at it, so the file's
// AppModule connects there (the ConfigModule never overrides a variable already in the environment); after the file, drops it. The only file outside infra/persistence/prisma that
// imports @metri/db (backend/boundaries).

import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@metri/db/postgres/app';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll } from 'vitest';

const serverUrl = process.env.DATABASE_URL;
if (!serverUrl) {
	throw new Error(
		'DATABASE_URL ausente: o e2e cria o banco de cada arquivo no Postgres dele (o .env do app-api, que o metri init cria do .env.example)',
	);
}

const databaseUrl = new URL(serverUrl);
const databaseName = `${databaseUrl.pathname.slice(1)}_e2e_${randomUUID().replaceAll('-', '')}`;
databaseUrl.pathname = `/${databaseName}`;
// the server's maintenance database: the project's one need not exist
const maintenanceUrl = new URL(serverUrl);
maintenanceUrl.pathname = '/postgres';

const server = new PrismaClient({
	adapter: new PrismaPg({ connectionString: maintenanceUrl.toString() }),
});

// an identifier is not a parameter: the name enters the SQL quoted
await server.$executeRaw`CREATE DATABASE ${Prisma.raw(`"${databaseName}"`)}`;

execFileSync('pnpm', ['--silent', '--filter', '@metri/db', 'migrate:deploy'], {
	env: {
		...process.env,
		DATABASE_URL: databaseUrl.toString(),
		PRISMA_HIDE_UPDATE_MESSAGE: '1',
	},
	stdio: 'pipe',
});

process.env.DATABASE_URL = databaseUrl.toString();

afterAll(async () => {
	await server.$executeRaw`DROP DATABASE IF EXISTS ${Prisma.raw(`"${databaseName}"`)} WITH (FORCE)`;
	await server.$disconnect();
});
```

## vitest.config.e2e

```ts title="apps/app-api/vitest.config.e2e.ts"
import { defineConfig } from 'vitest/config';

/** SOURCE OF TRUTH: the e2e Vitest config of app-api.
 * WHAT: runs the `*.e2e-spec.ts` files under `src/`, each mounting the whole `AppModule`, with `NODE_ENV=test` and `test/setup-e2e.ts` as setup, which loads the app-api `.env`.
 * WHY: each file gets a new Postgres database on the server of the DATABASE_URL, migrated and dropped at the end (backend/testing, "Convenção de nome e execução").
 * WHERE: read by Vitest through the `test:e2e` script, which accepts a path filter (`test:e2e health`).
 */
export default defineConfig({
	test: {
		include: ['src/**/*.e2e-spec.ts'],
		setupFiles: ['test/setup-e2e.ts'],
		env: { NODE_ENV: 'test' },
		hookTimeout: 30_000,
		passWithNoTests: true,
	},
});
```

## E2e de provider global

```ts title="apps/app-api/src/infra/common/errors/error-envelope.e2e-spec.ts"
import {
	Body,
	Controller,
	HttpCode,
	type INestApplication,
	Post,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { createZodDto } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppModule } from '../../../app.module';

class ProbeBodyDto extends createZodDto(
	z.object({
		name: z.string('O nome é obrigatório.'),
	}),
) {}

@Controller('probe')
class ProbeController {
	@Post()
	@HttpCode(204)
	create(@Body() _body: ProbeBodyDto): void {}
}

describe('Envelope de erro (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
			controllers: [ProbeController],
		}).compile();

		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('rota inexistente → 404 no envelope, sem o corpo nativo', async () => {
		const response = await request(app.getHttpServer()).get(
			'/api/rota-inexistente',
		);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			code: 'NOT_FOUND',
			message: 'Requisição não atendida',
			type: 'REQUEST_REJECTED',
		});
	});

	it('corpo fora do schema → 400 no envelope, com a mensagem do campo', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/probe')
			.send({});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			code: 'INVALID_REQUEST_FORMAT',
			message: 'name: O nome é obrigatório.',
			type: 'INVALID_REQUEST',
		});
	});

	it('corpo dentro do schema → passa pelo pipe', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/probe')
			.send({ name: 'Ana' });

		expect(response.status).toBe(204);
	});
});
```
