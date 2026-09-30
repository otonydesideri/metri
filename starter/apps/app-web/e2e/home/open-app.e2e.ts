import { expect, test } from '@playwright/test';

test('o app abre em / com o nome do projeto e fala com a API na mesma origem', async ({
	page,
}) => {
	const healthRequest = page.waitForRequest((request) =>
		request.url().endsWith('/api/health'),
	);

	await page.goto('/');

	await expect(
		page.getByRole('heading', { level: 1, name: '__PROJECT__' }),
	).toBeVisible();
	await expect(page.getByText('Servidor conectado.')).toBeVisible();
	const requestUrl = new URL((await healthRequest).url());
	expect(requestUrl.origin).toBe(new URL(page.url()).origin);
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
