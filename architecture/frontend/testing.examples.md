# Testes do frontend: exemplos

## orderRules.resolveDestination

```ts
// src/shared/rules/order.rule.spec.ts
describe('orderRules.resolveDestination', () => {
  it('pedido confirmado na rota de edição → rota de detalhe', () => {
    const destination = orderRules.resolveDestination({
      status: 'CONFIRMED',
      pathname: '/orders/order-1/edit',
    });

    expect(destination).toBe('/orders/order-1');
  });

  it('pedido confirmado na rota de detalhe → null', () => {
    const destination = orderRules.resolveDestination({
      status: 'CONFIRMED',
      pathname: '/orders/order-1',
    });

    expect(destination).toBe(null);
  });
});
```

## useConfirmOrder

```tsx
// src/hooks/order/use-confirm-order.spec.tsx
const APP_URL = window.location.origin;

describe('useConfirmOrder', () => {
  it('confirmação bem-sucedida → detalhe do pedido atualizado no cache', async () => {
    server.use(
      http.post(`${APP_URL}/api/orders/order-1/confirm`, () =>
        HttpResponse.json({
          order: { id: 'order-1', status: 'CONFIRMED', updatedAt: '2026-01-01T00:00:00.000Z' },
          invoice: { id: 'invoice-1' },
        }),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(orderKeys.detail('order-1'), makeOrder({ id: 'order-1' }).order);

    const { result } = renderHook(() => useConfirmOrder(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current.mutate('order-1');

    await waitFor(() => {
      expect(queryClient.getQueryData(orderKeys.detail('order-1'))).toMatchObject({
        status: 'CONFIRMED',
        invoice: { id: 'invoice-1' },
      });
    });
  });
});
```

## makeOrder

```ts
// test/factories/make-order.factory.ts
import { faker } from '@faker-js/faker';
import type { OrderStatus } from '@/api/model.zod';

interface OrderPayload {
  id: string;
  customerName: string;
  status: OrderStatus;
  totalInCents: number;
}

// the detail arrives as an envelope ({ order }): the override applies to the inner object
export function makeOrder(override: Partial<OrderPayload> = {}): { order: OrderPayload } {
  return {
    order: {
      id: faker.string.uuid(),
      customerName: faker.person.fullName(),
      status: 'DRAFT',
      totalInCents: faker.number.int({ min: 1000, max: 100_000 }),
      ...override,
    },
  };
}
```

## playwright.config

```ts title="apps/app-web/playwright.config.ts"
import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.E2E_PORT ?? 5290);
const API_PORT = E2E_PORT + 1;
const APP_URL = `http://localhost:${E2E_PORT}`;

