import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/** SOURCE OF TRUTH: ThemeProvider, useTheme.
 * WHAT: configures next-themes with the class contract: `attribute="class"`, `light` and `dark`, no `system`.
 * WHY: the theme is UI shared between apps, so the provider lives in the package (frontend/theming, "Tema: contrato de classe e provider no `@metri/ui`").
 * WHERE: mounted around everything in apps/app-web/src/app/index.tsx; the inline script of apps/app-web/index.html reads the same `theme` key.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	return (
		<NextThemesProvider
			attribute="class"
			themes={['light', 'dark']}
			enableSystem={false}
		>
			{children}
		</NextThemesProvider>
	);
}

export { useTheme } from 'next-themes';
