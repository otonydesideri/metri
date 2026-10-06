# Roteamento: exemplos

## AppRoutes

```tsx title="apps/app-web/src/app/router/routes.tsx"
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppSplash } from '@/shared/components/app-splash';
import { AppLayout } from '../layouts/app/app-layout';

const HomeStartPage = lazy(() =>
	import('@/pages/home/start/start-page').then((m) => ({
		default: m.HomeStartPage,
	})),
);

const ErrorsNotFoundPage = lazy(() =>
	import('@/pages/errors/not-found/not-found-page').then((m) => ({
		default: m.ErrorsNotFoundPage,
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
						<ErrorsNotFoundPage />
					</Suspense>
				}
			/>
		</Routes>
	);
}
```

## AppLayout

```tsx title="apps/app-web/src/app/layouts/app/app-layout.tsx"
import { useTheme } from '@metri/ui/components/providers/theme-provider';
import { Button } from '@metri/ui/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { AppSplash } from '@/shared/components/app-splash';
import { APP_NAME } from '@/shared/constants/app.constant';

/** SOURCE OF TRUTH: AppLayout.
 * WHAT: the app shell: a header with the project name and the theme switch, around the page's `Suspense` with the `AppSplash` fallback.
 * WHY: the layout stays mounted while sibling pages load, and only the page area falls back (frontend/routing, "Página carregada com lazy").
 * WHERE: the group element in `AppRoutes`; the design-system ticket gives it the shell of docs/DESIGN.md.
 */
export function AppLayout() {
	const { theme, setTheme } = useTheme();
	const isDark = theme === 'dark';

	function handleToggleTheme() {
		setTheme(isDark ? 'light' : 'dark');
	}

	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<header className="flex items-center justify-between border-b border-border px-4 py-3">
				<Link to="/" className="text-body-md-strong">
					{APP_NAME}
				</Link>
				<Button
					variant="ghost"
					size="icon"
					aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
					onClick={handleToggleTheme}
				>
					{isDark ? <Sun /> : <Moon />}
				</Button>
			</header>
			<main className="flex flex-1 flex-col">
				<Suspense fallback={<AppSplash />}>
					<Outlet />
				</Suspense>
			</main>
		</div>
	);
}
```

## AppSplash

```tsx title="apps/app-web/src/shared/components/app-splash.tsx"
/** SOURCE OF TRUTH: AppSplash.
 * WHAT: a fixed overlay on the canvas background, while a lazy page or a guard resolves.
 * WHY: the splash enters over the background index.html already painted, so the loading windows do not flash (frontend/routing, "Página carregada com lazy").
 * WHERE: the `Suspense` fallback of each group wrapper and of the `*` route; a guard renders it while it resolves.
 */
export function AppSplash() {
	return <div className="fixed inset-0 bg-background" />;
}
```
