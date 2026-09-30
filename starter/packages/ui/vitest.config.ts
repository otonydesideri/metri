import { defineConfig } from 'vitest/config';

/** SOURCE OF TRUTH: the Vitest config of @metri/ui.
 * WHAT: runs the package specs in `pnpm test`.
 * WHY: a package without a spec file must not break `pnpm verify` (defaults/stack, "Configuração de referência").
 * WHERE: read by Vitest.
 */
export default defineConfig({
	test: { passWithNoTests: true },
});
