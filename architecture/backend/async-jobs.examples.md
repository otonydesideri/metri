# Jobs assíncronos: exemplos

## OrderReportPgBossQueueImpl

```ts
import { Injectable } from '@nestjs/common';
import {
  OrderReportQueue,
  type OrderReportQueueInput,
} from '../../domain/application/queues/order-report-queue.contract';
import { PgBossService } from './pg-boss.service';
import { GENERATE_ORDER_REPORT_QUEUE } from './generate-order-report.worker';

@Injectable()
export class OrderReportPgBossQueueImpl implements OrderReportQueue {
  constructor(private readonly pgBoss: PgBossService) {}

  async enqueue(input: OrderReportQueueInput): Promise<void> {
    await this.pgBoss.send(GENERATE_ORDER_REPORT_QUEUE.name, input, {
      singletonKey: input.orderId,
    });
  }
}
```

## GenerateOrderReportWorker

```ts
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { OrderReportQueueInput } from '../../domain/application/queues/order-report-queue.contract';
import { GenerateOrderReportUseCase } from '../../domain/application/use-cases/order/generate-order-report.use-case';
import { PgBossService, type QueueDefinition } from './pg-boss.service';

export const GENERATE_ORDER_REPORT_QUEUE: QueueDefinition = {
  name: 'generate-order-report',
  deadLetter: 'generate-order-report-dlq',
  retryLimit: 5,
  retryDelay: 5,
  retryBackoff: true,
};

@Injectable()
export class GenerateOrderReportWorker implements OnModuleInit {
  private readonly logger = new Logger(GenerateOrderReportWorker.name);

  constructor(
    private readonly pgBoss: PgBossService,
    private readonly generateOrderReportUseCase: GenerateOrderReportUseCase,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.pgBoss.work<OrderReportQueueInput>(
      GENERATE_ORDER_REPORT_QUEUE,
      (input) => this.handle(input),
    );
  }

  private async handle(input: OrderReportQueueInput): Promise<void> {
    const result = await this.generateOrderReportUseCase.execute({
      orderId: input.orderId,
      customerId: input.customerId,
    });

    if (result.isFailure()) {
      // an expected failure is a business result: retrying does not change the rule.
      this.logger.error(`Job descartado (orderId ${input.orderId}): ${result.value.code}`);
    }
  }
}
```
