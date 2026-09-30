import { PrismaClient } from '@metri/db/client';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../../common/env/env.service';

/** SOURCE OF TRUTH: PrismaService.
 * WHAT: builds the @metri/db `PrismaClient` with the Postgres driver adapter, reading DATABASE_URL through `EnvService` in the constructor, and disconnects on module destroy.
 * WHY: a client is born in the constructor, never at the top level of a file (infrastructure/runtime, "Env e montagem de client"; backend/persistence).
 * WHERE: injected, through `client`, by the repositories and queries of infra/persistence/prisma and by the test factories; never by a controller or a use case (backend/boundaries).
 */
@Injectable()
export class PrismaService implements OnModuleDestroy {
	readonly client: PrismaClient;

	constructor(env: EnvService) {
		this.client = new PrismaClient({
			adapter: new PrismaPg({
				connectionString: env.getOrThrow('DATABASE_URL'),
			}),
		});
	}

	async onModuleDestroy(): Promise<void> {
		await this.client.$disconnect();
	}
}
