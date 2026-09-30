import { defineConfig } from 'vitest/config';

process.loadEnvFile(`${import.meta.dirname}/../../.env.test`);

/** SOURCE OF TRUTH: the e2e Vitest config of app-api.
 * WHAT: runs the `*.e2e-spec.ts` files under `src/`, each mounting the whole `AppModule`, with the root `.env.test` loaded and `test/setup-e2e.ts` as setup.
 * WHY: each file gets a new Postgres database, migrated and dropped at the end (backend/testing, "Convenção de nome e execução").
 * WHERE: read by Vitest through the `test:e2e` script, which accepts a path filter (`test:e2e health`).
 * `loadEnvFile` never overwrites a variable already in the environment, so the CI wins.
 */
export default defineConfig({
	test: {
		include: ['src/**/*.e2e-spec.ts'],
		setupFiles: ['test/setup-e2e.ts'],
		hookTimeout: 30_000,
		passWithNoTests: true,
	},
});
