# Modelo de domínio: exemplos

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
import {
  EmptyOrderError,
  InvalidOrderStatusTransitionError,
  OrderNotEditableError,
} from './errors/order.errors';

export interface OrderProps {
  customerId: UniqueEntityID;
  items: OrderItem[];
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
    if (props.items.length === 0) {
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

  public get items(): readonly OrderItem[] {
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

    this.props.items.push(item);
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

## Entity

```ts title="packages/core/src/entities/entity.ts"
import { UniqueEntityID } from './unique-entity-id';

/** SOURCE OF TRUTH: Entity.
 * WHAT: the entity base: protected constructor, `id` as `UniqueEntityID` (new when absent) and equality by identity.
 * WHY: creation and reconstitution are separate paths, each a static method of the subclass (domain/model).
 * WHERE: extended by `AggregateRoot` and by the child entities of an aggregate.
 * The domain event registry enters with the first use case that reacts to a domain fact (backend/events).
 */
export abstract class Entity<Props> {
	private readonly _id: UniqueEntityID;
	protected props: Props;

	protected constructor(props: Props, id?: UniqueEntityID) {
		this.props = props;
		this._id = id ?? new UniqueEntityID();
	}

	get id(): UniqueEntityID {
		return this._id;
	}

	equals(entity: unknown): boolean {
		if (entity === this) {
			return true;
		}

		if (!(entity instanceof Entity)) {
			return false;
		}

		return this._id.equals(entity._id);
	}
}
```

## ValueObject

```ts title="packages/core/src/entities/value-object.ts"
/** SOURCE OF TRUTH: ValueObject.
 * WHAT: the value object base: protected constructor, read-only props and structural equality.
 * WHY: a value object has no id and is compared by value (domain/model, "Value objects").
 * WHERE: extended by the value objects of apps/app-api/src/domain/enterprise/value-objects.
 */
export abstract class ValueObject<Props> {
	protected readonly props: Props;

	protected constructor(props: Props) {
		this.props = props;
	}

	equals(vo?: ValueObject<Props>): boolean {
		if (vo === null || vo === undefined) {
			return false;
		}

		if (vo.props === undefined) {
			return false;
		}

		return JSON.stringify(this.props) === JSON.stringify(vo.props);
	}
}
```

## Either

```ts title="packages/core/src/types/either.ts"
/** SOURCE OF TRUTH: Either, Left, Right, failure, success.
 * WHAT: the return of an operation that can fail: `failure(...)` or `success(...)`, narrowed by `isFailure()`/`isSuccess()`.
 * WHY: the domain returns errors, never throws them (backend/errors, "Retornando erro: sempre `Either`, nunca `throw`").
 * WHERE: returned by `create()`, by entity transitions and by use cases; read by the controller.
 */
export class Left<L, R> {
	readonly value: L;

	constructor(value: L) {
		this.value = value;
	}

	isFailure(): this is Left<L, R> {
		return true;
	}

	isSuccess(): this is Right<L, R> {
		return false;
	}
}

export class Right<L, R> {
	readonly value: R;

	constructor(value: R) {
		this.value = value;
	}

	isFailure(): this is Left<L, R> {
		return false;
	}

	isSuccess(): this is Right<L, R> {
		return true;
	}
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export function failure<L, R = never>(value: L): Either<L, R> {
	return new Left(value);
}

export function success<R, L = never>(value: R): Either<L, R> {
	return new Right(value);
}
```
