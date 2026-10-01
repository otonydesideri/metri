# Consistência e concorrência: exemplos

## ConfirmOrderUseCase

Confirmar um pedido emite a fatura; o pedido tem edição concorrente, protegida por `version`.

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

    if ((await this.orderRepository.save(order)) === 'conflict') {
      return failure(new OrderChangedConcurrentlyError(orderId));
    }
    await this.invoiceRepository.create(invoiceOrError.value);

    return success({ order, invoice: invoiceOrError.value });
  });
}
```

## PrismaUnitOfWork

```ts
@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: TransactionContext,
  ) {}

  async run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>> {
    const rollback = Symbol('rollback');
    let result: Either<L, R> | undefined;

    try {
      await this.prisma.client.$transaction(async (tx) => {
        result = await this.context.runWith(tx, work);
        if (result.isFailure()) {
          throw rollback;
        }
      });
    } catch (error) {
      this.context.discardEvents();
      if (error !== rollback) {
        throw error;
      }
      return result as Either<L, R>;
    }

    this.context.dispatchEvents();
    return result as Either<L, R>;
  }
}
```

Leitura do repositório usa `this.context.client()`, que devolve o `tx` do escopo aberto ou o client comum fora dele. Escrita usa `this.context.requireTx()`, que devolve o mesmo `tx` ou lança quando não há escopo aberto (`backend/persistence.md`, "Repositório"); as duas registram no contexto os agregados gravados, para o despacho depois do commit. O dublê em memória roda `work` direto e despacha os eventos quando o resultado é `success`.
