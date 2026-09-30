import type { ApiErrorResponse } from '@metri/core/errors';
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
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
 * WHERE: registered by `APP_FILTER` in `AppModule`; the 401 of `AccessGuard` and the 429 of the throttler go through it. It does not log: `LoggerErrorInterceptor` logs the real error.
 */
@Catch()
export class UnexpectedErrorFilter implements ExceptionFilter {
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

			// the framework's native HttpException (404, 401, 429): same status, body in the envelope
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
		reply.status(status).send(UNEXPECTED);
	}
}
