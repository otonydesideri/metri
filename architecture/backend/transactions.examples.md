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

O mecanismo em si (N escritas simultâneas no mesmo registro sem perder atualização) já tem prova no starter: `starter/apps/app-api/src/infra/persistence/prisma/transactions/unit-of-work.e2e-spec.ts`.
