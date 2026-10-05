# Runtime da aplicação: exemplos

## bootstrap

```ts title="apps/app-api/src/main.ts"
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
```

## AppModule

```ts title="apps/app-api/src/app.module.ts"
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { createZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { EnvModule } from './infra/common/env/env.module';
import { toInvalidRequestException } from './infra/common/errors/to-invalid-request-exception';
import { UnexpectedErrorFilter } from './infra/common/errors/unexpected-error.filter';
import { HealthModule } from './infra/health/health.module';
import { HttpModule } from './infra/http/http.module';

const ZodValidationPipe = createZodValidationPipe({
	createValidationException: toInvalidRequestException,
});

/** SOURCE OF TRUTH: AppModule.
 * WHAT: the composition of app-api: the env, the modules and the global providers by `APP_*`.
 * WHY: the same module boots in the real process, through main.ts, and in the e2e, through `Test.createTestingModule`, so a global provider registered here is proved by the e2e (infrastructure/runtime, "Providers globais no grafo de módulos").
 * WHERE: created by main.ts, by openapi.ts in preview and by every e2e-spec.
 */
@Module({
	imports: [EnvModule, HealthModule, HttpModule],
	providers: [
		{ provide: APP_PIPE, useClass: ZodValidationPipe },
		{ provide: APP_FILTER, useClass: UnexpectedErrorFilter },
		// validates and serializes the response by the `@ZodResponse` DTO (backend/http-api)
		{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
	],
})
export class AppModule {}
```

## EnvService

```ts title="apps/app-api/src/infra/common/env/env.service.ts"
import { Injectable } from '@nestjs/common';
import { type Env, envSchema } from './env.validation';

/** SOURCE OF TRUTH: EnvService.
 * WHAT: validates `process.env` against `envSchema` when Nest instantiates it, and reads a variable by `getOrThrow(...)`.
 * WHY: the environment is read in one validated place, never through `process.env` or `ConfigService` (infrastructure/runtime, "Env e montagem de client").
 * WHERE: injected by whoever builds a client or a config, in the constructor or in a `useFactory` (`LoggerModule`, `PrismaService`).
 */
@Injectable()
export class EnvService {
	private readonly env: Env;

	constructor() {
		const result = envSchema.safeParse(process.env);
		if (!result.success) {
			const issues = result.error.issues
				.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
				.join('; ');
			throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
		}
		this.env = result.data;
	}

	getOrThrow<Key extends keyof Env>(key: Key): Env[Key] {
		const value = this.env[key];
		if (value === undefined) {
			throw new Error(`Variável de ambiente ausente: ${key}`);
		}
		return value;
	}
}
```

## compose.yaml

```yaml title="compose.yaml"
# The development Postgres of the Docker path (node_modules/metri/architecture/infrastructure/runtime.md, "Banco de
# desenvolvimento"): `pnpm db:up` starts it and waits for the healthcheck, `pnpm db:down` removes the container and
# keeps the volume. One per project, shared by every worktree. User, password and database are the ones of the
# DATABASE_URL of .env.example; the host port is the POSTGRES_PORT of the root .env, which compose reads.
name: __PROJECT__

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: __PROJECT__
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      # over TCP: while the image initializes the database, the server answers only on the socket
      test: ["CMD", "pg_isready", "-q", "-h", "127.0.0.1", "-U", "postgres", "-d", "__PROJECT__"]
      interval: 1s
      timeout: 3s
      retries: 30
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```
