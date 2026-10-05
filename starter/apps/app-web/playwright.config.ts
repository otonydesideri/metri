import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.E2E_PORT ?? 5290);
const API_PORT = E2E_PORT + 1;
const APP_URL = `http://localhost:${E2E_PORT}`;

/** SOURCE OF TRUTH: the Playwright config of app-web.
 * WHAT: runs the `*.e2e.ts` files under `e2e/` on the `desktop` (Desktop Chrome) and `mobile` (Pixel 7) projects, against app-api on `E2E_PORT + 1` and the Vite dev server on `E2E_PORT`, which serves the page and `/api` on one origin.
 * WHY: each worktree gets its own `E2E_PORT`, and `reuseExistingServer: false` keeps the e2e from hitting another project's server (frontend/testing, "E2e de critério de UI").
 * WHERE: run by `pnpm --filter app-web test:e2e`; app-api reads the root `.env` and fails at boot when its database does not answer, and the environment wins.
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: APP_URL,
		locale: 'pt-BR',
		trace: 'retain-on-failure',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: [
		{
			command: 'pnpm --filter app-api build && pnpm --filter app-api start',
			url: `http://127.0.0.1:${API_PORT}/api/health`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: { NODE_ENV: 'test', PORT: String(API_PORT) },
		},
		{
			command: 'pnpm dev',
			url: APP_URL,
			reuseExistingServer: false,
			timeout: 60_000,
			env: { WEB_PORT: String(E2E_PORT), API_PORT: String(API_PORT) },
		},
	],
});
