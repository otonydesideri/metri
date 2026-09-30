import { Module } from '@nestjs/common';
import { EnvModule } from '../common/env/env.module';
import { PrismaService } from './prisma/prisma.service';

/** SOURCE OF TRUTH: PersistenceModule.
 * WHAT: registers the `PrismaService` and, per area, each repository and display query as `{ provide: <Contract>, useClass: <Impl> }`, exporting the contract.
 * WHY: the application depends on the contract, never on the implementation (backend/modules, "Registro nos módulos Nest centrais").
 * WHERE: imported by `HttpModule` and by the e2e that use a test factory.
 */
@Module({
	imports: [EnvModule],
	providers: [PrismaService],
	exports: [PrismaService],
})
export class PersistenceModule {}
