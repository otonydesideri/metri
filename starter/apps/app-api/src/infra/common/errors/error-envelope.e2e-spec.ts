import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import { createZodDto } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppModule } from '../../../app.module';
import { Public } from '../access/public.decorator';

class ProbeBodyDto extends createZodDto(
	z.object({
		name: z.string('O nome é obrigatório.').min(1, 'O nome é obrigatório.'),
	}),
) {}

@Public()
@Controller('probe')
class ProbeController {
	@Post()
	@HttpCode(204)
	create(@Body() _body: ProbeBodyDto): void {}
}

describe('Envelope de erro (e2e)', () => {
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

	it('rota inexistente → 404 no envelope, sem o corpo nativo', async () => {
		const response = await request(app.getHttpServer()).get(
			'/api/rota-inexistente',
		);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			code: 'NOT_FOUND',
			message: 'Requisição não atendida',
			type: 'REQUEST_REJECTED',
		});
	});

	it('corpo fora do schema → 400 no envelope, com a mensagem do campo', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/probe')
			.send({ name: '' });

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			code: 'INVALID_REQUEST_FORMAT',
			message: 'name: O nome é obrigatório.',
			type: 'INVALID_REQUEST',
		});
	});

	it('corpo dentro do schema → passa pelo pipe', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/probe')
			.send({ name: 'Ana' });

		expect(response.status).toBe(204);
	});
});
