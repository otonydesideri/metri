import { defineConfig } from 'tsdown';

/** SOURCE OF TRUTH: the tsdown build of app-api.
 * WHAT: bundles `src/main.ts` into `dist/main.mjs` and `src/openapi.ts` into `dist/openapi.mjs`, with the `@metri/*` packages inside the bundle.
 * WHY: tsx and esbuild do not emit the decorator metadata that Nest's injection and `api:generate` read; the `@metri/*` packages export TypeScript source (defaults/stack, "Backend").
 * WHERE: run by the `build`, `dev` and `api:generate` scripts; the decorator options come from tsconfig.json.
 */
export default defineConfig({
	entry: ['src/main.ts', 'src/openapi.ts'],
	platform: 'node',
	format: 'esm',
	outDir: 'dist',
	deps: { alwaysBundle: [/^@metri\//] },
});
