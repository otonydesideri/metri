import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';

const WEB_PORT = Number(process.env.WEB_PORT ?? 5279);
const API_PORT = Number(process.env.API_PORT ?? 3333);

/** SOURCE OF TRUTH: devServerProxy, the Vite and Vitest config of app-web.
 * WHAT: the dev server on its own port (`WEB_PORT`, strict), forwarding `/api` to app-api (`API_PORT`) without rewriting the Host or the cookie domain, and the two Vitest projects.
 * WHY: page and API share one origin (frontend/data-fetching, "O cliente HTTP"); a taken port is an error, never another project's server answering (frontend/testing, "E2e de critério de UI").
 * WHERE: read by Vite and Vitest; playwright.config.ts sets both ports from `E2E_PORT`; dev-server-proxy.spec.ts imports `devServerProxy`.
 * Vitest projects: `unit`, in jsdom with test/setup.ts, and `dev-server`, in node, only for the proxy spec.
 */
export const devServerProxy: Record<string, ProxyOptions> = {
	'/api': {
		target: `http://127.0.0.1:${API_PORT}`,
		changeOrigin: false,
		cookieDomainRewrite: false,
	},
};

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { tsconfigPaths: true },
	server: { port: WEB_PORT, strictPort: true, proxy: devServerProxy },
	test: {
		passWithNoTests: true,
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					environment: 'jsdom',
					include: ['src/**/*.spec.{ts,tsx}'],
					setupFiles: ['test/setup.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'dev-server',
					environment: 'node',
					include: ['dev-server-proxy.spec.ts'],
				},
			},
		],
	},
});