/** SOURCE OF TRUTH: the Playwright config of app-web.
 * WHAT: runs the `*.e2e.ts` files under `e2e/` on the `desktop` (Desktop Chrome) and `mobile` (Pixel 7) projects, against app-api on `E2E_PORT + 1` and the Vite dev server on `E2E_PORT`, which serves the page and `/api` on one origin.
 * WHY: each worktree gets its own `E2E_PORT`, and `reuseExistingServer: false` keeps the e2e from hitting another project's server (frontend/testing, "E2e de critério de UI").
 * WHERE: run by `pnpm --filter app-web test:e2e`; app-api reads the root `.env` and fails at boot when its database does not answer, and the environment wins.
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: APP_URL,
		locale: 'pt-BR',
		trace: 'retain-on-failure',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: [
		{
			command: 'pnpm --filter app-api build && pnpm --filter app-api start',
			url: `http://127.0.0.1:${API_PORT}/api/health`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: { NODE_ENV: 'test', PORT: String(API_PORT) },
		},
		{
			command: 'pnpm dev',
			url: APP_URL,
			reuseExistingServer: false,
			timeout: 60_000,
			env: { WEB_PORT: String(E2E_PORT), API_PORT: String(API_PORT) },
		},
	],
});
```

## saveEvidence

```ts title="apps/app-web/e2e/evidence.ts"
// The evidence of a UI criterion (frontend/testing, "E2e de critério de UI"; frontend/experience, "Desktop,
// mobile e evidência"): the full page at `.metri/tickets/<id>/<n>-<project>.png`, from the repository root
// (also in a worktree), with `<n>` the criterion's order and `<project>` the Playwright `desktop` or `mobile`.
// It saves only when METRI_EVIDENCE is the spec's ticket id: /build sets it when running the ticket's e2e, and
// the full suite runs without it, so it never rewrites the evidence of a done ticket.

import { resolve } from 'node:path';
import type { Page, TestInfo } from '@playwright/test';

const TICKETS_DIR = resolve(import.meta.dirname, '../../../.metri/tickets');

export async function saveEvidence(
	page: Page,
	ticketId: string,
	criterion: number,
	testInfo: TestInfo,
): Promise<void> {
	if (process.env.METRI_EVIDENCE !== ticketId) {
		return;
	}
	await page.screenshot({
		path: resolve(
			TICKETS_DIR,
			ticketId,
			`${criterion}-${testInfo.project.name}.png`,
		),
		fullPage: true,
	});
}
```

## structure.spec

```ts title="apps/app-web/src/structure.spec.ts"
// The structure spec (frontend/testing, "Spec de estrutura"): asserts the file tree, not behavior. Each failure
// says whose piece it is and where it goes. A structural rule enters here only when its violation is silent.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = dirname(fileURLToPath(import.meta.url));
// src/api is generated (frontend/structure)
const GENERATED_DIRS = [join(SRC, 'api')];
const ENTRY_SUFFIXES = ['', '-page', '-layout'];
const RESOLVE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
const COMPONENT =
	/^(?:export\s+)?(?:default\s+)?(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*=\s*(?:\(|memo\(|forwardRef\())/gm;
const COMPOUND_EXPORT = /^export\s*\{[^}]*\bas\b[^}]*\}/m;
const IMPORT = /(?:from\s+|import\()\s*'([^']+)'/g;

const rel = (path: string) => relative(SRC, path);

function sourceFiles(dir = SRC): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			return GENERATED_DIRS.includes(path) ? [] : sourceFiles(path);
		}
		return /\.tsx?$/.test(name) ? [path] : [];
	});
}

// An owner folder is recognized by its entry file, named after it (frontend/structure, "A pasta do dono").
function entryOf(dir: string): string | undefined {
	return ENTRY_SUFFIXES.map((suffix) =>
		join(dir, `${basename(dir)}${suffix}.tsx`),
	).find(existsSync);
}

function resolveImport(
	importer: string,
	specifier: string,
): string | undefined {
	const base = specifier.startsWith('@/')
		? join(SRC, specifier.slice(2))
		: specifier.startsWith('.')
			? resolve(dirname(importer), specifier)
			: undefined;
	return base === undefined
		? undefined
		: RESOLVE_SUFFIXES.map((suffix) => `${base}${suffix}`).find(
				(path) => existsSync(path) && statSync(path).isFile(),
			);
}

describe('estrutura do app-web', () => {
	const files = sourceFiles();

	it('um arquivo .tsx declara um componente', () => {
		const problems = files
			.filter((file) => file.endsWith('.tsx') && !file.includes('.spec.'))
			.flatMap((file) => {
				const text = readFileSync(file, 'utf8');
				const names = [...text.matchAll(COMPONENT)].map(
					(match) => match[1] ?? match[2],
				);
				return names.length > 1 && !COMPOUND_EXPORT.test(text)
					? [
							`${rel(file)} declara ${names.join(', ')}: o segundo componente vira arquivo próprio, na casa que "se o dono some, isso some junto?" decide (frontend/components, "Um arquivo, um componente")`,
						]
					: [];
			});

		expect(problems).toEqual([]);
	});

	it('de fora da pasta do dono, só a entrada dela é importada', () => {
		const problems = files.flatMap((importer) =>
			[...readFileSync(importer, 'utf8').matchAll(IMPORT)].flatMap(
				([, specifier]) => {
					const target = resolveImport(importer, specifier);
					if (!target) {
						return [];
					}
					const found: string[] = [];
					for (
						let dir = dirname(target);
						dir.startsWith(`${SRC}/`);
						dir = dirname(dir)
					) {
						const entry = entryOf(dir);
						if (entry && target !== entry && !importer.startsWith(`${dir}/`)) {
							found.push(
								`${rel(importer)} importa ${rel(target)}, peça de ${rel(dir)}/: só ${basename(entry)} sai da pasta; a peça que outro usa sobe para a casa mais estreita que cobre os dois (frontend/structure, "A pasta do dono")`,
							);
						}
					}
					return found;
				},
			),
		);

		expect(problems).toEqual([]);
	});

	it('shared/rules e shared/utils não importam React', () => {
		const problems = files
			.filter((file) => /\/shared\/(rules|utils)\//.test(file))
			.filter((file) =>
				/from\s+'react(?:-dom)?(?:\/[^']*)?'/.test(readFileSync(file, 'utf8')),
			)
			.map(
				(file) =>
					`${rel(file)} importa React: a regra de UI e a função pura ficam sem React (frontend/helpers)`,
			);

		expect(problems).toEqual([]);
	});
});
```

## MSW server

```ts title="apps/app-web/test/msw/server.ts"
import { setupServer } from 'msw/node';

// No default handler on purpose: each spec declares, with `server.use(...)`, the response its assertion
// depends on (frontend/testing, "O dublê de rede é um só").
export const server = setupServer();
```

## setup

```ts title="apps/app-web/test/setup.ts"
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach } from 'vitest';
import { server } from './msw/server';

// At the top of the file, never in beforeAll: a client that resolves `fetch` at module evaluation would
// escape the double (frontend/testing, "O dublê de rede é um só").
server.listen({ onUnhandledRequest: 'error' });

afterEach(() => {
	cleanup();
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});
```
