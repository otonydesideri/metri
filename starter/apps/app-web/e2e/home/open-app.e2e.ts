import { expect, test } from '@playwright/test';

// the title of the docs page, from the OpenAPI document of app-api
const API_DOCS_TITLE = /__PROJECT__ API/;

test('o app abre em / com o nome do projeto, a API e o banco no ar, na mesma origem', async ({
	page,
}) => {
	const healthRequest = page.waitForRequest((request) =>
		request.url().endsWith('/api/health'),
	);

	await page.goto('/');

	await expect(
		page.getByRole('heading', { level: 1, name: '__PROJECT__' }),
	).toBeVisible();
	await expect(page.getByText('API respondendo')).toBeVisible();
	await expect(page.getByText('Banco conectado')).toBeVisible();
	await expect(page.getByText(/^metri \d+\.\d+\.\d+$/)).toBeVisible();
	const requestUrl = new URL((await healthRequest).url());
	expect(requestUrl.origin).toBe(new URL(page.url()).origin);
});

test('a documentação da API abre pela página inicial', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('link', { name: 'Documentação da API' }).click();

	await expect(page).toHaveURL(/\/api\/docs/);
	await expect(
		page.getByRole('heading', { name: API_DOCS_TITLE }),
	).toBeVisible();
});

test('endereço sem rota → página não encontrada, com a saída para o início', async ({
	page,
}) => {
	await page.goto('/endereco-que-nao-existe');

	await expect(
		page.getByRole('heading', { name: 'Página não encontrada' }),
	).toBeVisible();
	await page.getByRole('link', { name: 'Voltar ao início' }).click();
	await expect(
		page.getByRole('heading', { level: 1, name: '__PROJECT__' }),
	).toBeVisible();
});

test('o tema troca para o escuro pelo cabeçalho', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('button', { name: 'Ativar modo escuro' }).click();

	await expect(page.locator('html')).toHaveClass(/dark/);
});
