/** SOURCE OF TRUTH: NoActiveUnitOfWorkError.
 * WHAT: thrown by `TransactionContext.requireTx()` when a repository write runs without an open `UnitOfWork` scope.
 * WHY: a repository write outside a transaction is a programming mistake, not a domain outcome — it throws, like any other technical error, instead of returning `Either` (backend/persistence, "Repositório").
 * WHERE: thrown by every Prisma repository's write methods, through `TransactionContext.requireTx()`; uncaught, so it becomes a 500 through `UnexpectedErrorFilter` (backend/errors, "Erro inesperado: filtro global").
 */
export class NoActiveUnitOfWorkError extends Error {
	constructor() {
		super('Escrita de repositório fora de um escopo de UnitOfWork ativo.');
		this.name = 'NoActiveUnitOfWorkError';
	}
}
