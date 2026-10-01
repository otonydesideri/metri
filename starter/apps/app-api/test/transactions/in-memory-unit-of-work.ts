import { DomainEvents } from '@metri/core/events';
import type { Either } from '@metri/core/types';
import { UnitOfWork } from '../../src/domain/application/transactions/unit-of-work.contract';

/** SOURCE OF TRUTH: InMemoryUnitOfWork.
 * WHAT: the single test double for `UnitOfWork`: runs `work` directly, with no transaction to simulate, and dispatches events on `success` or discards them on `failure` — the same two outcomes `PrismaUnitOfWork` tells apart, without its machinery.
 * WHY: a spec that injects this double proves the use case's own decision (what it reads, decides and writes), not transaction mechanics; state lives in the in-memory repositories, as always (backend/testing, "Unidade de trabalho").
 * WHERE: injected by the spec of any use case that opens a `UnitOfWork` scope, in place of `PrismaUnitOfWork`.
 */
export class InMemoryUnitOfWork implements UnitOfWork {
	async run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>> {
		const result = await work();
		if (result.isSuccess()) {
			DomainEvents.dispatchAllMarked();
		} else {
			DomainEvents.discardAllMarked();
		}
		return result;
	}
}
