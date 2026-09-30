/** SOURCE OF TRUTH: Either, Left, Right, failure, success.
 * WHAT: the return of an operation that can fail: `failure(...)` or `success(...)`, narrowed by `isFailure()`/`isSuccess()`.
 * WHY: the domain returns errors, never throws them (backend/errors, "Retornando erro: sempre `Either`, nunca `throw`").
 * WHERE: returned by `create()`, by entity transitions and by use cases; read by the controller.
 */
export class Left<L, R> {
	readonly value: L;

	constructor(value: L) {
		this.value = value;
	}

	isFailure(): this is Left<L, R> {
		return true;
	}

	isSuccess(): this is Right<L, R> {
		return false;
	}
}

export class Right<L, R> {
	readonly value: R;

	constructor(value: R) {
		this.value = value;
	}

	isFailure(): this is Left<L, R> {
		return false;
	}

	isSuccess(): this is Right<L, R> {
		return true;
	}
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export function failure<L, R = never>(value: L): Either<L, R> {
	return new Left(value);
}

export function success<R, L = never>(value: R): Either<L, R> {
	return new Right(value);
}
