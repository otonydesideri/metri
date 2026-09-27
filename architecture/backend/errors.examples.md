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

## UnexpectedErrorFilter

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Catch()
export class UnexpectedErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      // toHttpException e toInvalidRequestException já montaram o envelope
      if (typeof response === 'object' && 'code' in response && 'type' in response) {
        reply.status(status).send(response);
        return;
      }

      // HttpException nativa do framework: mesmo status, corpo no envelope
      reply.status(status).send({
        code: HttpStatus[status],
        message: 'Requisição não atendida',
        type: 'REQUEST_REJECTED',
      });
      return;
    }

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno inesperado',
      type: 'INTERNAL_ERROR',
    });
  }
}
```
