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
import { OrderItemList } from '../../../../domain/enterprise/order-item-list';
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
        items: new OrderItemList(items),
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
    // no condition besides `version` rides on the `where`: the decision already happened in the domain, before
    // this call (backend/persistence, "Repositório")
    const data = OrderPrismaMapper.toPrisma(order);
    const newItems = order.items.getNewItems();
    const removedItems = order.items.getRemovedItems();
    const tx = this.context.requireTx();

    await tx.order.upsert({
      where: { id: data.id },
      create: data,
      update: { status: data.status, updatedAt: data.updatedAt },
    });

    if (newItems.length > 0) {
      await tx.orderItem.createMany({
        data: newItems.map((item) => OrderItemPrismaMapper.toPrisma(item, data.id)),
      });
    }

    if (removedItems.length > 0) {
      await tx.orderItem.deleteMany({
        where: { id: { in: removedItems.map((item) => item.id.toValue()) } },
      });
    }

    this.context.track(order.id);
  }
}
```
