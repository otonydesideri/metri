import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../../test/msw/server';
import { HomeStartPage } from './start-page';

const HEALTH_URL = `${window.location.origin}/api/health`;

function renderPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<HomeStartPage />
		</QueryClientProvider>,
	);
}

describe('HomeStartPage', () => {
	it('API fora do ar → o erro de leitura com a nova tentativa', async () => {
		let calls = 0;
		server.use(
			http.get(HEALTH_URL, () => {
				calls++;
				return calls === 1
					? HttpResponse.error()
					: HttpResponse.json({ status: 'ok', database: 'up' });
			}),
		);
		renderPage();

		expect(await screen.findByText('A API não respondeu')).toBeVisible();

		await userEvent.click(
			screen.getByRole('button', { name: 'Tentar de novo' }),
		);

		expect(await screen.findByText('Banco conectado')).toBeVisible();
		expect(screen.queryByText('A API não respondeu')).not.toBeInTheDocument();
	});

	it('banco fora do ar → a API responde e a página diz o que fazer', async () => {
		server.use(
			http.get(HEALTH_URL, () =>
				HttpResponse.json({ status: 'ok', database: 'down' }),
			),
		);
		renderPage();

		expect(await screen.findByText('API respondendo')).toBeVisible();
		expect(
			screen.getByText(
				'Banco fora do ar: suba o Postgres do projeto e recarregue a página',
			),
		).toBeVisible();
	});
});
