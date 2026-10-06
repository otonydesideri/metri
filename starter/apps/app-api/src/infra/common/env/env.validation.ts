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
