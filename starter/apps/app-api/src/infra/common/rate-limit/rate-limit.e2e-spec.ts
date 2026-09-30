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

describe('Rate limit global (e2e)', () => {
	let app: NestFastifyApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
			controllers: [ProbeController],
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

	it('recusa a request acima do limite com 429 no envelope', async () => {
		for (let index = 0; index < RATE_LIMIT.limit; index++) {
			const response = await request(app.getHttpServer()).get('/api/probe');
			expect(
				response.status,
				`Request ${index + 1} falhou (${response.status}): ${JSON.stringify(response.body)}`,
			).toBeLessThan(400);
		}

		const response = await request(app.getHttpServer()).get('/api/probe');

		expect(response.status).toBe(429);
		expect(response.body).toEqual({
			code: 'TOO_MANY_REQUESTS',
			message: 'Requisição não atendida',
			type: 'REQUEST_REJECTED',
		});
	});
});
