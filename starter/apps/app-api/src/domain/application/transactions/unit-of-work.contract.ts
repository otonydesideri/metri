import type { Either } from '@metri/core/types';

/** SOURCE OF TRUTH: UnitOfWork.
 * WHAT: the port a use case opens to read, decide and write inside one transaction scope: `run(work)` runs `work`, commits on `success`, rolls everything back on a returned `failure` or a thrown error.
 * WHY: the use case decides inside the scope it owns, instead of deciding before an invisible transaction (backend/transactions, "Unidade de trabalho").
 * WHERE: injected by any use case that writes more than one aggregate, or that decides on state read inside the scope; implemented by `PrismaUnitOfWork` in production and by `InMemoryUnitOfWork` in test.
 */
export abstract class UnitOfWork {
	abstract run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>>;
}
