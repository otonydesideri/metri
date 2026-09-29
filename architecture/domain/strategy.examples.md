# Strategy: exemplos

## ShippingCostCalculator

```ts
// domain/enterprise/strategies/shipping-cost.strategy.ts
import { DeliveryMethod } from '../enums/delivery-method.enum';

export interface ShippingContext {
  distanceInKm: number;
  totalWeightInGrams: number;
}

export abstract class ShippingCostCalculator {
  /** BR4 — shipping cost in integer cents, per delivery method. */
  abstract calculate(context: ShippingContext): number;
}

class PickupShippingCost extends ShippingCostCalculator {
  calculate(): number {
    return 0;
  }
}

class StandardShippingCost extends ShippingCostCalculator {
  calculate(context: ShippingContext): number {
    const baseInCents = 1200;
    const weightFeeInCents = Math.ceil(context.totalWeightInGrams / 500) * 100;
    const totalInCents = baseInCents + weightFeeInCents;
    return totalInCents;
  }
}

class ExpressShippingCost extends ShippingCostCalculator {
  calculate(context: ShippingContext): number {
    const baseInCents = 2500;
    const distanceFeeInCents = context.distanceInKm > 100 ? 1500 : 0;
    const totalInCents = baseInCents + distanceFeeInCents;
    return totalInCents;
  }
}

export const SHIPPING_COST_CALCULATORS: Record<
  DeliveryMethod,
  ShippingCostCalculator
> = {
  [DeliveryMethod.Pickup]: new PickupShippingCost(),
  [DeliveryMethod.Standard]: new StandardShippingCost(),
  [DeliveryMethod.Express]: new ExpressShippingCost(),
};
```

## NotifyOrderConfirmationUseCase

```ts
// domain/application/use-cases/order/notify-order-confirmation.use-case.ts
import { Injectable } from '@nestjs/common';
import { type Either, failure, success } from '@metri/core/types';
import { NotificationChannel } from '../../../enterprise/enums/notification-channel.enum';
import { OrderNotFoundError } from '../../../enterprise/errors/order.errors';
import { OrderRepository } from '../../repositories/order-repository.contract';
import {
  EmailOrderNotifier,
  OrderNotifier,
  SmsOrderNotifier,
} from '../../services/notification/order-notifier.contract';

interface NotifyOrderConfirmationInput {
  orderId: string;
  channel: NotificationChannel;
}

type NotifyOrderConfirmationOutput = Either<OrderNotFoundError, { order: Order }>;

/** BR5 — confirmation notifies the customer through their preferred channel. */
@Injectable()
export class NotifyOrderConfirmationUseCase {
  private readonly notifiers: Record<NotificationChannel, OrderNotifier>;

  constructor(
    private readonly orderRepository: OrderRepository,
    emailNotifier: EmailOrderNotifier,
    smsNotifier: SmsOrderNotifier,
  ) {
    this.notifiers = {
      [NotificationChannel.Email]: emailNotifier,
      [NotificationChannel.Sms]: smsNotifier,
    };
  }

  async execute({
    orderId,
    channel,
  }: NotifyOrderConfirmationInput): Promise<NotifyOrderConfirmationOutput> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      return failure(new OrderNotFoundError(orderId));
    }

    const notifier = this.notifiers[channel];
    await notifier.send({
      orderId: order.id.toValue(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalInCents: order.totalInCents,
    });

    return success({ order });
  }
}
```
