import { Controller, Get } from '@nestjs/common';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module';
import { Public } from './public.decorator';

@Controller('probe/undeclared')
class UndeclaredProbeController {
	@Get()
	read(): { status: 'ok' } {
		return { status: 'ok' };
	}
}

@Public()
@Controller('probe/public')
class PublicProbeController {
	@Get()
	read(): { status: 'ok' } {
		return { status: 'ok' };
	}
}

describe('Guard de acesso (e2e)', () => {
	let app: NestFastifyApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
			controllers: [UndeclaredProbeController, PublicProbeController],
		}).compile();

		app = moduleRef.createNestApplication<NestFastifyApplication>(
			new FastifyAdapter(),
			{ bodyParser: false },
		);
		app.setGlobalPrefix('api');
		await app.init();
		await app.getHttpAdapter().getInstance().ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('rota sem @Public() → 401 no envelope', async () => {
		const response = await request(app.getHttpServer()).get(
			'/api/probe/undeclared',
		);

		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			code: 'UNAUTHORIZED',
			message: 'Requisição não atendida',
			type: 'REQUEST_REJECTED',
		});
	});

	it('rota @Public() → passa', async () => {
		const response = await request(app.getHttpServer()).get(
			'/api/probe/public',
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'ok' });
	});
});
