import { randomUUID } from 'node:crypto';

/** SOURCE OF TRUTH: UniqueEntityID.
 * WHAT: the id of an entity, a uuid v4 from `randomUUID()`, compared by value.
 * WHY: the id is born inside the entity, in the same format as the `id` column of the schema (domain/model).
 * WHERE: created by `Entity` when no id is given; the mapper passes the stored id on reconstitution.
 */
export class UniqueEntityID {
	private readonly value: string;

	constructor(value?: string) {
		this.value = value ?? randomUUID();
	}

	toValue(): string {
		return this.value;
	}

	equals(id: UniqueEntityID): boolean {
		return id.toValue() === this.value;
	}
}
