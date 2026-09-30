import type { ApiErrorResponse } from '@metri/core/errors';

/** SOURCE OF TRUTH: httpClient, ApiError.
 * WHAT: the single HTTP client, the mutator the generated functions of `api/` call, over `fetch`; an HTTP error becomes an `ApiError` with the backend envelope.
 * WHY: the URL is relative to the page's origin (the OpenAPI paths carry `/api`), so the cookie goes with no cross-origin setup (frontend/data-fetching, "O cliente HTTP").
 * WHERE: called by the functions Orval writes in src/api; in dev, the proxy of vite.config.ts takes `/api` to app-api.
 * React Query fills the error only if the function throws.
 */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly body: ApiErrorResponse | undefined,
	) {
		super(body?.message ?? `HTTP ${status}`);
	}
}

export async function httpClient<T>(
	url: string,
	init: RequestInit,
): Promise<T> {
	const response = await fetch(url, init);
	const body = response.status === 204 ? undefined : await response.json();
	if (!response.ok) {
		throw new ApiError(response.status, body);
	}
	return body as T;
}
