import { Controller, Get } from '@nestjs/common';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module';
import { Public } from '../access/public.decorator';
import { RATE_LIMIT } from './rate-limit.constants';

@Public()
@Controller('probe')
class ProbeController {
	@Get()
	read(): { status: 'ok' } {
		return { status: 'ok' };
	}
}

async function mount(trustProxy: number): Promise<NestFastifyApplication> {
	const moduleRef: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
		controllers: [ProbeController],
	}).compile();

	// main.ts gives the adapter the `TRUST_PROXY` of the env; the e2e repeats it
	const app = moduleRef.createNestApplication<NestFastifyApplication>(
		new FastifyAdapter({ trustProxy }),
		{ bodyParser: false },
	);
	app.setGlobalPrefix('api');
	await app.init();
	await app.getHttpAdapter().getInstance().ready();
	return app;
}

async function exhaustLimit(
	app: NestFastifyApplication,
	forwardedFor: string,
): Promise<void> {
	for (let index = 0; index < RATE_LIMIT.limit; index++) {
		const response = await request(app.getHttpServer())
			.get('/api/probe')
			.set('X-Forwarded-For', forwardedFor);
		expect(
			response.status,
			`Request ${index + 1} falhou (${response.status}): ${JSON.stringify(response.body)}`,
		).toBeLessThan(400);
	}
}

describe('Rate limit global (e2e)', () => {
	describe('sem proxy na frente (TRUST_PROXY=0)', () => {
		let app: NestFastifyApplication;

		beforeAll(async () => {
			app = await mount(0);
		});

		afterAll(async () => {
			await app.close();
		});

		it('recusa a request acima do limite com 429 no envelope, com o X-Forwarded-For ignorado', async () => {
			await exhaustLimit(app, '203.0.113.10');

			const response = await request(app.getHttpServer())
				.get('/api/probe')
				.set('X-Forwarded-For', '203.0.113.20');

			expect(response.status).toBe(429);
			expect(response.body).toEqual({
				code: 'TOO_MANY_REQUESTS',
				message: 'Requisição não atendida',
				type: 'REQUEST_REJECTED',
			});
		});
	});

	describe('atrás de um proxy (TRUST_PROXY=1)', () => {
		let app: NestFastifyApplication;

		beforeAll(async () => {
			app = await mount(1);
		});

		afterAll(async () => {
			await app.close();
		});

		it('conta a cota pelo IP do cliente que o proxy informa', async () => {
			await exhaustLimit(app, '203.0.113.10');

			const exhausted = await request(app.getHttpServer())
				.get('/api/probe')
				.set('X-Forwarded-For', '203.0.113.10');
			const otherClient = await request(app.getHttpServer())
				.get('/api/probe')
				.set('X-Forwarded-For', '203.0.113.20');

			expect(exhausted.status).toBe(429);
			expect(otherClient.status).toBe(200);
		});
	});
});
