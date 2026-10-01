import { Module } from '@nestjs/common';
import { UnitOfWork } from '../../domain/application/transactions/unit-of-work.contract';
import { EnvModule } from '../common/env/env.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaUnitOfWork } from './prisma/transactions/prisma-unit-of-work';
import { TransactionContext } from './prisma/transactions/transaction-context';

/** SOURCE OF TRUTH: PersistenceModule.
 * WHAT: registers the `PrismaService`, the `TransactionContext` it publishes the open transaction through, the `UnitOfWork` it backs, and, per area, each repository and display query as `{ provide: <Contract>, useClass: <Impl> }`, exporting the contracts.
 * WHY: the application depends on the contract, never on the implementation (backend/modules, "Registro nos módulos Nest centrais").
 * WHERE: imported by `HttpModule` and by the e2e that use a test factory. The first repository adds its provider here.
 */
@Module({
	imports: [EnvModule],
	providers: [
		PrismaService,
		TransactionContext,
		{ provide: UnitOfWork, useClass: PrismaUnitOfWork },
	],
	exports: [PrismaService, UnitOfWork],
})
export class PersistenceModule {}
