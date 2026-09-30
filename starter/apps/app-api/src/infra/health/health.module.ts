import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { DatabaseHealth } from './database-health';
import { HealthController } from './health.controller';

/** SOURCE OF TRUTH: HealthModule.
 * WHAT: the module of the external infra endpoints, with the database check they read.
 * WHY: they belong to no business module and inherit none of their imports (infrastructure/runtime, "Composição no `AppModule`").
 * WHERE: imported directly by `AppModule`, never by `HttpModule`; `PrismaService` arrives through `PersistenceModule`.
 */
@Module({
	imports: [PersistenceModule],
	controllers: [HealthController],
	providers: [DatabaseHealth],
})
export class HealthModule {}
