import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// The project's one DATABASE_URL is in the root .env; a variable already in the environment (the CI) wins.
const ENV_FILE = new URL('../../.env', import.meta.url);
if (existsSync(ENV_FILE)) {
	process.loadEnvFile(ENV_FILE);
}

/** SOURCE OF TRUTH: the e2e Vitest config of app-api.
 * WHAT: runs the `*.e2e-spec.ts` files under `src/`, each mounting the whole `AppModule`, with `NODE_ENV=test`, the root `.env` loaded and `test/setup-e2e.ts` as setup.
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
