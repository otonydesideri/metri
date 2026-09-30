import { defineConfig } from 'vitest/config';

/** SOURCE OF TRUTH: the unit Vitest config of app-api.
 * WHAT: runs the `*.spec.ts` files under `src/` with no setup, in `pnpm test`; accepts a path filter (`pnpm --filter app-api test <filter>`).
 * WHY: unit and e2e are separate configs, and only the e2e one creates a database (backend/testing, "Convenção de nome e execução").
 * WHERE: read by Vitest through the `test` script; the e2e config is vitest.config.e2e.ts.
 */
export default defineConfig({
	test: {
		include: ['src/**/*.spec.ts'],
		passWithNoTests: true,
	},
});
