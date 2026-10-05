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
