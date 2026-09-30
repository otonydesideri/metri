import type { ApiErrorResponse } from '@metri/core/errors';
import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

/** SOURCE OF TRUTH: UnexpectedErrorFilter.
 * WHAT: the global error filter: an `HttpException` that is already the envelope passes; a native one keeps its status with the body as `REQUEST_REJECTED`; anything else becomes a generic 500.
 * WHY: no native body or internal message reaches the client (backend/errors, "Erro inesperado: filtro global").
 * WHERE: registered by `APP_FILTER` in `AppModule`; the 401 of `AccessGuard` and the 429 of the throttler go through it. It does not log: `LoggerErrorInterceptor` logs the real error.
 */
@Catch()
export class UnexpectedErrorFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost): void {
		const reply = host.switchToHttp().getResponse<FastifyReply>();

		if (exception instanceof HttpException) {
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

		const unexpected: ApiErrorResponse = {
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Erro interno inesperado',
			type: 'INTERNAL_ERROR',
		};
		reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(unexpected);
	}
}
