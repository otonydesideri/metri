import { QueryClient } from '@tanstack/react-query';

/** SOURCE OF TRUTH: queryClient.
 * WHAT: the app's `QueryClient`, a module singleton with no global `staleTime`.
 * WHY: freshness is each hook's decision; there is no SSR to isolate (frontend/data-fetching, "Provider e configuração").
 * WHERE: mounted by the `QueryClientProvider` of app/index.tsx; specs build their own client, without retry.
 */
export const queryClient = new QueryClient();
