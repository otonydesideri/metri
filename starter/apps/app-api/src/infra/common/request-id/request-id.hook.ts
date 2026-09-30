import type { FastifyInstance } from 'fastify';

/** SOURCE OF TRUTH: registerRequestIdHook, REQUEST_ID_HEADER.
 * WHAT: the first `onRequest` hook of the instance: returns the request id, the UUID of the adapter's `genReqId`, in the raw response.
 * WHY: the `X-Request-Id` finds the exact log lines of a request, also when the reply comes from outside Nest's cycle; the client's `x-request-id` is ignored (infrastructure/logging, "Agrupamento por request").
 * WHERE: registered at bootstrap, in main.ts.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

export function registerRequestIdHook(fastify: FastifyInstance): void {
	fastify.addHook('onRequest', (request, reply, done) => {
		reply.raw.setHeader(REQUEST_ID_HEADER, request.id);
		done();
	});
}
