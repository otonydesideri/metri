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

## DomainError

```ts title="packages/core/src/errors/domain-error.ts"
/** SOURCE OF TRUTH: DomainError, DomainErrorType.
 * WHAT: the domain error base, with `type` and `code` fixed in each concrete class, and its semantic category.
 * WHY: the use case returns the error by `failure(...)`, never by `throw`, and the HTTP port maps the category to a status (backend/errors, "A base").
 * WHERE: concrete classes live in `<module>.errors.ts` of the owner module; `toHttpException` in apps/app-api maps them.
 * Closed enum: a new value only when no category describes the case; a used value never changes.
 */
export enum DomainErrorType {
	BUSINESS_RULE = 'BUSINESS_RULE',
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	CONFLICT = 'CONFLICT',
	AUTHORIZATION = 'AUTHORIZATION',
	VALIDATION = 'VALIDATION',
}

export abstract class DomainError extends Error {
	abstract readonly type: DomainErrorType;
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}
```

## ApiErrorResponse

```ts title="packages/core/src/errors/api-error.ts"
import type { DomainErrorType } from './domain-error';

/** SOURCE OF TRUTH: ApiErrorType, ApiErrorResponse.
 * WHAT: the single error envelope of the API and its `type`: the `DomainErrorType` values plus the categories only the HTTP port produces.
 * WHY: every error response, from the domain, the request format, the framework or unexpected, has one body (backend/errors, "O formato de resposta de erro").
 * WHERE: built by apps/app-api (`toHttpException`, `toInvalidRequestException`, `UnexpectedErrorFilter`); read by apps/app-web (`ApiError`).
 */
export type ApiErrorType =
	| `${DomainErrorType}`
	| 'INVALID_REQUEST'
	| 'INTERNAL_ERROR'
	| 'REQUEST_REJECTED';

export type ApiErrorResponse = {
	code: string;
	message: string;
	type: ApiErrorType;
};
```

## toHttpException

```ts title="apps/app-api/src/infra/common/errors/to-http-exception.ts"
import type { ApiErrorResponse } from '@metri/core/errors';
import { DomainError, DomainErrorType } from '@metri/core/errors';
import { HttpException, HttpStatus } from '@nestjs/common';

const STATUS_MAP: Record<DomainErrorType, number> = {
	[DomainErrorType.BUSINESS_RULE]: HttpStatus.UNPROCESSABLE_ENTITY,
	[DomainErrorType.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
	[DomainErrorType.CONFLICT]: HttpStatus.CONFLICT,
	[DomainErrorType.AUTHORIZATION]: HttpStatus.FORBIDDEN,
	[DomainErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
};

/** SOURCE OF TRUTH: toHttpException.
 * WHAT: turns a `DomainError` into an `HttpException` with the status of its category and the body in the single envelope.
 * WHY: translation is a table, not a `switch`: `Record<DomainErrorType, number>` breaks the build when the enum gains a value without a status (backend/errors, "Tradução para HTTP").
 * WHERE: called by the controller as `throw toHttpException(result.value)` when the use case returns `failure`.
 */
export function toHttpException(error: DomainError): HttpException {
	const body: ApiErrorResponse = {
		code: error.code,
		message: error.message,
		type: error.type,
	};
	const exception = new HttpException(body, STATUS_MAP[error.type]);
	return exception;
}
```

## toInvalidRequestException

```ts title="apps/app-api/src/infra/common/errors/to-invalid-request-exception.ts"
import type { ApiErrorResponse } from '@metri/core/errors';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ZodError } from 'zod';

/** SOURCE OF TRUTH: toInvalidRequestException.
 * WHAT: turns the `ZodError` of a body, query or param outside the schema into a 400 in the envelope, `INVALID_REQUEST_FORMAT`, one issue per field in `message`.
 * WHY: the HTTP format error has the same single envelope as every other error (backend/errors, "Erro de formato HTTP").
 * WHERE: composed into the global `ZodValidationPipe` of `AppModule` (`APP_PIPE`); each field message is written in Portuguese in the DTO schema.
 */
export function toInvalidRequestException(error: unknown): HttpException {
	const zodError = error as ZodError;
	const message = zodError.issues
		.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
		.join('; ');

	const body: ApiErrorResponse = {
		code: 'INVALID_REQUEST_FORMAT',
		message,
		type: 'INVALID_REQUEST',
	};
	const exception = new HttpException(body, HttpStatus.BAD_REQUEST);
	return exception;
}
```

## UnexpectedErrorFilter

```ts title="apps/app-api/src/infra/common/errors/unexpected-error.filter.ts"
import type { ApiErrorResponse } from '@metri/core/errors';
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

const UNEXPECTED: ApiErrorResponse = {
	code: 'INTERNAL_SERVER_ERROR',
	message: 'Erro interno inesperado',
	type: 'INTERNAL_ERROR',
};

/** SOURCE OF TRUTH: UnexpectedErrorFilter.
 * WHAT: the global error filter: a status of 500 or more, from an `HttpException` or not, becomes the generic `INTERNAL_ERROR` (a response outside its DTO included); below 500, an `HttpException` that is already the envelope passes, and a native one keeps its status with the body as `REQUEST_REJECTED`.
 * WHY: no native body or internal message reaches the client (backend/errors, "Erro inesperado: filtro global").
 * WHERE: registered by `APP_FILTER` in `AppModule`. It logs the 5xx with its stack (infrastructure/logging); below 500 it does not log.
 */
@Catch()
export class UnexpectedErrorFilter implements ExceptionFilter {
	private readonly logger = new Logger(UnexpectedErrorFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const reply = host.switchToHttp().getResponse<FastifyReply>();

		if (
			exception instanceof HttpException &&
			exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
		) {
			const status = exception.getStatus();
			const response = exception.getResponse();

			// toHttpException and toInvalidRequestException already built the envelope
			if (
				typeof response === 'object' &&
				'code' in response &&
				'type' in response
			) {
				reply.status(status).send(response);
				return;
			}

			// the framework's native HttpException (404, 405): same status, body in the envelope
			const rejected: ApiErrorResponse = {
				code: HttpStatus[status],
				message: 'Requisição não atendida',
				type: 'REQUEST_REJECTED',
			};
			reply.status(status).send(rejected);
			return;
		}

		// a 5xx HttpException, such as the serializer's for a response outside its DTO, keeps its status
		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;
		this.logger.error(
			exception instanceof Error ? exception.message : String(exception),
			exception instanceof Error ? exception.stack : undefined,
		);
		reply.status(status).send(UNEXPECTED);
	}
}
```
