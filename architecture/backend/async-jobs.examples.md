# Jobs assíncronos: exemplos

## OrderConfirmationPgBossQueueImpl

```ts
import { Injectable } from '@nestjs/common';
import {
  OrderConfirmationQueue,
  type OrderConfirmationQueueInput,
} from '../../domain/application/queues/order-confirmation-queue.contract';
import { PgBossService } from './pg-boss.service';
import { SEND_ORDER_CONFIRMATION_QUEUE } from './send-order-confirmation.worker';

@Injectable()
export class OrderConfirmationPgBossQueueImpl implements OrderConfirmationQueue {
  constructor(private readonly pgBoss: PgBossService) {}

  async enqueue(input: OrderConfirmationQueueInput): Promise<void> {
    await this.pgBoss.send(SEND_ORDER_CONFIRMATION_QUEUE.name, input, {
      singletonKey: input.orderId,
    });
  }
}
```

## SendOrderConfirmationWorker

```ts
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { OrderConfirmationQueueInput } from '../../domain/application/queues/order-confirmation-queue.contract';
import { SendOrderConfirmationUseCase } from '../../domain/application/use-cases/notification/send-order-confirmation.use-case';
import { PgBossService, type QueueDefinition } from './pg-boss.service';

export const SEND_ORDER_CONFIRMATION_QUEUE: QueueDefinition = {
  name: 'send-order-confirmation',
  deadLetter: 'send-order-confirmation-dlq',
  retryLimit: 5,
  retryDelay: 5,
  retryBackoff: true,
};

@Injectable()
export class SendOrderConfirmationWorker implements OnModuleInit {
  constructor(
    private readonly pgBoss: PgBossService,
    private readonly sendOrderConfirmationUseCase: SendOrderConfirmationUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SendOrderConfirmationWorker.name);
  }

  async onModuleInit(): Promise<void> {
    await this.pgBoss.work<OrderConfirmationQueueInput>(
      SEND_ORDER_CONFIRMATION_QUEUE,
      (input) => this.handle(input),
    );
  }

  private async handle(input: OrderConfirmationQueueInput): Promise<void> {
    const result = await this.sendOrderConfirmationUseCase.execute({
      orderId: input.orderId,
      customerId: input.customerId,
    });

    if (result.isFailure()) {
      // failure esperado é resultado de negócio: retry não muda a regra.
      this.logger.error(
        { err: result.value, orderId: input.orderId },
        'SendOrderConfirmationWorker descartou o job',
      );
    }
  }
}
```
