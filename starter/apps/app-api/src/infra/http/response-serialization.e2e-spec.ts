import { Controller, Get } from '@nestjs/common';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppModule } from '../../app.module';
import { Public } from '../common/access/public.decorator';

class ProbeResponseDto extends createZodDto(
	z.object({ probe: z.object({ name: z.string() }) }),
	{ codec: true },
) {}

@Public()
@Controller('probe')
class ProbeController {
	@Get('extra-field')
	@ZodResponse({ status: 200, type: ProbeResponseDto })
	extraField(): ProbeResponseDto {
		const probe = { name: 'Ana', secret: 'fora do contrato' };
		return { probe };
	}

	@Get('wrong-shape')
	@ZodResponse({ status: 200, type: ProbeResponseDto })
	wrongShape(): ProbeResponseDto {
		// the compiler would refuse this return; the cast proves what the runtime does with it
		return { probe: { name: 42 } } as unknown as ProbeResponseDto;
	}
}

describe('Serialização de resposta (e2e)', () => {
	let app: NestFastifyApplication;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
			controllers: [ProbeController],
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

	it('campo fora do DTO de resposta → sai do corpo', async () => {
		const response = await request(app.getHttpServer()).get(
			'/api/probe/extra-field',
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ probe: { name: 'Ana' } });
	});

	it('resposta fora do DTO → 500 no envelope, sem o retorno cru', async () => {
		const response = await request(app.getHttpServer()).get(
			'/api/probe/wrong-shape',
		);

		expect(response.status).toBe(500);
		expect(response.body).toEqual({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Requisição não atendida',
			type: 'REQUEST_REJECTED',
		});
	});
});
