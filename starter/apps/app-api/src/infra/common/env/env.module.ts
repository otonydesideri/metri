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
