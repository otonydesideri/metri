import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { DatabaseHealth } from './database-health';

describe('GET /api/health (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		app.setGlobalPrefix('api');
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('responde 200, com o banco no ar', async () => {
		const response = await request(app.getHttpServer()).get('/api/health');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok', database: 'up' });
	});

	describe('com o banco fora do ar', () => {
		let downApp: INestApplication;

		beforeAll(async () => {
			const moduleRef: TestingModule = await Test.createTestingModule({
				imports: [AppModule],
			})
				.overrideProvider(DatabaseHealth)
				.useValue({ isUp: async () => false })
				.compile();

			downApp = moduleRef.createNestApplication();
			downApp.setGlobalPrefix('api');
			await downApp.init();
		});

		afterAll(async () => {
			await downApp.close();
		});

		it('responde 200 com database: down', async () => {
			const response = await request(downApp.getHttpServer()).get(
				'/api/health',
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ status: 'ok', database: 'down' });
		});
	});
});
