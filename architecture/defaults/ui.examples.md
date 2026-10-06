# Kit de UI: exemplos

## globals.css

```css title="packages/ui/src/styles/globals.css"
/*
 * The theme of @metri/ui (defaults/ui, "Tema e dark mode do `app-web`"): the shadcn/ui theme variables, light
 * in `:root` and dark in `.dark`, and the typography in `@theme`. The values are the neutral base of
 * node_modules/metri/skills/shape/DESIGN-TEMPLATE.md until the project's docs/DESIGN.md exists; from then on
 * they follow it, and `pnpm design-tokens` compares the two. When `--background` changes, the inline <style>
 * of apps/app-web/index.html changes in the same edit (frontend/theming).
 * `@custom-variant dark` is the class contract of the theme, toggled by the `ThemeProvider` and by the
 * inline script of index.html. Two `@source`: `apps/`, which imports this file, and this package, whose
 * component classes would otherwise vanish from the final CSS. The fonts are variable and served by the project:
 * the @fontsource-variable packages, whose files Vite bundles with the app, never a CDN (defaults/ui).
 */

@import "tailwindcss";
@import "tw-animate-css";
@import "@fontsource-variable/geist";
@import "@fontsource-variable/geist-mono";
@source "../../../../apps/**/*.{ts,tsx}";
@source "../**/*.{ts,tsx}";

@custom-variant dark (&:is(.dark *));

:root {
	--radius: 0.625rem;

	--background: oklch(1 0 0);
	--foreground: oklch(0.145 0 0);
	--card: oklch(1 0 0);
	--card-foreground: oklch(0.145 0 0);
	--popover: oklch(1 0 0);
	--popover-foreground: oklch(0.145 0 0);
	--primary: oklch(0.205 0 0);
	--primary-foreground: oklch(0.985 0 0);
	--secondary: oklch(0.97 0 0);
	--secondary-foreground: oklch(0.205 0 0);
	--muted: oklch(0.97 0 0);
	--muted-foreground: oklch(0.556 0 0);
	--accent: oklch(0.97 0 0);
	--accent-foreground: oklch(0.205 0 0);
	--destructive: oklch(0.577 0.245 27.325);
	--border: oklch(0.922 0 0);
	--input: oklch(0.922 0 0);
	--ring: oklch(0.708 0 0);
	--chart-1: oklch(0.646 0.222 41.116);
	--chart-2: oklch(0.6 0.118 184.704);
	--chart-3: oklch(0.398 0.07 227.392);
	--chart-4: oklch(0.828 0.189 84.429);
	--chart-5: oklch(0.769 0.188 70.08);
	--sidebar: oklch(0.985 0 0);
	--sidebar-foreground: oklch(0.145 0 0);
	--sidebar-primary: oklch(0.205 0 0);
	--sidebar-primary-foreground: oklch(0.985 0 0);
	--sidebar-accent: oklch(0.97 0 0);
	--sidebar-accent-foreground: oklch(0.205 0 0);
	--sidebar-border: oklch(0.922 0 0);
	--sidebar-ring: oklch(0.708 0 0);
}

.dark {
	--background: oklch(0.145 0 0);
	--foreground: oklch(0.985 0 0);
	--card: oklch(0.205 0 0);
	--card-foreground: oklch(0.985 0 0);
	--popover: oklch(0.205 0 0);
	--popover-foreground: oklch(0.985 0 0);
	--primary: oklch(0.922 0 0);
	--primary-foreground: oklch(0.205 0 0);
	--secondary: oklch(0.269 0 0);
	--secondary-foreground: oklch(0.985 0 0);
	--muted: oklch(0.269 0 0);
	--muted-foreground: oklch(0.708 0 0);
	--accent: oklch(0.269 0 0);
	--accent-foreground: oklch(0.985 0 0);
	--destructive: oklch(0.704 0.191 22.216);
	--border: oklch(1 0 0 / 10%);
	--input: oklch(1 0 0 / 15%);
	--ring: oklch(0.556 0 0);
	--chart-1: oklch(0.488 0.243 264.376);
	--chart-2: oklch(0.696 0.17 162.48);
	--chart-3: oklch(0.769 0.188 70.08);
	--chart-4: oklch(0.627 0.265 303.9);
	--chart-5: oklch(0.645 0.246 16.439);
	--sidebar: oklch(0.205 0 0);
	--sidebar-foreground: oklch(0.985 0 0);
	--sidebar-primary: oklch(0.488 0.243 264.376);
	--sidebar-primary-foreground: oklch(0.985 0 0);
	--sidebar-accent: oklch(0.269 0 0);
	--sidebar-accent-foreground: oklch(0.985 0 0);
	--sidebar-border: oklch(1 0 0 / 10%);
	--sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
	--color-background: var(--background);
	--color-foreground: var(--foreground);
	--color-card: var(--card);
	--color-card-foreground: var(--card-foreground);
	--color-popover: var(--popover);
	--color-popover-foreground: var(--popover-foreground);
	--color-primary: var(--primary);
	--color-primary-foreground: var(--primary-foreground);
	--color-secondary: var(--secondary);
	--color-secondary-foreground: var(--secondary-foreground);
	--color-muted: var(--muted);
	--color-muted-foreground: var(--muted-foreground);
	--color-accent: var(--accent);
	--color-accent-foreground: var(--accent-foreground);
	--color-destructive: var(--destructive);
	--color-border: var(--border);
	--color-input: var(--input);
	--color-ring: var(--ring);
	--color-chart-1: var(--chart-1);
	--color-chart-2: var(--chart-2);
	--color-chart-3: var(--chart-3);
	--color-chart-4: var(--chart-4);
	--color-chart-5: var(--chart-5);
	--color-sidebar: var(--sidebar);
	--color-sidebar-foreground: var(--sidebar-foreground);
	--color-sidebar-primary: var(--sidebar-primary);
	--color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
	--color-sidebar-accent: var(--sidebar-accent);
	--color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
	--color-sidebar-border: var(--sidebar-border);
	--color-sidebar-ring: var(--sidebar-ring);

	/* The radius scale of docs/DESIGN.md, "Shapes": multiples of the base --radius. */
	--radius-sm: calc(var(--radius) * 0.6);
	--radius-md: calc(var(--radius) * 0.8);
	--radius-lg: var(--radius);
	--radius-xl: calc(var(--radius) * 1.4);
	--radius-2xl: calc(var(--radius) * 1.8);
	--radius-3xl: calc(var(--radius) * 2.2);
	--radius-4xl: calc(var(--radius) * 2.6);
}

@theme {
	--font-sans: "Geist Variable", system-ui, -apple-system, sans-serif;
	--font-mono:
		"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco,
		monospace;

	--text-display-xl: 48px;
	--text-display-xl--line-height: 48px;
	--text-display-xl--letter-spacing: -2.4px;
	--text-display-xl--font-weight: 600;

	--text-display-lg: 32px;
	--text-display-lg--line-height: 40px;
	--text-display-lg--letter-spacing: -1.28px;
	--text-display-lg--font-weight: 600;

	--text-display-md: 24px;
	--text-display-md--line-height: 32px;
	--text-display-md--letter-spacing: -0.96px;
	--text-display-md--font-weight: 600;

	--text-display-sm: 20px;
	--text-display-sm--line-height: 28px;
	--text-display-sm--letter-spacing: -0.6px;
	--text-display-sm--font-weight: 600;

	--text-body-lg: 18px;
	--text-body-lg--line-height: 28px;
	--text-body-lg--letter-spacing: 0px;
	--text-body-lg--font-weight: 400;

	--text-body-md: 16px;
	--text-body-md--line-height: 24px;
	--text-body-md--font-weight: 400;

	--text-body-md-strong: 16px;
	--text-body-md-strong--line-height: 24px;
	--text-body-md-strong--font-weight: 500;

	--text-body-sm: 14px;
	--text-body-sm--line-height: 20px;
	--text-body-sm--letter-spacing: -0.28px;
	--text-body-sm--font-weight: 400;

	--text-body-sm-strong: 14px;
	--text-body-sm-strong--line-height: 20px;
	--text-body-sm-strong--letter-spacing: -0.28px;
	--text-body-sm-strong--font-weight: 500;

	--text-caption: 12px;
	--text-caption--line-height: 16px;
	--text-caption--font-weight: 400;

	--text-caption-mono: 12px;
	--text-caption-mono--line-height: 16px;
	--text-caption-mono--font-weight: 400;

	--text-code: 13px;
	--text-code--line-height: 20px;
	--text-code--font-weight: 400;

	--text-button-md: 14px;
	--text-button-md--line-height: 20px;
	--text-button-md--font-weight: 500;

	--text-button-lg: 16px;
	--text-button-lg--line-height: 24px;
	--text-button-lg--font-weight: 500;
}

@layer base {
	* {
		@apply border-border outline-ring/50;
	}
	body {
		@apply bg-background text-foreground;
	}
}
```

