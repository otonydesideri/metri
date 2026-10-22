import type { ApiErrorResponse } from '@metri/core/errors';
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const UNEXPECTED: ApiErrorResponse = {
	code: 'INTERNAL_SERVER_ERROR',
	message: 'Erro interno inesperado',
	type: 'INTERNAL_ERROR',
};

/** SOURCE OF TRUTH: UnexpectedErrorFilter.
 * WHAT: the global error filter: a status of 500 or more, from an `HttpException` or not, becomes the generic `INTERNAL_ERROR` (a response outside its DTO included); below 500, an `HttpException` that is already the envelope passes, and a native one, or a library's client error marked `expose`, keeps its status with the body as `REQUEST_REJECTED`.
 * WHY: no native body or internal message reaches the client (backend/errors, "Erro inesperado: filtro global").
 * WHERE: registered by `APP_FILTER` in `AppModule`. It logs the 5xx with its stack (infrastructure/logging); below 500 it does not log.
 */
@Catch()
export class UnexpectedErrorFilter implements ExceptionFilter {
	private readonly logger = new Logger(UnexpectedErrorFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const reply = host.switchToHttp().getResponse<Response>();
		const status = statusOf(exception);

		if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
			const response =
				exception instanceof HttpException
					? exception.getResponse()
					: undefined;

			// toHttpException and toInvalidRequestException already built the envelope
			if (
				typeof response === 'object' &&
				'code' in response &&
				'type' in response
			) {
				reply.status(status).send(response);
				return;
			}

			// the framework's native HttpException (404, 405) or a library's client error: same status, body in the envelope
			const rejected: ApiErrorResponse = {
				code: HttpStatus[status],
				message: 'Requisição não atendida',
				type: 'REQUEST_REJECTED',
			};
			reply.status(status).send(rejected);
			return;
		}

		this.logger.error(
			exception instanceof Error ? exception.message : String(exception),
			exception instanceof Error ? exception.stack : undefined,
		);
		reply.status(status).send(UNEXPECTED);
	}
}

// An HttpException keeps its status, a 5xx included (the serializer's, for a response outside its DTO). Any other
// error is 500, except a client error that its library marks safe to answer, `expose` with a 4xx `statusCode`
// (http-errors, as the body parser's 413 and 415); an SDK error with only a `statusCode` stays unexpected.
function statusOf(exception: unknown): number {
	if (exception instanceof HttpException) {
		return exception.getStatus();
	}
	const { statusCode, expose } = (exception ?? {}) as {
		statusCode?: unknown;
		expose?: unknown;
	};
	if (
		expose === true &&
		typeof statusCode === 'number' &&
		statusCode >= HttpStatus.BAD_REQUEST &&
		statusCode < HttpStatus.INTERNAL_SERVER_ERROR
	) {
		return statusCode;
	}
	return HttpStatus.INTERNAL_SERVER_ERROR;
}
