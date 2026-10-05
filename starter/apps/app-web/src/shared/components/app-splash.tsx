/** SOURCE OF TRUTH: AppSplash.
 * WHAT: a fixed overlay on the canvas background, while a lazy page or a guard resolves.
 * WHY: the splash enters over the background index.html already painted, so the loading windows do not flash (frontend/routing, "Página carregada com lazy").
 * WHERE: the `Suspense` fallback of each group wrapper and of the `*` route; a guard renders it while it resolves.
 */
export function AppSplash() {
	return <div className="fixed inset-0 bg-background" />;
}
