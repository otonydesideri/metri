import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// app-api listens on the PORT of the root .env; parsed, not loaded, so its NODE_ENV stays out of Vite
const ROOT_ENV = new URL('../../.env', import.meta.url);
const rootEnv = existsSync(ROOT_ENV)
	? parseEnv(readFileSync(ROOT_ENV, 'utf8'))
	: {};
const WEB_PORT = Number(process.env.WEB_PORT ?? 5279);
const API_PORT = Number(process.env.API_PORT ?? rootEnv.PORT ?? 3333);

/** SOURCE OF TRUTH: the Vite and Vitest config of app-web.
 * WHAT: the dev server on its own port (`WEB_PORT`, strict), forwarding `/api` to app-api (`API_PORT`, or the `PORT` of the root .env), and the unit tests in jsdom.
 * WHY: page and API share one origin (frontend/data-fetching, "O cliente HTTP"); a taken port is an error, never another project's server answering (frontend/testing, "E2e de critério de UI").
 * WHERE: read by Vite and Vitest; playwright.config.ts sets both ports from `E2E_PORT`.
 */
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { tsconfigPaths: true },
	server: {
		port: WEB_PORT,
		strictPort: true,
		proxy: { '/api': `http://127.0.0.1:${API_PORT}` },
	},
	test: {
		passWithNoTests: true,
		environment: 'jsdom',
		include: ['src/**/*.spec.{ts,tsx}'],
		setupFiles: ['test/setup.ts'],
	},
});
