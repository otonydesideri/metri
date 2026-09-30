import { defineConfig } from 'orval';

/** SOURCE OF TRUTH: the Orval config of app-web.
 * WHAT: reads apps/app-api/openapi.json and writes in `src/api/` one function per endpoint (`api/<tag>.ts`) and the Zod schemas in `api/model.zod.ts`, over the `httpClient` of `lib/http/`.
 * WHY: the backend is the source of the API contract, and the client is generated from it (frontend/data-fetching, "Funções de API").
 * WHERE: run by the root `pnpm api:generate`, after the app-api generator; `api:drift` in `pnpm verify` fails when `src/api/` lags behind. Never edit `src/api/` by hand.
 */
export default defineConfig({
	appApi: {
		input: { target: '../app-api/openapi.json' },
		output: {
			mode: 'tags',
			target: 'src/api',
			schemas: { path: 'src/api/model.zod.ts', type: 'zod', mode: 'single' },
			client: 'fetch',
			clean: true,
			override: {
				mutator: { path: 'src/lib/http/client.ts', name: 'httpClient' },
				fetch: { includeHttpResponseReturnType: false },
				zod: { version: 4 },
			},
		},
	},
});
