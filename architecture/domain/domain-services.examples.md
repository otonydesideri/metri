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

