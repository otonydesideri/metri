# Leitura: exemplos

## FetchOrdersPrismaQueryImpl

```ts
// infra/persistence/prisma/queries/order/fetch-orders.prisma-query.impl.ts
import { Injectable } from '@nestjs/common';
import type {
  FetchOrdersQuery,
  FetchOrdersQueryInput,
  OrderListItem,
} from '../../../../../domain/application/queries/order/fetch-orders.query';
import type { PaginatedResult } from '../../../../../domain/application/queries/pagination';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class FetchOrdersPrismaQueryImpl implements FetchOrdersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: FetchOrdersQueryInput,
  ): Promise<PaginatedResult<OrderListItem>> {
    const where = {
      customerId: input.customerId,
      ...(input.status ? { status: input.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.client.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.client.order.count({ where }),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      number: row.number,
      customerName: row.customer.name,
      status: row.status,
      totalInCents: row.totalInCents,
      createdAt: row.createdAt,
    }));

    const result = {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
    return result;
  }
}
```
