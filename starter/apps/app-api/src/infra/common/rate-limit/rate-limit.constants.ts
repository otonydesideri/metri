/** SOURCE OF TRUTH: RATE_LIMIT.
 * WHAT: the limit of the global rate limit: requests per IP in a time window.
 * WHY: the excess is refused with 429 in the `REQUEST_REJECTED` envelope (defaults/stack, "Rate limit"; backend/errors).
 * WHERE: read by `ThrottlerModule.forRoot` in `AppModule` and by the e2e; an external infra endpoint leaves it with `@SkipThrottle()`.
 */
export const RATE_LIMIT = {
	// counting window, in milliseconds
	ttl: 60_000,
	// requests accepted per IP within the window
	limit: 100,
} as const;
