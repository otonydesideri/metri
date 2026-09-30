import { Module } from '@nestjs/common';
import { EnvService } from './env.service';

/** SOURCE OF TRUTH: EnvModule.
 * WHAT: provides and exports the `EnvService`.
 * WHY: a module that builds a client imports it instead of reading the environment (infrastructure/runtime).
 * WHERE: imported by `AppModule`, by the `LoggerModule` factory and by `PersistenceModule`.
 */
@Module({
	providers: [EnvService],
	exports: [EnvService],
})
export class EnvModule {}
