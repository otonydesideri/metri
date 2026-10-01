import type { DomainEvent } from '../events/domain-event';
import { DomainEvents } from '../events/domain-events';
import { Entity } from './entity';
import type { UniqueEntityID } from './unique-entity-id';

/** SOURCE OF TRUTH: AggregateRoot.
 * WHAT: the aggregate root, an `Entity` the repository loads and saves as a whole, with `version` (the default unit of concurrency detection, starting at 1 on `create()` and read as-is on `reconstitute()`) and the domain event list.
 * WHY: the aggregate is the unit of consistency and of mutation (domain/model, "Agregado e mutação interna"); `version` by default means any aggregate gets it for free, not only the ones an author remembered to add it to (backend/transactions, "Concorrência e locking").
 * WHERE: extended by each aggregate of apps/app-api/src/domain/enterprise. `addDomainEvent()` is called from `create()` or a state-transition method; the repository reads `version` for the conditional `save()` (backend/persistence).
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {
	private readonly _version: number;
	private _domainEvents: DomainEvent[] = [];

	protected constructor(props: Props, id?: UniqueEntityID, version = 1) {
		super(props, id);
		this._version = version;
	}

	get version(): number {
		return this._version;
	}

	get domainEvents(): readonly DomainEvent[] {
		return this._domainEvents;
	}

	protected addDomainEvent(event: DomainEvent): void {
		this._domainEvents.push(event);
		DomainEvents.markAggregateForDispatch(this);
	}

	clearEvents(): void {
		this._domainEvents = [];
	}
}
