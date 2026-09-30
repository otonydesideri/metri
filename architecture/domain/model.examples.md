# Modelo de domínio: exemplos

## OrderItemList

```ts
// domain/enterprise/order-item-list.ts
import { WatchedList } from '@metri/core/entities';
import { OrderItem } from './order-item.entity';

export class OrderItemList extends WatchedList<OrderItem> {
  compareItems(a: OrderItem, b: OrderItem): boolean {
    return a.equals(b);
  }
}
```

## Order

```ts
// domain/enterprise/order.entity.ts
import { AggregateRoot, UniqueEntityID } from '@metri/core/entities';
import {
  type Either,
  failure,
  type Optional,
  success,
} from '@metri/core/types';
import { OrderConfirmedEvent } from './events/order-confirmed.event';
import { OrderStatus } from './enums/order-status.enum';
import { OrderItem } from './order-item.entity';
import { OrderItemList } from './order-item-list';
import {
  EmptyOrderError,
  InvalidOrderStatusTransitionError,
  OrderNotEditableError,
} from './errors/order.errors';

export interface OrderProps {
  customerId: UniqueEntityID;
  items: OrderItemList;
  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Order extends AggregateRoot<OrderProps> {
  private constructor(props: OrderProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /** BR1 — an order starts as a draft and never starts empty. */
  public static create(
    props: Optional<OrderProps, 'status' | 'createdAt'>,
  ): Either<EmptyOrderError, Order> {
    if (props.items.getItems().length === 0) {
      return failure(new EmptyOrderError());
    }

    const order = new Order({
      ...props,
      status: props.status ?? OrderStatus.Draft,
      createdAt: props.createdAt ?? new Date(),
    });

    return success(order);
  }

  public static reconstitute(props: OrderProps, id: UniqueEntityID): Order {
    return new Order(props, id);
  }

  public get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  public get items(): OrderItemList {
    return this.props.items;
  }

  public get status(): OrderStatus {
    return this.props.status;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date | null | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /** BR2 — an item goes in only while the order is a draft. */
  public addItem(item: OrderItem): Either<OrderNotEditableError, void> {
    if (this.props.status !== OrderStatus.Draft) {
      return failure(new OrderNotEditableError(this.props.status));
    }

    this.props.items.add(item);
    this.touch();

    return success(undefined);
  }

  /** BR3 — only a draft can be confirmed. */
  public confirm(): Either<InvalidOrderStatusTransitionError, void> {
    if (this.props.status !== OrderStatus.Draft) {
      return failure(
        new InvalidOrderStatusTransitionError(this.props.status, OrderStatus.Confirmed),
      );
    }

    this.props.status = OrderStatus.Confirmed;
    this.touch();
    this.addDomainEvent(new OrderConfirmedEvent(this.id, this.props.customerId));

    return success(undefined);
  }
}
```

## Money

```ts
import { ValueObject } from '@metri/core/entities';
import { type Either, failure, success } from '@metri/core/types';
import { InvalidMoneyAmountError } from '../errors/order.errors';

interface MoneyProps {
  amountInCents: number;
}

/** Monetary value in integer cents; every operation returns a new instance. */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  public static create(amountInCents: number): Either<InvalidMoneyAmountError, Money> {
    if (!Number.isInteger(amountInCents) || amountInCents < 0) {
      return failure(new InvalidMoneyAmountError(amountInCents));
    }

    const money = new Money({ amountInCents });

    return success(money);
  }

  public static zero(): Money {
    return new Money({ amountInCents: 0 });
  }

  public add(other: Money): Money {
    return new Money({
      amountInCents: this.props.amountInCents + other.toValue(),
    });
  }

  public toValue(): number {
    return this.props.amountInCents;
  }
}
```

## ProductSlug

```ts
import { ValueObject } from '@metri/core/entities';
import { type Either, failure, success } from '@metri/core/types';
import { InvalidProductSlugError, ReservedProductSlugError } from '../errors/product.errors';

const SLUG_FORMAT = /^[a-z0-9-]{3,40}$/;

/** The first segment of every SPA route and the API prefix (general/http-surface). */
const RESERVED_SLUGS = new Set(['api', 'admin', 'assets', 'login', 'logout', 'orders', 'products', 'settings']);

interface ProductSlugProps {
  value: string;
}

/** The product's public address, `/<slug>` at the SPA root; the failure carries a suggestion in the valid format, and availability is the use case's check. */
export class ProductSlug extends ValueObject<ProductSlugProps> {
  private constructor(props: ProductSlugProps) {
    super(props);
  }

  public static create(raw: string): Either<InvalidProductSlugError | ReservedProductSlugError, ProductSlug> {
    const value = raw.trim().toLowerCase();

    if (!SLUG_FORMAT.test(value)) {
      return failure(new InvalidProductSlugError(suggestProductSlug(value)));
    }

    if (RESERVED_SLUGS.has(value)) {
      return failure(new ReservedProductSlugError(suggestProductSlug(value)));
    }

    return success(new ProductSlug({ value }));
  }

  public get value(): string {
    return this.props.value;
  }
}

export function suggestProductSlug(base: string): string {
  const cleaned = base.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const stem = cleaned.length >= 3 ? cleaned.slice(0, 34) : 'produto';
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `${stem}-${suffix}`;
}
```
