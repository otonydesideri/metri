import { defineConfig } from 'vitest/config';

/** SOURCE OF TRUTH: the e2e Vitest config of app-api.
 * WHAT: runs the `*.e2e-spec.ts` files under `src/`, each mounting the whole `AppModule`, with `NODE_ENV=test` and `test/setup-e2e.ts` as setup, which loads the app-api `.env`.
 * WHY: each file gets a new Postgres database on the server of the DATABASE_URL, migrated and dropped at the end (backend/testing, "Convenção de nome e execução").
 * WHERE: read by Vitest through the `test:e2e` script, which accepts a path filter (`test:e2e health`).
 */
export default defineConfig({
	test: {
		include: ['src/**/*.e2e-spec.ts'],
		setupFiles: ['test/setup-e2e.ts'],
		env: { NODE_ENV: 'test' },
		hookTimeout: 30_000,
		passWithNoTests: true,
	},
});
