# Stack padrão: exemplos

## biome.json

```json title="biome.json"
{
	"$schema": "https://biomejs.dev/schemas/2.5.14/schema.json",
	"vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
	"javascript": { "formatter": { "quoteStyle": "single" } },
	"css": { "parser": { "tailwindDirectives": true } },
	"files": {
		"includes": ["**", "!apps/app-web/src/api", "!apps/app-api/openapi.json"]
	},
	"linter": {
		"rules": {
			"preset": "recommended",
			"style": {
				"noRestrictedImports": {
					"level": "error",
					"options": {
						"paths": {
							"cn": "Import cn from '@metri/ui/lib/utils', the kit's cn (defaults/ui)."
						}
					}
				}
			}
		}
	},
	"overrides": [
		{
			"includes": ["packages/ui/src/components/ui/**"],
			"formatter": { "enabled": false },
			"assist": { "enabled": false },
			"linter": { "rules": { "preset": "none" } }
		},
		{
			"includes": ["apps/app-api/**"],
			"javascript": { "parser": { "unsafeParameterDecoratorsEnabled": true } },
			"linter": {
				"rules": {
					"style": { "useImportType": "off" },
					"complexity": { "noStaticOnlyClass": "off" }
				}
			}
		}
	]
}
```

## package.json da raiz

```json title="package.json"
{
	"name": "__PROJECT__",
	"version": "0.0.0",
	"private": true,
	"type": "module",
	"scripts": {
		"dev": "turbo run dev",
		"build": "turbo run build",
		"typecheck": "turbo run typecheck",
		"lint": "turbo run lint && metri check",
		"test": "turbo run test --",
		"verify": "metri verify",
		"api:generate": "pnpm --filter app-api api:generate && pnpm --filter app-web api:generate",
		"db:up": "docker compose up -d --wait",
		"db:down": "docker compose down"
	},
	"devEngines": {
		"packageManager": {
			"name": "pnpm",
			"version": "11.20.0",
			"onFail": "download"
		}
	},
	"devDependencies": {
		"@biomejs/biome": "2.5.14",
		"turbo": "2.11.5",
		"typescript": "6.0.3",
		"vitest": "5.0.2"
	}
}
```

## vitest.config

```ts title="apps/app-api/vitest.config.ts"
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
```
