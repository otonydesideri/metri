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