## components.json

```json title="packages/ui/components.json"
{
	"$schema": "https://ui.shadcn.com/schema.json",
	"style": "new-york",
	"rsc": false,
	"tsx": true,
	"tailwind": {
		"config": "",
		"css": "src/styles/globals.css",
		"baseColor": "neutral",
		"cssVariables": true
	},
	"iconLibrary": "lucide",
	"aliases": {
		"components": "@metri/ui/components/blocks",
		"ui": "@metri/ui/components/ui",
		"lib": "@metri/ui/lib",
		"hooks": "@metri/ui/hooks",
		"utils": "@metri/ui/lib/utils"
	}
}
```

## tsconfig.json do kit

```json title="packages/ui/tsconfig.json"
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"lib": ["es2023", "dom", "dom.iterable"],
		"jsx": "react-jsx",
		"paths": { "@metri/ui/*": ["./src/*"] }
	},
	"include": ["vitest.config.ts", "src"]
}
```

## package.json do kit

```json title="packages/ui/package.json"
{
	"name": "@metri/ui",
	"version": "0.0.0",
	"private": true,
	"type": "module",
	"exports": {
		"./components/*": "./src/components/*.tsx",
		"./lib/*": "./src/lib/*.ts",
		"./hooks/*": "./src/hooks/*.ts",
		"./styles/globals.css": "./src/styles/globals.css"
	},
	"scripts": {
		"typecheck": "tsc --noEmit",
		"lint": "biome check .",
		"test": "vitest run"
	},
	"peerDependencies": {
		"react": ">=19.0.0",
		"react-dom": ">=19.0.0"
	},
	"dependencies": {
		"@fontsource-variable/geist": "5.3.0",
		"@fontsource-variable/geist-mono": "5.3.0",
		"class-variance-authority": "0.7.1",
		"clsx": "2.1.1",
		"lucide-react": "1.48.0",
		"next-themes": "0.4.6",
		"radix-ui": "1.6.7",
		"sonner": "2.0.8",
		"tailwind-merge": "3.7.0",
		"tailwindcss": "4.3.3",
		"tw-animate-css": "1.4.0"
	},
	"devDependencies": {
		"@types/react": "19.3.0",
		"@types/react-dom": "19.3.0",
		"react": "19.3.0",
		"react-dom": "19.3.0"
	}
}
```

## cn

```ts title="packages/ui/src/lib/utils.ts"
import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: [
				'display-xl',
				'display-lg',
				'display-md',
				'display-sm',
				'body-lg',
				'body-md',
				'body-md-strong',
				'body-sm',
				'body-sm-strong',
				'caption',
				'caption-mono',
				'code',
				'button-md',
				'button-lg',
			],
		},
	},
});

/** SOURCE OF TRUTH: cn.
 * WHAT: joins classes with `clsx` and resolves conflicts with a `tailwind-merge` that knows each `--text-<level>` of the theme as a font size.
 * WHY: without `theme.text`, tailwind-merge reads `text-<level>` as a color and drops it next to `text-muted-foreground` (defaults/ui, "Tipografia e espaçamento").
 * WHERE: imported by the files of `components/ui/` and by the app; `pnpm design-tokens` compares the list with the `@theme` of `styles/globals.css`.
 * A new level in `--text-*` enters this list in the same edit.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```
