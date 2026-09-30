import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { RATE_LIMIT } from '../common/rate-limit/rate-limit.constants';
import { DatabaseHealth } from './database-health';

describe('GET /api/health (e2e)', () => {
	let app: NestFastifyApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication<NestFastifyApplication>(
			new FastifyAdapter(),
			{
				bodyParser: false,
			},
		);
		app.setGlobalPrefix('api');
		await app.init();
		await app.getHttpAdapter().getInstance().ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('responde 200, com o banco no ar', async () => {
		const response = await request(app.getHttpServer()).get('/api/health');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok', database: 'up' });
	});

	it('fica fora do rate limit global', async () => {
		const statuses: number[] = [];
		for (let index = 0; index <= RATE_LIMIT.limit; index++) {
			const response = await request(app.getHttpServer()).get('/api/health');
			statuses.push(response.status);
		}

		expect(statuses.every((status) => status === 200)).toBe(true);
	});

	describe('com o banco fora do ar', () => {
		let downApp: NestFastifyApplication;

		beforeAll(async () => {
			const moduleRef: TestingModule = await Test.createTestingModule({
				imports: [AppModule],
			})
				.overrideProvider(DatabaseHealth)
				.useValue({ isUp: async () => false })
				.compile();

			downApp = moduleRef.createNestApplication<NestFastifyApplication>(
				new FastifyAdapter(),
				{ bodyParser: false },
			);
			downApp.setGlobalPrefix('api');
			await downApp.init();
			await downApp.getHttpAdapter().getInstance().ready();
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
