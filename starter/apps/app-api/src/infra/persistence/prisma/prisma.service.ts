import { PrismaClient } from '@metri/db/client';
import {
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvService } from '../../common/env/env.service';

// how long a connection attempt waits before the boot fails
const CONNECTION_TIMEOUT_MS = 3_000;

// The Postgres answer the driver adapter attaches to the error; absent when the server never answered.
type DriverCause = { kind?: string; originalMessage?: string };

function driverCauseOf(error: unknown): DriverCause {
	const { meta } = error as {
		meta?: { driverAdapterError?: { cause?: DriverCause } };
	};
	return meta?.driverAdapterError?.cause ?? {};
}

// What to do, in the boot error: the Postgres off, the database missing or the connection refused.
function unreachableMessage(databaseUrl: string, error: unknown): string {
	const url = new URL(databaseUrl);
	const address = `${url.hostname}:${url.port || '5432'}`;
	const database = url.pathname.slice(1);
	const { kind, originalMessage } = driverCauseOf(error);
	if (kind === undefined) {
		return `O Postgres do DATABASE_URL (.env da raiz) não responde em ${address}. Suba o banco com pnpm db:up, ou o Postgres que o projeto usa, e rode de novo.`;
	}
	if (kind === 'DatabaseDoesNotExist') {
		return `O banco ${database} não existe no Postgres de ${address}. Crie-o com as migrations: pnpm --filter @metri/db migrate:dev.`;
	}
	return `O Postgres de ${address} recusou a conexão ao banco ${database} (${originalMessage ?? kind}). Confira o DATABASE_URL do .env da raiz.`;
}

/** SOURCE OF TRUTH: PrismaService.
 * WHAT: builds the @metri/db `PrismaClient` with the Postgres driver adapter, reading DATABASE_URL through `EnvService` in the constructor; on module init, fails the boot within seconds, saying what to do, when the database does not answer; disconnects on module destroy.
 * WHY: a client is born in the constructor, never at the top level of a file (infrastructure/runtime, "Env e montagem de client"; backend/persistence); without the check at boot, a database that is off only shows up in the first request (infrastructure/runtime, "Banco de desenvolvimento").
 * WHERE: injected, through `client`, by the repositories and queries of infra/persistence/prisma, by `DatabaseHealth` and by the test factories; never by a controller or a use case (backend/boundaries).
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
	readonly client: PrismaClient;
	private readonly databaseUrl: string;

	constructor(env: EnvService) {
		this.databaseUrl = env.getOrThrow('DATABASE_URL');
		this.client = new PrismaClient({
			adapter: new PrismaPg({
				connectionString: this.databaseUrl,
				connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
			}),
		});
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.client.$queryRaw`SELECT 1`;
		} catch (error) {
			// without the cause: the message says what to do, and the driver's stack would bury it
			throw new Error(unreachableMessage(this.databaseUrl, error));
		}
	}

	async onModuleDestroy(): Promise<void> {
		await this.client.$disconnect();
	}
}
