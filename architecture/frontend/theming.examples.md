# Tema: exemplos

## ThemeProvider

```tsx title="packages/ui/src/components/providers/theme-provider.tsx"
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
```

## index.html

```html title="apps/app-web/index.html"
<!doctype html>
<html lang="pt-BR">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>__PROJECT__</title>
		<!-- frontend/theming, "Tema: contrato de classe e provider no `@metri/ui`": the background paints before the
		first paint with the light and the dark --background of packages/ui/src/styles/globals.css, and the script
		reads the same key (`theme`) as the ThemeProvider (next-themes), with `light` as the default. -->
		<style>
			html {
				background: oklch(1 0 0);
			}
			html.dark {
				background: oklch(0.145 0 0);
			}
		</style>
		<script>
			document.documentElement.classList.add(
				localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
			);
		</script>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```
