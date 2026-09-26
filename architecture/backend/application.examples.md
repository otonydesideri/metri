# Aplicação: exemplos

## ConfirmOrderUseCase

```ts
import { Injectable } from '@nestjs/common';
import { type Either, failure, success } from '@metri/core/types';
import {
  InvalidOrderStatusTransitionError,
  OrderNotFoundError,
} from '../../../enterprise/errors/order.errors';
import { OrderRepository } from '../../repositories/order-repository.contract';

interface ConfirmOrderInput {
  orderId: string;
  requesterId: string;
}

type ConfirmOrderOutput = Either<
  OrderNotFoundError | InvalidOrderStatusTransitionError,
  { order: Order }
>;

/** ORDER-003 — confirmação congela o pedido para faturamento. */
@Injectable()
export class ConfirmOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute({
    orderId,
    requesterId,
  }: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      return failure(new OrderNotFoundError(orderId));
    }

    if (order.customerId.toValue() !== requesterId) {
      return failure(new OrderNotFoundError(orderId));
    }

    const confirmed = order.confirm();

    if (confirmed.isFailure()) {
      return failure(confirmed.value);
    }

    await this.orderRepository.save(order);

    return success({ order });
  }
}
```
