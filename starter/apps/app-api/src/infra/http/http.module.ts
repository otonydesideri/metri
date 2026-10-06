import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';

/** SOURCE OF TRUTH: HttpModule.
 * WHAT: the HTTP port of the business modules: each per-action controller in `controllers`, with the use cases it injects in `providers`, grouped by an area comment.
 * WHY: business composition stays in one module, apart from the external infra endpoints (backend/http-api; infrastructure/runtime).
 * WHERE: imported by `AppModule`; the repositories arrive through `PersistenceModule`. The first UC adds its controller here.
 */
@Module({
	imports: [PersistenceModule],
	controllers: [],
	providers: [],
})
export class HttpModule {}
