import type { DomainEvent } from '../events/domain-event';
import { DomainEvents } from '../events/domain-events';
import { Entity } from './entity';

/** SOURCE OF TRUTH: AggregateRoot.
 * WHAT: the aggregate root, an `Entity` the repository loads and saves as a whole, with the domain event list.
 * WHY: the aggregate is the unit of consistency and of mutation (domain/model, "Agregado e mutação interna").
 * WHERE: extended by each aggregate of apps/app-api/src/domain/enterprise. `addDomainEvent()` is called from `create()` or a state-transition method; the repository dispatches them after its write.
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {
	private _domainEvents: DomainEvent[] = [];

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
