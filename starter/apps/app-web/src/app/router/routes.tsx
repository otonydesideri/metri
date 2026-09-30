import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppSplash } from '@/shared/components/app-splash/app-splash';
import { AppLayout } from '../layouts/app/app-layout';

const HomeStartPage = lazy(() =>
	import('@/pages/home/start/start-page').then((m) => ({
		default: m.HomeStartPage,
	})),
);

const NotFoundPage = lazy(() =>
	import('@/pages/errors/not-found/not-found-page').then((m) => ({
		default: m.NotFoundPage,
	})),
);

/** SOURCE OF TRUTH: AppRoutes.
 * WHAT: the route groups of app-web: the `AppLayout` group, with the start page, and the `*` route with the not-found page.
 * WHY: every page enters by `React.lazy`, with the `Suspense` in the group's wrapper, never around `Routes`; the `*` route has its own (frontend/routing, "Página carregada com lazy").
 * WHERE: mounted by `App`; the first UC replaces the start page and adds its group and guards here.
 */
export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route index element={<HomeStartPage />} />
			</Route>
			<Route
				path="*"
				element={
					<Suspense fallback={<AppSplash />}>
						<NotFoundPage />
					</Suspense>
				}
			/>
		</Routes>
	);
}
