# Eventos de domínio: exemplos

## OrderConfirmedEvent

```ts
import type { UniqueEntityID } from '@metri/core/entities';
import type { DomainEvent } from '@metri/core/events';

/** BR3 — the order left draft; notification and invoicing react. */
export class OrderConfirmedEvent implements DomainEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly orderId: UniqueEntityID,
    public readonly customerId: UniqueEntityID,
  ) {
    this.occurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.orderId;
  }
}
```

## OnOrderConfirmedSubscriber

```ts
import { Injectable } from '@nestjs/common';
import { DomainEvents, type EventHandler } from '@metri/core/events';
import { PinoLogger } from 'nestjs-pino';
import { SendOrderConfirmationUseCase } from '../../domain/application/use-cases/notification/send-order-confirmation.use-case';
import { OrderConfirmedEvent } from '../../domain/enterprise/events/order-confirmed.event';

@Injectable()
export class OnOrderConfirmedSubscriber implements EventHandler {
  constructor(
    private readonly sendOrderConfirmationUseCase: SendOrderConfirmationUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OnOrderConfirmedSubscriber.name);
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(
      // Safe cast: the registry is keyed by class name, so only
      // OrderConfirmedEvent reaches this callback.
      (event) => {
        void this.handle(event as OrderConfirmedEvent);
      },
      OrderConfirmedEvent.name,
    );
  }

  private async handle(event: OrderConfirmedEvent): Promise<void> {
    try {
      const result = await this.sendOrderConfirmationUseCase.execute({
        orderId: event.orderId.toValue(),
        customerId: event.customerId.toValue(),
      });

      if (result.isFailure()) {
        this.logger.error(
          { err: result.value, orderId: event.orderId.toValue() },
          'OnOrderConfirmedSubscriber falhou',
        );
      }
    } catch (error) {
      this.logger.error(
        { err: error, orderId: event.orderId.toValue() },
        'OnOrderConfirmedSubscriber falhou',
      );
    }
  }
}
```
