import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerErrorInterceptor, LoggerModule, type Params } from 'nestjs-pino';
import { createZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { AccessGuard } from './infra/common/access/access.guard';
import { EnvModule } from './infra/common/env/env.module';
import { EnvService } from './infra/common/env/env.service';
import type { NodeEnvironment } from './infra/common/env/env.validation';
import { toInvalidRequestException } from './infra/common/errors/to-invalid-request-exception';
import { UnexpectedErrorFilter } from './infra/common/errors/unexpected-error.filter';
import { RATE_LIMIT } from './infra/common/rate-limit/rate-limit.constants';
import { HealthModule } from './infra/health/health.module';
import { HttpModule } from './infra/http/http.module';

const LOG_LEVEL_BY_ENV: Record<NodeEnvironment, string> = {
	local: 'debug',
	development: 'debug',
	test: 'warn',
	production: 'info',
};

const ZodValidationPipe = createZodValidationPipe({
	createValidationException: toInvalidRequestException,
});

/** SOURCE OF TRUTH: AppModule.
 * WHAT: the composition of app-api: the env, the logger with level per environment and redaction, the rate limit, the modules and the global providers by `APP_*`.
 * WHY: the same module boots in the real process, through main.ts, and in the e2e, through `Test.createTestingModule`, so a global provider registered here is proved by the e2e (infrastructure/runtime, "Providers globais no grafo de módulos").
 * WHERE: created by main.ts, by openapi.ts in preview and by every e2e-spec.
 * Order: `LoggerErrorInterceptor` before the other interceptors; the throttler before the access guard.
 */
@Module({
	imports: [
		EnvModule,
		LoggerModule.forRootAsync({
			imports: [EnvModule],
			inject: [EnvService],
			useFactory: (env: EnvService) => {
				const nodeEnv = env.getOrThrow('NODE_ENV');
				const isHumanReadable =
					nodeEnv === 'local' || nodeEnv === 'development';
				const options: Params = {
					pinoHttp: {
						level: LOG_LEVEL_BY_ENV[nodeEnv],
						transport: isHumanReadable
							? {
									target: 'pino-pretty',
									options: {
										messageFormat: '{if context}[{context}] {end}{msg}',
										ignore: 'pid,hostname,context',
									},
								}
							: undefined,
						redact: {
							paths: [
								'req.headers.authorization',
								'req.headers.cookie',
								'res.headers["set-cookie"]',
								'res.headers.location',
							],
							censor: '[REDACTED]',
						},
					},
					assignResponse: true,
				};
				return options;
			},
		}),
		ThrottlerModule.forRoot([RATE_LIMIT]),
		HealthModule,
		HttpModule,
	],
	providers: [
		{ provide: APP_PIPE, useClass: ZodValidationPipe },
		{ provide: APP_FILTER, useClass: UnexpectedErrorFilter },
		{ provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
		// validates and serializes the response by the `@ZodResponse` DTO (backend/http-api)
		{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_GUARD, useClass: AccessGuard },
	],
})
export class AppModule {}
