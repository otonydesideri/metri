import type { UniqueEntityID } from '../entities/unique-entity-id';
import type { DomainEvent } from './domain-event';

// Structural, not `AggregateRoot`: importing the class here would make entities/ depend on events/, and
// aggregate-root.ts already depends on this module to mark itself on `addDomainEvent`.
type Aggregate = {
	id: UniqueEntityID;
	domainEvents: readonly DomainEvent[];
	clearEvents(): void;
};

type Callback = (event: DomainEvent) => void;

// biome-ignore-start lint/complexity/noStaticOnlyClass: the shape (DomainEvents.register(), .dispatchEventsForAggregate()) is the documented API (backend/events.md), not a style choice.
/** SOURCE OF TRUTH: DomainEvents.
 * WHAT: the static in-process registry — `markAggregateForDispatch` (called by `AggregateRoot.addDomainEvent`), `dispatchEventsForAggregate` (called by the repository after persisting) and `discardEventsForAggregate` (called by `UnitOfWork` on rollback); `register`/`clearHandlers` for subscribers.
 * WHY: registering a fact is not dispatching it — the event only reaches a handler once the aggregate that carries it is marked dispatched, never before the write that proves the fact actually happened (backend/events, "A entidade registra, o repositório despacha").
 * WHERE: `AggregateRoot` marks on `addDomainEvent`; the Prisma repository and `UnitOfWork` call dispatch/discard; a subscriber calls `register` in `setupSubscriptions()`.
 */
export class DomainEvents {
	private static handlersByEvent = new Map<string, Callback[]>();
	private static markedAggregates: Aggregate[] = [];

	static markAggregateForDispatch(aggregate: Aggregate): void {
		const alreadyMarked = DomainEvents.markedAggregates.some((marked) =>
			marked.id.equals(aggregate.id),
		);
		if (!alreadyMarked) {
			DomainEvents.markedAggregates.push(aggregate);
		}
	}

	static dispatchEventsForAggregate(id: UniqueEntityID): void {
		const aggregate = DomainEvents.markedAggregates.find((marked) =>
			marked.id.equals(id),
		);
		if (!aggregate) {
			return;
		}
		for (const event of aggregate.domainEvents) {
			DomainEvents.dispatch(event);
		}
		aggregate.clearEvents();
		DomainEvents.removeFromMarked(id);
	}

	static discardEventsForAggregate(id: UniqueEntityID): void {
		const aggregate = DomainEvents.markedAggregates.find((marked) =>
			marked.id.equals(id),
		);
		if (!aggregate) {
			return;
		}
		aggregate.clearEvents();
		DomainEvents.removeFromMarked(id);
	}

	static register(callback: Callback, eventClassName: string): void {
		const handlers = DomainEvents.handlersByEvent.get(eventClassName) ?? [];
		handlers.push(callback);
		DomainEvents.handlersByEvent.set(eventClassName, handlers);
	}

	static clearHandlers(): void {
		DomainEvents.handlersByEvent.clear();
	}

	static clearMarkedAggregates(): void {
		DomainEvents.markedAggregates = [];
	}

	// For the in-memory `UnitOfWork` dublê, which has no per-call aggregate tracking of its own: everything marked
	// when `work()` settles belongs to that one run, since a unit spec has no concurrent scope (backend/testing,
	// "Unidade de trabalho").
	static dispatchAllMarked(): void {
		for (const id of DomainEvents.markedAggregates.map(
			(aggregate) => aggregate.id,
		)) {
			DomainEvents.dispatchEventsForAggregate(id);
		}
	}

	static discardAllMarked(): void {
		for (const id of DomainEvents.markedAggregates.map(
			(aggregate) => aggregate.id,
		)) {
			DomainEvents.discardEventsForAggregate(id);
		}
	}

	private static dispatch(event: DomainEvent): void {
		const handlers =
			DomainEvents.handlersByEvent.get(event.constructor.name) ?? [];
		for (const handler of handlers) {
			handler(event);
		}
	}

	private static removeFromMarked(id: UniqueEntityID): void {
		DomainEvents.markedAggregates = DomainEvents.markedAggregates.filter(
			(marked) => !marked.id.equals(id),
		);
	}
}
// biome-ignore-end lint/complexity/noStaticOnlyClass: the shape (DomainEvents.register(), .dispatchEventsForAggregate()) is the documented API (backend/events.md), not a style choice.
