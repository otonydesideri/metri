# Domain Service: exemplos

## calculateLoyaltyDiscount

```ts
// domain/enterprise/domain-services/loyalty-discount.ts
import { CustomerTier } from '../enums/customer-tier.enum';
import type { Customer } from '../customer.entity';
import type { Order } from '../order.entity';

const MINIMUM_TOTAL_FOR_DISCOUNT_IN_CENTS = 10000;

const DISCOUNT_RATE_BY_TIER: Record<CustomerTier, number> = {
  [CustomerTier.Regular]: 0,
  [CustomerTier.Silver]: 0.05,
  [CustomerTier.Gold]: 0.1,
};

/** BR7 — loyalty discount: the customer's tier applied to an order above the minimum. */
export function calculateLoyaltyDiscount(order: Order, customer: Customer): number {
  if (order.totalInCents < MINIMUM_TOTAL_FOR_DISCOUNT_IN_CENTS) {
    return 0;
  }

  const rate = DISCOUNT_RATE_BY_TIER[customer.tier];
  const discountInCents = Math.floor(order.totalInCents * rate);
  return discountInCents;
}
```

## OrderCancellationSettlementService

Duas operações que só fazem sentido juntas: o valor reembolsado e o valor retido numa cancelamento compartilham a mesma tabela de tier e precisam somar o total do pedido — mudar uma sem a outra quebraria essa invariante.

```ts
// domain/enterprise/domain-services/order-cancellation-settlement.ts
import { CustomerTier } from '../enums/customer-tier.enum';
import type { Customer } from '../customer.entity';
import type { Order } from '../order.entity';

const FORFEIT_RATE_BY_TIER: Record<CustomerTier, number> = {
  [CustomerTier.Regular]: 0.1,
  [CustomerTier.Silver]: 0.05,
  [CustomerTier.Gold]: 0,
};

/** BR12 — cancellation settlement: refund and forfeit always sum to the order total. */
export class OrderCancellationSettlementService {
  forfeitedAmountInCents(order: Order, customer: Customer): number {
    const rate = FORFEIT_RATE_BY_TIER[customer.tier];
    return Math.floor(order.totalInCents * rate);
  }

  refundAmountInCents(order: Order, customer: Customer): number {
    return order.totalInCents - this.forfeitedAmountInCents(order, customer);
  }
}
```
