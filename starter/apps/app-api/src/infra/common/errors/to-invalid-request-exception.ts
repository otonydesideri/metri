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
