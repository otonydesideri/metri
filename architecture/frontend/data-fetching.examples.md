# Busca de dados no frontend: exemplos

## useConfirmOrder

```ts
// hooks/order/use-confirm-order.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmOrder } from '@/api/order';
import { orderKeys } from './keys';
import type { OrderDetails } from '@/api/model.zod';

export function useConfirmOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => confirmOrder(id),
    onSuccess: ({ order, invoice }) => {
      // the response carries the new state — including the invoice issued in the
      // same commit: it goes into the detail cache without another trip to the server
      queryClient.setQueryData<OrderDetails>(orderKeys.detail(order.id), (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          status: order.status,
          updatedAt: order.updatedAt,
          invoice,
        };
      });
      // the list's sorting, filtering and count belong to the backend, and the order
      // may move to another page with the new status: invalidate
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
```

## useOrders

```ts
// hooks/order/use-orders.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { FetchOrdersParams } from '@/api/model.zod';
import { fetchOrders } from '@/api/order';
import { orderKeys } from './keys';

export function useOrders(filters: FetchOrdersParams) {
  const queryClient = useQueryClient();
  const { status, page, pageSize } = filters;

  const query = useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    placeholderData: (previous) => previous,
  });

  // primitive deps on purpose: the `filters` object changes reference on
  // every render and would fire the prefetch on every commit
  const total = query.data?.total;

  useEffect(() => {
    const hasNextPage = total !== undefined && page * pageSize < total;

    if (hasNextPage) {
      const nextFilters = { status, page: page + 1, pageSize };
      queryClient.prefetchQuery({
        queryKey: orderKeys.list(nextFilters),
        queryFn: () => fetchOrders(nextFilters),
      });
    }
  }, [total, status, page, pageSize, queryClient]);

  return query;
}
```

## useCancelOrder

```ts
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });
      const previous = queryClient.getQueryData<OrderDetails>(orderKeys.detail(id));
      queryClient.setQueryData<OrderDetails>(orderKeys.detail(id), (old) => {
        if (!old) {
          return old;
        }
        return { ...old, status: 'CANCELLED' };
      });
      return { previous };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(orderKeys.detail(id), context.previous);
      }
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}
```

## httpClient

```ts title="apps/app-web/src/lib/http/client.ts"
import type { ApiErrorResponse } from '@metri/core/errors';

/** SOURCE OF TRUTH: httpClient, ApiError.
 * WHAT: the single HTTP client, the mutator the generated functions of `api/` call, over `fetch`; an HTTP error becomes an `ApiError` with the backend envelope.
 * WHY: the URL is relative to the page's origin (the OpenAPI paths carry `/api`), so the cookie goes with no cross-origin setup (frontend/data-fetching, "O cliente HTTP").
 * WHERE: called by the functions Orval writes in src/api; in dev, the proxy of vite.config.ts takes `/api` to app-api.
 * React Query fills the error only if the function throws.
 */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly body: ApiErrorResponse | undefined,
	) {
		super(body?.message ?? `HTTP ${status}`);
	}
}

export async function httpClient<T>(
	url: string,
	init: RequestInit,
): Promise<T> {
	const response = await fetch(url, init);
	const body = response.status === 204 ? undefined : await response.json();
	if (!response.ok) {
		throw new ApiError(response.status, body);
	}
	return body as T;
}
```

## orval.config

```ts title="apps/app-web/orval.config.ts"
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
```

## App

```tsx title="apps/app-web/src/app/index.tsx"
import { ThemeProvider } from '@metri/ui/components/providers/theme-provider';
import { Toaster } from '@metri/ui/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { queryClient } from './providers/query-client';
import { AppRoutes } from './router/routes';

/** SOURCE OF TRUTH: App.
 * WHAT: the global providers around the router: `ThemeProvider`, `QueryClientProvider`, `BrowserRouter` with `AppRoutes`, and the `Toaster` beside the routes.
 * WHY: the composition of the app lives in `app/` (frontend/structure); the `Toaster` reads the theme, so it mounts inside the `ThemeProvider` (frontend/data-fetching).
 * WHERE: mounted by main.tsx.
 */
export function App() {
	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<AppRoutes />
					<Toaster />
				</BrowserRouter>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
```

## useHealth

```ts title="apps/app-web/src/hooks/health/use-health.ts"
import { useQuery } from '@tanstack/react-query';
import { health } from '@/api/health';
import { healthKeys } from './keys';

/** SOURCE OF TRUTH: useHealth.
 * WHAT: reads the API health, binding the key factory to the generated `health()` (`GET /api/health`).
 * WHY: a page reads server data through a query hook, never by calling the function itself (frontend/data-fetching, "Hooks de query").
 * WHERE: used by `HomeStartPage`.
 */
export function useHealth() {
	return useQuery({
		queryKey: healthKeys.all,
		queryFn: () => health(),
	});
}
```

## vite.config

```ts title="apps/app-web/vite.config.ts"
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const WEB_PORT = Number(process.env.WEB_PORT ?? 5279);
const API_PORT = Number(process.env.API_PORT ?? 3333);

/** SOURCE OF TRUTH: the Vite and Vitest config of app-web.
 * WHAT: the dev server on its own port (`WEB_PORT`, strict), forwarding `/api` to app-api (`API_PORT`, 3333 by default, the app-api `PORT`), and the unit tests in jsdom.
 * WHY: page and API share one origin (frontend/data-fetching, "O cliente HTTP"); a taken port is an error, never another project's server answering (frontend/testing, "E2e de critério de UI").
 * WHERE: read by Vite and Vitest; playwright.config.ts sets both ports from `E2E_PORT`.
 */
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { tsconfigPaths: true },
	server: {
		port: WEB_PORT,
		strictPort: true,
		proxy: { '/api': `http://127.0.0.1:${API_PORT}` },
	},
	test: {
		passWithNoTests: true,
		environment: 'jsdom',
		include: ['src/**/*.spec.{ts,tsx}'],
		setupFiles: ['test/setup.ts'],
	},
});
```
