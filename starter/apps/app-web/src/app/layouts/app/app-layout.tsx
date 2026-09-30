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
			<main className="flex-1">
				<Suspense fallback={<AppSplash />}>
					<Outlet />
				</Suspense>
			</main>
		</div>
	);
}
