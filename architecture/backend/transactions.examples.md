# Consistência e concorrência: exemplos

## UnitOfWork

Didático: domínio de pedidos, nomes genéricos, para ilustrar o padrão. O contrato, `TransactionContext` e `PrismaUnitOfWork` são código real do starter — `backend/transactions.md`, "Aplicação".

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

Leitura do repositório usa `context.client()`; escrita usa `context.requireTx()`, que lança fora de um escopo aberto (`backend/persistence.md`, "Repositório"). `orderRepository.save()` confere a `version` esperada no `where` e devolve `'conflict'` quando ela não bate, sem nenhuma outra condição de negócio junto (`backend/persistence.md`, "Escrita canônica do agregado").
