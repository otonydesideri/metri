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
