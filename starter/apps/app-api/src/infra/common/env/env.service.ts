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
