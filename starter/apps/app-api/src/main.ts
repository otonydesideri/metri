import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { EnvService } from './infra/common/env/env.service';
import { registerRequestIdHook } from './infra/common/request-id/request-id.hook';

/** SOURCE OF TRUTH: bootstrap.
 * WHAT: creates the app on the `FastifyAdapter` with a UUID per request and `TRUST_PROXY` trusted proxy hops, swaps Nest's logger for nestjs-pino, returns the `X-Request-Id`, applies the `/api` prefix and listens on the `PORT` of the env.
 * WHY: only what depends on the process lives here; what must also hold in the e2e lives in `AppModule` (infrastructure/runtime, "O bootstrap do processo"). The adapter is born before the app, so the env comes from an `EnvService` of its own.
 * WHERE: the process entry, run from `dist/main.mjs` by the `dev` and `start` scripts.
 */
async function bootstrap(): Promise<void> {
	const env = new EnvService();
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			genReqId: () => randomUUID(),
			trustProxy: env.getOrThrow('TRUST_PROXY'),
		}),
		{ bufferLogs: true, bodyParser: false },
	);

	app.useLogger(app.get(Logger));
	registerRequestIdHook(app.getHttpAdapter().getInstance());
	app.setGlobalPrefix('api');

	await app.listen(env.getOrThrow('PORT'), '0.0.0.0');
}

void bootstrap();
