import type { DomainErrorType } from './domain-error';

/** SOURCE OF TRUTH: ApiErrorType, ApiErrorResponse.
 * WHAT: the single error envelope of the API and its `type`: the `DomainErrorType` values plus the categories only the HTTP port produces.
 * WHY: every error response, from the domain, the request format, the framework or unexpected, has one body (backend/errors, "O formato de resposta de erro").
 * WHERE: built by apps/app-api (`toHttpException`, `toInvalidRequestException`, `UnexpectedErrorFilter`); read by apps/app-web (`ApiError`).
 */
export type ApiErrorType =
	| `${DomainErrorType}`
	| 'INVALID_REQUEST'
	| 'INTERNAL_ERROR'
	| 'REQUEST_REJECTED';

export type ApiErrorResponse = {
	code: string;
	message: string;
	type: ApiErrorType;
};
