# Consistência da escrita: exemplos

## UnitOfWork

Didático: domínio de pedidos. O contrato, `TransactionContext` e `PrismaUnitOfWork` são código real do starter (`backend/transactions.md`, "Aplicação").

```ts
// domain/application/transactions/unit-of-work.contract.ts
export abstract class UnitOfWork {
  /** Runs `work` in one transaction; a returned `failure` or a thrown error rolls everything back. */
  abstract run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>>;
}

// domain/application/use-cases/order/confirm-order.use-case.ts (excerpt)
async execute({ orderId }: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
  return this.unitOfWork.run(async () => {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      return failure(new OrderNotFoundError(orderId));
    }

    const confirmed = order.confirm();
    if (confirmed.isFailure()) {
      return failure(confirmed.value);
    }

    const invoiceOrError = Invoice.create({ orderId: order.id, total: order.total });
    if (invoiceOrError.isFailure()) {
      return failure(invoiceOrError.value);
    }

    await this.orderRepository.save(order);
    await this.invoiceRepository.create(invoiceOrError.value);

    return success({ order, invoice: invoiceOrError.value });
  });
}
```

Leitura do repositório usa `context.client()`; escrita usa `context.requireTx()`, que lança fora de um escopo aberto (`backend/persistence.md`, "Repositório").

## Concurrency

Receita para agregado disputado de fato por escrita concorrente.

**Antes de proteger.** Avaliar quem provoca duas execuções concorrentes sobre o mesmo agregado, com que frequência e com que dano. Risco improvável e de dano contido é aceito e registrado como decisão de projeto, com o racional e a condição de revisita.

**`version` na raiz.** O agregado é a unidade de concorrência: a raiz disputada ganha coluna `version`, e o `save()` confere a esperada no `where`, grava a incrementada e devolve `'saved' | 'conflict'` (`backend/persistence.md`, "Outcome de persistência"). O `where` só compara a `version`: a decisão já aconteceu no domínio, e critério de negócio ali faria `'conflict'` esconder uma recusa que não é disputa.

```ts
// infra/persistence/prisma/repositories/order.prisma-repository.impl.ts (excerpt)
// the order is born by create(), which has no version to check; save() writes an existing one
async save(order: Order): Promise<'saved' | 'conflict'> {
  const data = OrderPrismaMapper.toPrisma(order);
  const tx = this.context.requireTx();

  const { count } = await tx.order.updateMany({
    where: { id: data.id, version: order.version },
    data: { status: data.status, updatedAt: data.updatedAt, version: { increment: 1 } },
  });

  if (count === 0) {
    return 'conflict';
  }

  await tx.orderItem.deleteMany({ where: { orderId: data.id } });
  await tx.orderItem.createMany({
    data: order.items.map((item) => OrderItemPrismaMapper.toPrisma(item, data.id)),
  });

  this.context.track(order.id);
  return 'saved';
}
```

No caso de uso, o conflito vira `failure` de `CONFLICT` (`backend/errors.md`):

```ts
if ((await this.orderRepository.save(order)) === 'conflict') {
  return failure(new OrderChangedConcurrentlyError(orderId));
}
```

**Retentativa.** Quando o conflito é transitório e a operação não pode falhar por concorrência, o caso de uso repete o escopo inteiro, relendo e redecidindo, no máximo 3 vezes; esgotada, devolve o erro de `CONFLICT`.

**Trava pessimista.** `find...ForUpdate` no repositório, chamado dentro do escopo, só para linha disputada de fato, medida; a decisão continua no caso de uso e no agregado.

**Ordem e isolamento.** As transações rodam em READ COMMITTED, o padrão do Postgres. Toda escrita que toca as mesmas linhas trava e grava na mesma ordem fixa: o pai antes dos filhos; entre linhas do mesmo tipo, por id. Ordem diferente entre duas transações é o deadlock que só aparece sob carga.

**Pai que fecha.** Quando o fechamento de um pai calcula sobre os filhos (o total de um pedido sobre os pagamentos dele), a entrada de filho confere o pai aberto com trava compartilhada (`findOpenForShare`, `FOR SHARE`), e o fechamento trava o pai para escrita (`findForUpdate`, `FOR UPDATE`) antes de ler os filhos, os dois dentro do escopo. O cálculo fica no domínio. Sem serializar sobre o pai, um filho escapa do cálculo ou entra num pai fechado.

