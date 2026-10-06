import { beforeEach, describe, expect, it } from 'vitest';
import { AggregateRoot } from '../entities/aggregate-root';
import { UniqueEntityID } from '../entities/unique-entity-id';
import type { DomainEvent } from './domain-event';
import { DomainEvents } from './domain-events';

class FakeCreatedEvent implements DomainEvent {
	readonly occurredAt = new Date();
	constructor(private readonly aggregateId: UniqueEntityID) {}
	getAggregateId(): UniqueEntityID {
		return this.aggregateId;
	}
}

class FakeAggregate extends AggregateRoot<Record<string, never>> {
	static create(): FakeAggregate {
		const aggregate = new FakeAggregate({});
		aggregate.addDomainEvent(new FakeCreatedEvent(aggregate.id));
		return aggregate;
	}
}

beforeEach(() => {
	DomainEvents.clearHandlers();
	DomainEvents.clearMarkedAggregates();
	DomainEvents.shouldRun = true;
});

describe('DomainEvents', () => {
	it('addDomainEvent() marca o agregado; dispatchEventsForAggregate() entrega aos handlers registrados e limpa a lista', () => {
		const received: DomainEvent[] = [];
		DomainEvents.register(
			(event) => received.push(event),
			FakeCreatedEvent.name,
		);

		const aggregate = FakeAggregate.create();
		expect(aggregate.domainEvents).toHaveLength(1);

		DomainEvents.dispatchEventsForAggregate(aggregate.id);

		expect(received).toHaveLength(1);
		expect(aggregate.domainEvents).toHaveLength(0);
	});

	it('discardEventsForAggregate() limpa sem chamar nenhum handler', () => {
		const received: DomainEvent[] = [];
		DomainEvents.register(
			(event) => received.push(event),
			FakeCreatedEvent.name,
		);

		const aggregate = FakeAggregate.create();
		DomainEvents.discardEventsForAggregate(aggregate.id);

		expect(received).toHaveLength(0);
		expect(aggregate.domainEvents).toHaveLength(0);
	});

	it('shouldRun = false limpa o agregado sem chamar handler', () => {
		const received: DomainEvent[] = [];
		DomainEvents.register(
			(event) => received.push(event),
			FakeCreatedEvent.name,
		);
		DomainEvents.shouldRun = false;

		const aggregate = FakeAggregate.create();
		DomainEvents.dispatchEventsForAggregate(aggregate.id);

		expect(received).toHaveLength(0);
		expect(aggregate.domainEvents).toHaveLength(0);
	});

	it('dispatchEventsForAggregate() de um id não marcado não lança', () => {
		expect(() =>
			DomainEvents.dispatchEventsForAggregate(new UniqueEntityID()),
		).not.toThrow();
	});
});
