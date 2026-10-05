import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvService } from './infra/common/env/env.service';
import { createOpenApiDocument } from './infra/http/openapi-document';

/** SOURCE OF TRUTH: bootstrap.
 * WHAT: creates the app on the `FastifyAdapter`, applies the `/api` prefix, serves the OpenAPI docs at `/api/docs` outside production and listens on the `PORT` of the env.
 * WHY: only what depends on the process lives here; what must also hold in the e2e lives in `AppModule` (infrastructure/runtime, "O bootstrap do processo"). The env comes from an `EnvService` of its own, before the app.
 * WHERE: the process entry, run from `dist/main.mjs` by the `dev` and `start` scripts.
 */
async function bootstrap(): Promise<void> {
	const env = new EnvService();
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);

	app.setGlobalPrefix('api');
	if (env.getOrThrow('NODE_ENV') !== 'production') {
		SwaggerModule.setup('api/docs', app, () => createOpenApiDocument(app));
	}

	await app.listen(env.getOrThrow('PORT'), '0.0.0.0');
}

void bootstrap();
