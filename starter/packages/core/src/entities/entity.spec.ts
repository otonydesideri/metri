import { describe, expect, it } from 'vitest';
import { Entity } from './entity';
import { UniqueEntityID } from './unique-entity-id';

class Probe extends Entity<{ name: string }> {
	static create(name: string, id?: UniqueEntityID): Probe {
		return new Probe({ name }, id);
	}
}

describe('Entity', () => {
	it('sem id → nasce com um uuid v4', () => {
		const entity = Probe.create('a');

		expect(entity.id.toValue()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it('com id → reconstitui com ele', () => {
		const id = new UniqueEntityID('3f1c2a9e-8d4b-4c6f-9a1e-2b7d5c8e0f13');

		expect(Probe.create('a', id).id.equals(id)).toBe(true);
	});

	it('mesmo id e props diferentes → iguais', () => {
		const id = new UniqueEntityID();

		expect(Probe.create('a', id).equals(Probe.create('b', id))).toBe(true);
	});

	it('mesmas props e ids diferentes → diferentes', () => {
		expect(Probe.create('a').equals(Probe.create('a'))).toBe(false);
	});

	it('valor que não é entidade → diferente', () => {
		expect(Probe.create('a').equals({ id: 'x' })).toBe(false);
	});
});
