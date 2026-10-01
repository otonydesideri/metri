import { METRI_VERSION } from '@/shared/constants/app.constant';

/** SOURCE OF TRUTH: StartFooter.
 * WHAT: the start page footer, with the metri version the project follows.
 * WHY: whoever opens the starter sees which version of the method it came from.
 * WHERE: at the bottom of `HomeStartPage`; without a version (outside a project), it renders nothing.
 */
export function StartFooter() {
	if (METRI_VERSION === '') {
		return null;
	}
	return (
		<footer className="text-caption-mono font-mono text-muted-foreground">
			metri {METRI_VERSION}
		</footer>
	);
}
