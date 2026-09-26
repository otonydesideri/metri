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

  /** ORDER-001 — pedido nasce em rascunho e nunca nasce vazio. */
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

  /** ORDER-002 — item entra só enquanto o pedido é rascunho. */
  public addItem(item: OrderItem): Either<OrderNotEditableError, void> {
    if (this.props.status !== OrderStatus.Draft) {
      return failure(new OrderNotEditableError(this.props.status));
    }

    this.props.items.add(item);
    this.touch();

    return success(undefined);
  }

  /** ORDER-003 — só rascunho pode ser confirmado. */
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

/** Valor monetário em centavos inteiros; toda operação devolve instância nova. */
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
