import { PrismaClient } from '@metri/db/postgres/app';
import {
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../../common/env/env.service';

/** SOURCE OF TRUTH: PrismaService.
 * WHAT: the @metri/db `PrismaClient` with the Postgres driver adapter, built from the DATABASE_URL of `EnvService`; connects on module init and disconnects on module destroy.
 * WHY: a client is born in the constructor, never at the top level of a file (infrastructure/runtime, "Env e montagem de client"; backend/persistence).
 * WHERE: injected by the repositories and queries of infra/persistence/prisma, by `DatabaseHealth` and by the test factories; never by a controller or a use case (backend/boundaries).
 */
@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor(env: EnvService) {
		super({
			adapter: new PrismaPg({
				connectionString: env.getOrThrow('DATABASE_URL'),
			}),
		});
	}

	async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	async onModuleDestroy(): Promise<void> {
		await this.$disconnect();
	}
}
