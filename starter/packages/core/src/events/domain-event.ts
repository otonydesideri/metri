import type { UniqueEntityID } from '../entities/unique-entity-id';

/** SOURCE OF TRUTH: DomainEvent.
 * WHAT: the contract a domain event class implements: `getAggregateId()`, the id `DomainEvents` dispatches by.
 * WHY: a fact that already happened, read by the registry without it knowing the concrete event class (backend/events, "A classe de evento").
 * WHERE: implemented by each `<Agregado><FatoNoParticípio>Event` of apps/app-api/src/domain/enterprise/events.
 */
export interface DomainEvent {
	readonly occurredAt: Date;
	getAggregateId(): UniqueEntityID;
}
