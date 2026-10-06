import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module';
import { PrismaService } from './prisma.service';

describe('banco isolado do e2e', () => {
	let app: INestApplication;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		await app.init();

		prisma = moduleRef.get(PrismaService);
	});

	afterAll(async () => {
		await app.close();
	});

	it('conecta num banco novo, só deste arquivo', async () => {
		const [databaseOnDatabase] = await prisma.$queryRaw<
			{ name: string }[]
		>`SELECT current_database() AS name`;

		expect(databaseOnDatabase?.name).toMatch(/_e2e_[0-9a-f]{32}$/);
	});
});
