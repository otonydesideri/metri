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
