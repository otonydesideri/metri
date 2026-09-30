# Erros: exemplos

## order.errors.ts

```ts
import { DomainError, DomainErrorType } from '@metri/core/errors';

export class OrderNotFoundError extends DomainError {
  readonly type = DomainErrorType.RESOURCE_NOT_FOUND;
  readonly code = 'ORDER_NOT_FOUND';

  constructor(id: string) {
    super(`Pedido ${id} não encontrado`);
  }
}

export class OrderNumberAlreadyUsedError extends DomainError {
  readonly type = DomainErrorType.CONFLICT;
  readonly code = 'ORDER_NUMBER_ALREADY_USED';

  constructor(orderNumber: string) {
    super(`O número de pedido ${orderNumber} já está em uso`);
  }
}

export class EmptyOrderError extends DomainError {
  readonly type = DomainErrorType.VALIDATION;
  readonly code = 'EMPTY_ORDER';

  constructor() {
    super('Pedido precisa de ao menos um item');
  }
}
```
