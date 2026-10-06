# Runtime da aplicação: exemplos

## bootstrap

```ts title="apps/app-api/src/main.ts"
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvService } from './infra/common/env/env.service';
import { createOpenApiDocument } from './infra/http/openapi-document';

/** SOURCE OF TRUTH: bootstrap.
 * WHAT: creates the app, applies the `/api` prefix, serves the OpenAPI docs at `/api/docs` outside production and listens on the `PORT` of the env.
 * WHY: only what depends on the process lives here; what must also hold in the e2e lives in `AppModule` (infrastructure/runtime, "O bootstrap do processo").
 * WHERE: the process entry, run from `dist/main.mjs` by the `dev` and `start` scripts.
 */
async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	const env = app.get(EnvService);

	app.setGlobalPrefix('api');
	if (env.getOrThrow('NODE_ENV') !== 'production') {
		SwaggerModule.setup('api/docs', app, () => createOpenApiDocument(app));
	}

	await app.listen(env.getOrThrow('PORT'));
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
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from './env.validation';

/** SOURCE OF TRUTH: EnvService.
 * WHAT: reads a validated variable by `getOrThrow(...)`, typed by `EnvVariables`.
 * WHY: the environment is read in one typed place, never through `process.env` (infrastructure/runtime, "Env e montagem de client").
 * WHERE: injected by whoever builds a client or a config, in the constructor or in a `useFactory` (`PrismaService`), and read by main.ts.
 */
@Injectable()
export class EnvService {
	constructor(private readonly config: ConfigService<EnvVariables, true>) {}

	getOrThrow<K extends keyof EnvVariables>(key: K): EnvVariables[K] {
		return this.config.getOrThrow(key, { infer: true });
	}
}
```

## EnvModule

```ts title="apps/app-api/src/infra/common/env/env.module.ts"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvService } from './env.service';
import { validate } from './env.validation';

/** SOURCE OF TRUTH: EnvModule.
 * WHAT: loads the `.env` of app-api into the `ConfigModule`, validated by `validate`, and provides and exports the `EnvService`.
 * WHY: a module that builds a client imports it instead of reading the environment (infrastructure/runtime, "Env e montagem de client").
 * WHERE: imported by `AppModule` and by `PersistenceModule`.
 */
@Module({
	imports: [ConfigModule.forRoot({ validate })],
	providers: [EnvService],
	exports: [EnvService],
})
export class EnvModule {}
```

## validate

```ts title="apps/app-api/src/infra/common/env/env.validation.ts"
import { z } from 'zod';

/** SOURCE OF TRUTH: envSchema, EnvVariables, validate.
 * WHAT: the only list of the environment variables app-api reads, from its own `.env`, and the validation that the `ConfigModule` runs once at boot.
 * WHY: a missing or malformed variable fails the boot with every problem at once (infrastructure/runtime, "Env e montagem de client").
 * WHERE: `validate` is passed to `ConfigModule.forRoot` in `EnvModule`; one of the two places of Zod outside infra/http/dtos (backend/boundaries).
 * A new variable enters here and is read only by `EnvService.getOrThrow(...)`.
 */
export const envSchema = z.object({
	NODE_ENV: z.enum(['local', 'development', 'test', 'production']),
	PORT: z.coerce.number().int().positive().default(3333),
	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export type EnvVariables = z.infer<typeof envSchema>;

// Runs once at the ConfigModule boot and aggregates every error at once, instead of each provider finding a broken
// variable at runtime, through `getOrThrow`, the first time it is instantiated.
export function validate(config: Record<string, unknown>): EnvVariables {
	const result = envSchema.safeParse(config);

	if (!result.success) {
		throw new Error(result.error.toString());
	}

	return result.data;
}
```

## compose.yaml

```yaml title="compose.yaml"
# The development Postgres of the Docker path (node_modules/metri/architecture/infrastructure/runtime.md, "Banco de
# desenvolvimento"): `pnpm db:up` starts it and waits for the healthcheck, `pnpm db:down` removes the container and
# keeps the volume. One per project, shared by every worktree. User, password and database are the ones of the
# DATABASE_URL of apps/app-api/.env.example; the host port is POSTGRES_PORT, 5432 by default.
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
