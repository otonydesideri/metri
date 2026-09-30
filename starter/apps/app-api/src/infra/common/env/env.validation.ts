import { z } from 'zod';

/** SOURCE OF TRUTH: envSchema, Env, NodeEnvironment.
 * WHAT: the only list of the environment variables the process reads, validated at boot.
 * WHY: a missing or malformed variable fails the boot with the list of problems, not later in a request (infrastructure/runtime, "Env e montagem de client").
 * WHERE: parsed by `EnvService`; one of the two places of Zod outside infra/http/dtos (backend/boundaries).
 * A new variable enters here and is read only by `EnvService.getOrThrow(...)`.
 */
export const nodeEnvironments = [
	'local',
	'development',
	'test',
	'production',
] as const;

export type NodeEnvironment = (typeof nodeEnvironments)[number];

export const envSchema = z.object({
	NODE_ENV: z.enum(nodeEnvironments),
	PORT: z.coerce.number().int().positive().default(3333),
	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export type Env = z.infer<typeof envSchema>;
