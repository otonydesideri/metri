import { describe, expect, it } from 'vitest';
import { ValueObject } from './value-object';

class Money extends ValueObject<{ cents: number; currency: string }> {
	static create(cents: number, currency: string): Money {
		return new Money({ cents, currency });
	}
}

describe('ValueObject', () => {
	it('mesmos valores → iguais', () => {
		expect(Money.create(1000, 'BRL').equals(Money.create(1000, 'BRL'))).toBe(
			true,
		);
	});

	it('um valor diferente → diferentes', () => {
		expect(Money.create(1000, 'BRL').equals(Money.create(1000, 'USD'))).toBe(
			false,
		);
	});

	it('ausente → diferente', () => {
		expect(Money.create(1000, 'BRL').equals(undefined)).toBe(false);
	});
});