**Spec de concorrência.** Agregado com coluna `version` tem um `src/infra/persistence/prisma/<agregado>.concurrency.e2e-spec.ts`, nomeado por ele em kebab-case, para o fluxo que mais o disputa (check: `concurrency`):

- dispara N requisições simultâneas (`Promise.all` de chamadas HTTP, com o app e o banco reais do e2e de controller) contra o mesmo agregado, e repete o cenário inteiro, com agregado novo, pelo menos 5 vezes;
- a asserção lê o estado final do agregado direto no banco em cada rodada: a invariante vale sempre, mesmo quando o número de respostas de sucesso varia;
- conta o deadlock do Postgres (`40P01`) nas respostas; deadlock numa rodada derruba o teste, salvo risco aceito para o fluxo.

O mecanismo em si (N escritas simultâneas no mesmo registro sem perder atualização) já tem prova: "A prova do UnitOfWork", abaixo.

## UnitOfWork, o contrato

```ts title="apps/app-api/src/domain/application/transactions/unit-of-work.contract.ts"
import type { Either } from '@metri/core/types';

/** SOURCE OF TRUTH: UnitOfWork.
 * WHAT: the port a use case opens to read, decide and write inside one transaction scope: `run(work)` runs `work`, commits on `success`, rolls everything back on a returned `failure` or a thrown error.
 * WHY: the use case decides inside the scope it owns, instead of deciding before an invisible transaction (backend/transactions, "Unidade de trabalho").
 * WHERE: injected by any use case that writes more than one aggregate, or that decides on state read inside the scope; implemented by `PrismaUnitOfWork` in production and by `InMemoryUnitOfWork` in test.
 */
export abstract class UnitOfWork {
	abstract run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>>;
}
```

## TransactionContext

```ts title="apps/app-api/src/infra/persistence/prisma/transactions/transaction-context.ts"
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
```

## PrismaUnitOfWork

```ts title="apps/app-api/src/infra/persistence/prisma/transactions/prisma-unit-of-work.ts"
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
```

## A prova do UnitOfWork

