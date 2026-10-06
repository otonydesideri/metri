import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';

/** SOURCE OF TRUTH: DatabaseHealth.
 * WHAT: answers whether the Postgres of the DATABASE_URL answers a `SELECT 1` now.
 * WHY: a technical read of the adapter, which an infra area other than persistence may make with `PrismaService` (backend/boundaries, "Persistência"); the controller injects this class, never `PrismaService`.
 * WHERE: provided by `HealthModule` and injected by `HealthController`.
 */
@Injectable()
export class DatabaseHealth {
	constructor(private readonly prisma: PrismaService) {}

	async isUp(): Promise<boolean> {
		try {
			await this.prisma.$queryRaw`SELECT 1`;
			return true;
		} catch {
			return false;
		}
	}
}
