# Specification: exemplos

## RefundableOrderSpecification

```ts
// domain/enterprise/specifications/refundable-order.specification.ts
import { OrderStatus } from "../enums/order-status.enum";
import type { Order } from "../order.entity";

const REFUND_WINDOW_IN_DAYS = 7;

/** ORDER-006 — pedido entregue há até 7 dias pode ser reembolsado. */
export class RefundableOrderSpecification {
  private readonly deliveredSince: Date;

  constructor(now: Date) {
    this.deliveredSince = new Date(
      now.getTime() - REFUND_WINDOW_IN_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  isSatisfiedBy(order: Order): boolean {
    const isDelivered = order.status === OrderStatus.Delivered;
    const isWithinWindow =
      order.deliveredAt !== undefined &&
      order.deliveredAt >= this.deliveredSince;

    const isRefundable = isDelivered && isWithinWindow;
    return isRefundable;
  }

  toWhere() {
    const where = {
      status: OrderStatus.Delivered,
      deliveredAt: { gte: this.deliveredSince },
    };
    return where;
  }
}
```
