import { defineConfig } from 'vitest/config';

/** SOURCE OF TRUTH: the Vitest config of @metri/ui.
 * WHAT: runs the package specs in `pnpm test`, with the Vitest defaults.
 * WHY: no `passWithNoTests` here, so a filter that matches no spec fails; the root `test` passes it for the whole suite (defaults/stack, "Configuração de referência").
 * WHERE: read by Vitest.
 */
export default defineConfig({});