```ts title="apps/app-api/src/infra/persistence/prisma/transactions/unit-of-work.e2e-spec.ts"
// This suite proves the UnitOfWork mechanism itself (backend/transactions, "Unidade de trabalho"), not a domain: the
// row it writes lives in a probe table the suite creates and drops itself, raw SQL, with no model in schema.prisma.
import { randomUUID } from 'node:crypto';
import { AggregateRoot, UniqueEntityID } from '@metri/core/entities';
import { type DomainEvent, DomainEvents } from '@metri/core/events';
import { failure, success } from '@metri/core/types';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';
import { UnitOfWork } from '../../../../domain/application/transactions/unit-of-work.contract';
import { PrismaService } from '../prisma.service';
import { NoActiveUnitOfWorkError } from './no-active-unit-of-work.error';
import { TransactionContext } from './transaction-context';

const PROBE_TABLE = 'unit_of_work_probe';

class ProbeMarkedEvent implements DomainEvent {
	readonly occurredAt = new Date();
	constructor(private readonly aggregateId: UniqueEntityID) {}
	getAggregateId(): UniqueEntityID {
		return this.aggregateId;
	}
}

// A minimal AggregateRoot, local to this spec: the mechanism under proof is dispatch-after-commit and
// discard-after-rollback, which needs some `addDomainEvent()` caller, not a particular domain.
class ProbeAggregate extends AggregateRoot<Record<string, never>> {
	static create(): ProbeAggregate {
		return new ProbeAggregate({});
	}
	markDone(): void {
		this.addDomainEvent(new ProbeMarkedEvent(this.id));
	}
}

class ForcedRollbackError extends Error {}

describe('UnitOfWork (e2e)', () => {
	let app: NestFastifyApplication;
	let unitOfWork: UnitOfWork;
	let context: TransactionContext;
	let prisma: PrismaService;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication<NestFastifyApplication>(
			new FastifyAdapter(),
		);
		await app.init();

		unitOfWork = moduleRef.get(UnitOfWork);
		context = moduleRef.get(TransactionContext);
		prisma = moduleRef.get(PrismaService);

		await prisma.client.$executeRawUnsafe(
			`CREATE TABLE IF NOT EXISTS ${PROBE_TABLE} (id text primary key, counter integer not null, version integer not null default 1)`,
		);
	});

	afterAll(async () => {
		await prisma.client.$executeRawUnsafe(
			`DROP TABLE IF EXISTS ${PROBE_TABLE}`,
		);
		await app.close();
	});

	beforeEach(() => {
		DomainEvents.clearHandlers();
		DomainEvents.clearMarkedAggregates();
	});

	async function insertRow(id: string): Promise<void> {
		await prisma.client.$executeRawUnsafe(
			`INSERT INTO ${PROBE_TABLE} (id, counter, version) VALUES ($1, 0, 1)`,
			id,
		);
	}

	async function readRow(
		id: string,
	): Promise<{ counter: number; version: number }> {
		const [row] = await prisma.client.$queryRawUnsafe<
			{ counter: number; version: number }[]
		>(`SELECT counter, version FROM ${PROBE_TABLE} WHERE id = $1`, id);
		return row;
	}

	it('falha dentro do escopo desfaz a escrita inteira (rollback)', async () => {
		const id = randomUUID();
		await insertRow(id);

		const result = await unitOfWork.run(async () => {
			const tx = context.requireTx();
			await tx.$executeRawUnsafe(
				`UPDATE ${PROBE_TABLE} SET counter = counter + 1, version = version + 1 WHERE id = $1`,
				id,
			);
			return failure(
				new ForcedRollbackError('decidiu desfazer depois de gravar'),
			);
		});

		expect(result.isFailure()).toBe(true);
		const row = await readRow(id);
		expect(row.counter).toBe(0);
		expect(row.version).toBe(1);
	});

	it('eventos de uma tentativa desfeita são descartados, nunca despachados', async () => {
		const received: DomainEvent[] = [];
		DomainEvents.register(
			(event) => received.push(event),
			ProbeMarkedEvent.name,
		);

		await unitOfWork.run(async () => {
			const aggregate = ProbeAggregate.create();
			aggregate.markDone();
			context.track(aggregate.id);
			return failure(new ForcedRollbackError('decidiu desfazer'));
		});

		expect(received).toHaveLength(0);
	});

	it('o commit despacha os eventos registrados durante o escopo', async () => {
		const received: DomainEvent[] = [];
		DomainEvents.register(
			(event) => received.push(event),
			ProbeMarkedEvent.name,
		);

		const result = await unitOfWork.run(async () => {
			const aggregate = ProbeAggregate.create();
			aggregate.markDone();
			context.track(aggregate.id);
			return success(aggregate);
		});

		expect(result.isSuccess()).toBe(true);
		expect(received).toHaveLength(1);
	});

	it('a escrita é recusada fora de um escopo de UnitOfWork ativo', () => {
		expect(() => context.requireTx()).toThrow(NoActiveUnitOfWorkError);
	});

	it('a leitura funciona sem nenhum escopo de UnitOfWork ativo', () => {
		expect(context.client()).toBe(prisma.client);
	});

	it('N escritas simultâneas no mesmo registro: version não perde nenhuma atualização', async () => {
		const id = randomUUID();
		await insertRow(id);
		const CONCURRENT_WRITES = 10;

		const attempt = async (): Promise<'saved' | 'conflict' | 'error'> => {
			try {
				const result = await unitOfWork.run(async () => {
					const tx = context.requireTx();
					const [current] = await tx.$queryRawUnsafe<{ version: number }[]>(
						`SELECT version FROM ${PROBE_TABLE} WHERE id = $1`,
						id,
					);
					const affected = await tx.$executeRawUnsafe(
						`UPDATE ${PROBE_TABLE} SET counter = counter + 1, version = version + 1 WHERE id = $1 AND version = $2`,
						id,
						current.version,
					);
					return success(affected > 0);
				});
				return result.isSuccess() && result.value ? 'saved' : 'conflict';
			} catch {
				return 'error';
			}
		};

		const outcomes = await Promise.all(
			Array.from({ length: CONCURRENT_WRITES }, attempt),
		);

		// a deadlock, or any other technical error, is counted here rather than silently lost in a rejected promise
		const errors = outcomes.filter((outcome) => outcome === 'error');
		expect(
			errors,
			'nenhuma escrita deve lançar (deadlock ou erro técnico)',
		).toHaveLength(0);

		const saved = outcomes.filter((outcome) => outcome === 'saved');
		expect(saved.length).toBeGreaterThan(0);

		// the invariant that matters: the row's own counter, not the responses — exactly one increment per write
		// that actually believed it won, never more (a lost update would let two writers both think they won)
		const row = await readRow(id);
		expect(row.counter).toBe(saved.length);
		expect(row.version).toBe(1 + saved.length);
	});
});
```
