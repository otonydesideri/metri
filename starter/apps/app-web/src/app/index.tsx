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
