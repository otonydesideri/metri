# Testes: exemplos

## make-order.factory.ts

```ts
// test/factories/make-order.factory.ts
import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@metri/core/entities';
import { Order, type OrderProps } from '../../src/domain/enterprise/order.entity';
import { OrderItemList } from '../../src/domain/enterprise/order-item-list';
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
      items: new OrderItemList([]),
      status: OrderStatus.Draft,
      createdAt: faker.date.recent(),
      ...override,
    },
    id ?? new UniqueEntityID(),
  );
}

/** Grava um `order` real via Prisma — usado em e2e, ao contrário de `makeOrder` (entidade em memória, só teste unitário). */
@Injectable()
export class OrderFactory {
  constructor(private readonly prisma: PrismaService) {}

  async makePrismaOrder(
    override: Partial<OrderProps> = {},
    id?: UniqueEntityID,
  ): Promise<Order> {
    const order = makeOrder(override, id);

    await this.prisma.client.order.create({
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
    const result = Order.create({ customerId: new UniqueEntityID(), items: new OrderItemList([]) });

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
      items: new OrderItemList([item]),
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
    const request = {
      orderId: 'order-1',
      customerId: 'customer-1',
    };

    const result = await sut.execute(request);

    expect(result.isFailure()).toBe(true);
    expect(result.isFailure() && result.value).toBeInstanceOf(OrderNotFoundError);
  });

  it('rascunho do próprio cliente → confirmado', async () => {
    const order = makeOrder({ customerId: new UniqueEntityID('customer-1') });
    inMemory.OrderRepository.items.push(order);

    const request = {
      orderId: order.id.toValue(),
      customerId: 'customer-1',
    };

    const result = await sut.execute(request);

    expect(result.isSuccess()).toBe(true);
    expect(order.status).toBe(OrderStatus.Confirmed);
  });
});
```

## confirm-order.e2e-spec.ts

```ts
// infra/http/controllers/order/confirm-order.e2e-spec.ts
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import { UniqueEntityID } from '@metri/core/entities';
import request from 'supertest';
import { OrderFactory } from '../../../../../test/factories/make-order.factory';
import { AppModule } from '../../../../app.module';
import { PersistenceModule } from '../../../persistence/persistence.module';
import { PrismaService } from '../../../persistence/prisma/prisma.service';

describe('POST /api/orders/:orderId/confirm (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let orderFactory: OrderFactory;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, PersistenceModule],
      providers: [OrderFactory],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { bodyParser: false },
    );
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleRef.get(PrismaService);
    orderFactory = moduleRef.get(OrderFactory);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rascunho existente → confirmado', async () => {
    const customerId = new UniqueEntityID();
    const order = await orderFactory.makePrismaOrder({ customerId });

    // a credencial do dono tem a forma do projeto: o helper que a monta é o do
    // projeto (.metri/ARCHITECTURE.md, "Delegações")
    const response = await request(app.getHttpServer())
      .post(`/api/orders/${order.id.toValue()}/confirm`)
      .set(ownerCredential(customerId.toValue()));

    expect(response.status).toBe(200);

    const confirmedOnDatabase = await prisma.client.order.findUnique({
      where: { id: order.id.toValue() },
    });
    expect(confirmedOnDatabase?.status).toBe('CONFIRMED');
  });
});
```
