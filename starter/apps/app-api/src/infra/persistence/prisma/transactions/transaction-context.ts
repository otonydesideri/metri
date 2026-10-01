import { AsyncLocalStorage } from 'node:async_hooks';
import type { UniqueEntityID } from '@metri/core/entities';
import { DomainEvents } from '@metri/core/events';
import type { Prisma, PrismaClient } from '@metri/db/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NoActiveUnitOfWorkError } from './no-active-unit-of-work.error';

type Store = {
	tx: Prisma.TransactionClient;
	trackedAggregateIds: UniqueEntityID[];
};

/** SOURCE OF TRUTH: TransactionContext.
 * WHAT: publishes the open `tx` through `AsyncLocalStorage`, so a repository called inside a `UnitOfWork` scope joins the same transaction without the use case passing it through; `client()` is for reads (the open `tx`, or the plain client outside any scope), `requireTx()` is for writes (the open `tx`, or it throws), `track()` records which aggregate a write touched, and `currentTrackedAggregateIds()` reads that list while the scope is still open, for `PrismaUnitOfWork` to resolve dispatch or discard once it is not.
 * WHY: a repository write without an active scope is a programming mistake, not a result the caller should ever see as a domain outcome (backend/persistence, "Repositório"); a read has no such risk, so it is allowed outside.
 * WHERE: held by every Prisma repository and by `PrismaUnitOfWork`, which calls `runWith` inside `$transaction` and `dispatchEvents`/`discardEvents` after it settles, outside the open scope (backend/events, "A entidade registra, o repositório despacha").
 */
@Injectable()
export class TransactionContext {
	private readonly storage = new AsyncLocalStorage<Store>();

	constructor(private readonly prisma: PrismaService) {}

	runWith<T>(tx: Prisma.TransactionClient, work: () => Promise<T>): Promise<T> {
		return this.storage.run({ tx, trackedAggregateIds: [] }, work);
	}

	client(): PrismaClient | Prisma.TransactionClient {
		return this.storage.getStore()?.tx ?? this.prisma.client;
	}

	requireTx(): Prisma.TransactionClient {
		const store = this.storage.getStore();
		if (!store) {
			throw new NoActiveUnitOfWorkError();
		}
		return store.tx;
	}

	track(id: UniqueEntityID): void {
		this.requireTx();
		this.storage.getStore()?.trackedAggregateIds.push(id);
	}

	currentTrackedAggregateIds(): UniqueEntityID[] {
		return this.storage.getStore()?.trackedAggregateIds ?? [];
	}

	dispatchEvents(ids: UniqueEntityID[]): void {
		for (const id of ids) {
			DomainEvents.dispatchEventsForAggregate(id);
		}
	}

	discardEvents(ids: UniqueEntityID[]): void {
		for (const id of ids) {
			DomainEvents.discardEventsForAggregate(id);
		}
	}
}
