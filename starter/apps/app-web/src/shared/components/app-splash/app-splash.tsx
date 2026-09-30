import { APP_NAME } from '@/shared/constants/app.constant';

/** SOURCE OF TRUTH: AppSplash.
 * WHAT: a fixed overlay on the canvas background, with the name appearing after a delay (`delay-300 fill-mode-backwards`).
 * WHY: the splash enters over the background index.html already painted, so the loading windows do not flash (frontend/routing, "Página carregada com lazy").
 * WHERE: the `Suspense` fallback of each group wrapper and of the `*` route; a guard renders it while it resolves.
 */
export function AppSplash() {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-background">
			<span className="animate-in fade-in delay-300 fill-mode-backwards text-display-sm text-foreground">
				{APP_NAME}
			</span>
		</div>
	);
}
