import { describe, expect, it } from 'vitest';
import { type Either, failure, success } from './either';

function divide(dividend: number, divisor: number): Either<string, number> {
	if (divisor === 0) {
		return failure('divisão por zero');
	}
	return success(dividend / divisor);
}

describe('Either', () => {
	it('success → isSuccess, com o valor', () => {
		const result = divide(6, 3);

		expect(result.isSuccess()).toBe(true);
		expect(result.isFailure()).toBe(false);
		expect(result.value).toBe(2);
	});

	it('failure → isFailure, com o erro', () => {
		const result = divide(6, 0);

		expect(result.isFailure()).toBe(true);
		expect(result.isSuccess()).toBe(false);
		expect(result.value).toBe('divisão por zero');
	});
});
