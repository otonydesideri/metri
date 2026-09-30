import { UniqueEntityID } from './unique-entity-id';

/** SOURCE OF TRUTH: Entity.
 * WHAT: the entity base: protected constructor, `id` as `UniqueEntityID` (new when absent) and equality by identity.
 * WHY: creation and reconstitution are separate paths, each a static method of the subclass (domain/model).
 * WHERE: extended by `AggregateRoot` and by the child entities of an aggregate.
 * The domain event registry enters with the first use case that reacts to a domain fact (backend/events).
 */
export abstract class Entity<Props> {
	private readonly _id: UniqueEntityID;
	protected props: Props;

	protected constructor(props: Props, id?: UniqueEntityID) {
		this.props = props;
		this._id = id ?? new UniqueEntityID();
	}

	get id(): UniqueEntityID {
		return this._id;
	}

	equals(entity: unknown): boolean {
		if (entity === this) {
			return true;
		}

		if (!(entity instanceof Entity)) {
			return false;
		}

		return this._id.equals(entity._id);
	}
}
