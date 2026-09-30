/** SOURCE OF TRUTH: DomainError, DomainErrorType.
 * WHAT: the domain error base, with `type` and `code` fixed in each concrete class, and its semantic category.
 * WHY: the use case returns the error by `failure(...)`, never by `throw`, and the HTTP port maps the category to a status (backend/errors, "A base").
 * WHERE: concrete classes live in `<module>.errors.ts` of the owner module; `toHttpException` in apps/app-api maps them.
 * Closed enum: a new value only when no category describes the case; a used value never changes.
 */
export enum DomainErrorType {
	BUSINESS_RULE = 'BUSINESS_RULE',
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	CONFLICT = 'CONFLICT',
	AUTHORIZATION = 'AUTHORIZATION',
	VALIDATION = 'VALIDATION',
}

export abstract class DomainError extends Error {
	abstract readonly type: DomainErrorType;
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}
