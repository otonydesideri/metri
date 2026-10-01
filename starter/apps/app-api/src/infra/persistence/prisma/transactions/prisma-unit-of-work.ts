import type { UniqueEntityID } from '@metri/core/entities';
import type { Either } from '@metri/core/types';
import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../../../domain/application/transactions/unit-of-work.contract';
import { PrismaService } from '../prisma.service';
import { TransactionContext } from './transaction-context';

const rollback = Symbol('rollback');

/** SOURCE OF TRUTH: PrismaUnitOfWork.
 * WHAT: the `UnitOfWork` implementation: opens `$transaction`, publishes the `tx` through `TransactionContext` for the repositories `work` calls, commits on `success`, and rolls back on a returned `failure` or a thrown error — the two only ways `work` can end badly, told apart by the `rollback` sentinel.
 * WHY: `$transaction`'s own callback cannot both return a value and signal rollback through its return — Prisma rolls back only on a thrown error — so a returned `failure` is turned into a throw internally, then back into the `Either` the caller already expects (backend/transactions, "Unidade de trabalho").
 * WHERE: registered as `{ provide: UnitOfWork, useClass: PrismaUnitOfWork }` in `PersistenceModule`.
 */
@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
	constructor(
		private readonly prisma: PrismaService,
		private readonly context: TransactionContext,
	) {}

	async run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>> {
		let result: Either<L, R> | undefined;
		let trackedAggregateIds: UniqueEntityID[] = [];

		try {
			await this.prisma.client.$transaction(async (tx) => {
				result = await this.context.runWith(tx, async () => {
					const outcome = await work();
					trackedAggregateIds = this.context.currentTrackedAggregateIds();
					return outcome;
				});
				if (result.isFailure()) {
					throw rollback;
				}
			});
		} catch (error) {
			this.context.discardEvents(trackedAggregateIds);
			if (error !== rollback) {
				throw error;
			}
			return result as Either<L, R>;
		}

		this.context.dispatchEvents(trackedAggregateIds);
		return result as Either<L, R>;
	}
}
