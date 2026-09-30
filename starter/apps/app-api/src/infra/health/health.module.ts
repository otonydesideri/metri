import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/** SOURCE OF TRUTH: HealthModule.
 * WHAT: the module of the external infra endpoints.
 * WHY: they belong to no business module and inherit none of their imports (infrastructure/runtime, "Composição no `AppModule`").
 * WHERE: imported directly by `AppModule`, never by `HttpModule`.
 */
@Module({
	controllers: [HealthController],
})
export class HealthModule {}
