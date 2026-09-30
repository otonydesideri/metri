// The evidence of a UI criterion (frontend/testing, "E2e de critério de UI"; frontend/experience, "Desktop,
// mobile e evidência"): the full page at `.metri/tickets/<id>/<n>-<project>.png`, from the repository root
// (also in a worktree), with `<n>` the criterion's order and `<project>` the Playwright `desktop` or `mobile`.
// It saves only when METRI_EVIDENCE is the spec's ticket id: /build sets it when running the ticket's e2e, and
// the full suite runs without it, so it never rewrites the evidence of a done ticket.

import { resolve } from 'node:path';
import type { Page, TestInfo } from '@playwright/test';

const TICKETS_DIR = resolve(import.meta.dirname, '../../../.metri/tickets');

export async function saveEvidence(
	page: Page,
	ticketId: string,
	criterion: number,
	testInfo: TestInfo,
): Promise<void> {
	if (process.env.METRI_EVIDENCE !== ticketId) {
		return;
	}
	await page.screenshot({
		path: resolve(
			TICKETS_DIR,
			ticketId,
			`${criterion}-${testInfo.project.name}.png`,
		),
		fullPage: true,
	});
}
