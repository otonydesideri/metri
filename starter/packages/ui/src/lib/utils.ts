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
