import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { health } from '@/api/health';
import { server } from '../../../test/msw/server';
import { ApiError } from './client';

const APP_URL = window.location.origin;

describe('httpClient', () => {
	it('rota gerada → sai na origem da página, sob /api', async () => {
		let requestedUrl: string | undefined;
		server.use(
			http.get(`${APP_URL}/api/health`, ({ request }) => {
				requestedUrl = request.url;
				return HttpResponse.json({ status: 'ok' });
			}),
		);

		const body = await health();

		expect(requestedUrl).toBe(`${APP_URL}/api/health`);
		expect(body).toEqual({ status: 'ok' });
	});

	it('resposta de erro → lança ApiError com o status e o envelope do backend', async () => {
		server.use(
			http.get(`${APP_URL}/api/health`, () =>
				HttpResponse.json(
					{
						type: 'INTERNAL_ERROR',
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Erro inesperado.',
					},
					{ status: 500 },
				),
			),
		);

		const error = await health().catch((thrown: unknown) => thrown);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			status: 500,
			message: 'Erro inesperado.',
			body: { type: 'INTERNAL_ERROR', code: 'INTERNAL_SERVER_ERROR' },
		});
	});
});
