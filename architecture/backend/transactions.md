# Transações

Dono de: o mecanismo de atomicidade depois que o fluxo requer transação — o contrato de transação entre agregados; a avaliação e a proteção do risco de concorrência (concorrência e locking); a escrita de sistema externo que não cabe na transação e o risco de consistência aceito.

Consultar antes de: escrever um caso de uso que persiste dois ou mais agregados; proteger uma operação contra execução concorrente; gravar em sistema externo numa operação que também grava no banco; aceitar um risco de consistência novo.

Não cobre: a decisão de que o fluxo requer transação e a resposta a um efeito pós-commit que falha (`backend/operation-routing.md`).

Como o backend garante atomicidade quando uma operação de negócio grava em mais de um agregado, como risco de concorrência é avaliado e protegido, e o que acontece quando uma escrita de sistema externo não cabe na transação.

Os exemplos usam o domínio didático de pedidos (`order`, `invoice`) de `backend/modules.md`. Quando um caso real não se encaixar nas regras daqui, não force o encaixe nem infira uma variação por conta própria: pare, sinalize e pergunte antes de implementar.

## O problema

Cada agregado tem contrato, tabela e regras próprios. Quando uma operação de negócio grava em mais de um, aparece a pergunta de consistência: e se uma parte grava e a outra falha?

Cenário didático: confirmar um pedido também emite a fatura correspondente. Se a confirmação grava e a emissão falha, existe um pedido confirmado sem fatura, um estado que nenhuma regra do domínio reconhece. O inverso, fatura sem pedido confirmado, é igualmente inválido.

A fronteira de consistência natural do sistema é o agregado: a invariante que o próprio modelo preserva atomicamente numa mudança pertence a uma fronteira de agregado só (`domain/model.md`). A atomicidade interna dele já é resolvida pela escrita canônica do agregado, que grava raiz e delta da `WatchedList` numa única transação (`backend/persistence.md`). Este documento trata do que acontece quando a operação cruza essa fronteira.

## Quando o fluxo requer transação

A árvore de `backend/operation-routing.md` decide quando uma operação que cruza a fronteira do agregado requer transação compartilhada; este documento define o mecanismo depois que ela chega aqui.

A regra clássica de DDD, uma transação por agregado, mira sistemas onde agregados podem morar em bancos ou serviços diferentes. Num monólito modular sobre um único Postgres, uma transação curta entre agregados é barata e segura. O que permanece da regra é a disciplina de fronteira e de consistência eventual que aquela árvore aplica antes, não a proibição.

## Contrato de transação

Escrita atômica que não é a escrita canônica de um agregado é um contrato de transação: o caso de uso chama uma peça dedicada ao fluxo, e a implementação concentra a transação. Vale para gravação de dois agregados diferentes e para gravação estreita entre instâncias do mesmo agregado; nos dois casos a escrita não cabe num repositório, que é acesso do tipo coleção a uma raiz de agregado (`backend/persistence.md`).

O contrato é uma `abstract class` em `domain/application/transactions`, um fluxo por arquivo, com um método `run` só:

```ts
import type { Invoice } from '../../enterprise/invoice.entity';
import type { Order } from '../../enterprise/order.entity';

export interface OrderInvoicingTransactionParams {
  order: Order;
  invoice: Invoice;
}

export abstract class OrderInvoicingTransaction {
  abstract run(params: OrderInvoicingTransactionParams): Promise<void>;
}
```

O nome do fluxo mora na classe, e `run` é uniforme em todos: a peça é distinta do caso de uso, que é quem tem `execute()` (`backend/application.md`).

O caso de uso mantém a ordem de sempre, leitura, regra, gravação. A única diferença é que a gravação inteira vira uma chamada só, no fim:

```ts
async execute({ orderId }: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
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
  const invoice = invoiceOrError.value;

  await this.orderInvoicingTransaction.run({ order, invoice });

  return success({ order, invoice });
}
```

A implementação converte com os mappers dos agregados envolvidos e escreve tudo no mesmo `tx`:

```ts
@Injectable()
export class OrderInvoicingPrismaTransactionImpl implements OrderInvoicingTransaction {
  constructor(private readonly prisma: PrismaService) {}

  async run(params: OrderInvoicingTransactionParams): Promise<void> {
    const orderData = OrderPrismaMapper.toPrisma(params.order);
    const invoiceData = InvoicePrismaMapper.toPrisma(params.invoice);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderData.id },
        data: { status: orderData.status, updatedAt: orderData.updatedAt },
      });

      await tx.invoice.create({ data: invoiceData });
    });
  }
}
```

Pontos-chave:

- Toda decisão de domínio acontece antes da chamada. Quando o contrato é chamado, não existe mais falha de domínio a decidir: o que volta de lá é o outcome que o contrato declara, se a escrita tem condição que só o banco avalia (bullet do retorno, adiante), e o que falha lá dentro é erro técnico (queda de conexão, bug), que lança, reverte a transação inteira e vira 500 (`backend/errors.md`). Falha esperada depois de escrita parcial é impossível por construção. É por isso que a decisão não entra na transação: `failure(...)` é valor de retorno, não `throw`, e um `Either` de falha dentro de um callback de transação commitaria a escrita parcial em silêncio.
- Os parâmetros são entidades e value objects, nunca modelo Prisma nem contexto de transação. A transação é detalhe da implementação, invisível na assinatura; nenhum contrato do app carrega um `ctx` opcional.
- O formato dos parâmetros é uma `interface` exportada ao lado do contrato, `<Contrato>Params`, consumida pela implementação e pelo dublê. Assim o campo que precisa de explicação (o estado que a revalidação de concorrência espera, por exemplo) tem onde ser documentado uma vez só.
- O retorno diz se a escrita é condicional e segue o outcome de persistência de `backend/persistence.md`: `Promise<void>` sem condição que só o banco avalia na gravação; com ela, o outcome declarado da operação. Erro de domínio não entra aqui, é o caso de uso que o constrói a partir do outcome (seção "Concorrência e locking").
- A implementação nunca chama outros repositórios, que gravariam fora da transação. Ela reusa os mappers dos agregados e escreve direto no `tx`.
- Nomeação segue o formato de persistência de `backend/persistence.md`, com o fluxo no lugar do agregado e `transaction` no lugar de `repository`: `order-invoicing-transaction.contract.ts` em `domain/application/transactions/`, `order-invoicing.prisma-transaction.impl.ts` em `infra/persistence/prisma/transactions/`, dublê `order-invoicing.in-memory-transaction.impl.ts` em `test/transactions/`.
- O dublê em memória recebe no construtor os repositórios em memória dos agregados envolvidos e escreve nos `items` deles, para o spec observar o estado nos mesmos lugares de sempre. Registrado em `makeInMemoryRepositories()` como os demais.
- Integração externa (e-mail, API de terceiro) nunca entra na transação: acontece depois do commit, pelo mecanismo que `backend/operation-routing.md` escolher.
- Um fluxo, um contrato, um método. O contrato de transação não é um unit of work genérico: um segundo método é sinal de que a peça virou atalho de persistência, não fronteira de fluxo.

## Escrita de sistema externo fica fora do alcance

Quando a gravação é executada por um sistema externo — o adapter de uma biblioteca que traz o próprio schema, uma API de terceiro —, ela acontece fora de qualquer transação do app. O teto de atomicidade ali é o comportamento daquele sistema, e ele raramente é transacional: duas chamadas sequenciais sem transação entre elas é o caso comum.

Consequências:

- Nunca meia-escrita em volta da operação externa para "completar" uma atomicidade que ela não oferece. Isso duplicaria uma escrita que já acontece do outro lado, sem as duas ficarem consistentes — o mesmo problema que mantém a criação de linha desse tipo de tabela fora do nosso repositório (`domain/model.md`, "Propriedade do agregado: quem escreve a tabela").
- Escrita nossa nesse agregado está sob nosso controle e é atômica normalmente.
- A lacuna residual é tratada com a mesma postura da seção "Concorrência e locking": avaliar janela, gatilho e dano; risco aceito é registrado com racional e condição de revisita, no mesmo lugar.

## Concorrência e locking

Toda operação de leitura, decisão e gravação tem uma janela entre a checagem e a escrita. A postura canônica tem dois passos.

**Avaliar antes de proteger.** Proteção nova entra por risco real, não por reflexo: qual o gatilho concreto (quem consegue provocar duas execuções concorrentes, com que frequência), qual o dano, e existe precedente de risco aceito da mesma categoria? Risco de gatilho improvável e dano contido é aceito e registrado como decisão de projeto do app, ao lado da propriedade de agregados, com racional e condição de revisita. Quando a revisita depende de vigiar o risco em produção, a métrica ou a reconciliação segue `infrastructure/observability.md`.

**Quando o risco deixa de ser aceitável, a escada de mecanismos, do mais simples:**

1. **Revalidação dentro da escrita atômica.** A escrita condicional revalida o que a leitura checou (`updateMany` com o estado esperado no `where`); zero linhas afetadas encerra a transação antes de qualquer gravação, e o método devolve `false`. Quem traduz esse fato para uma classe com `DomainErrorType.CONFLICT` (`backend/errors.md`) é o caso de uso, dono da janela entre a leitura e a escrita: a persistência só sabe se o `where` casou. A escrita condicional mora sempre num contrato de transação, nunca num repositório.
2. **Coluna `version` na raiz do agregado (locking otimista).** Para agregado com edição concorrente frequente: o update inclui a `version` esperada no `where` e grava a incrementada; conflito volta como o mesmo outcome, e o caso de uso o traduz no mesmo `failure(...)` de `CONFLICT`. O agregado é também a unidade de detecção de conflito.
3. **`SELECT FOR UPDATE` (locking pessimista).** Só para linha disputada o tempo todo (contador de vagas, saldo), onde o retry constante do otimista seria pior que serializar. Vive dentro da implementação de um contrato de transação, invisível no contrato.

Conflito de concorrência que um desses mecanismos detecta é sempre valor de retorno, nunca `throw`: para o cliente, "outra operação chegou antes" é erro esperado e tratável (recarregar e tentar de novo), não um 500. A forma desse valor, a leitura do código do driver quando a condição só aparece na gravação e o destino do erro de driver não declarado seguem o outcome de persistência de `backend/persistence.md`; o caso de uso é quem constrói o erro de domínio a partir dele.

**Unicidade não é caso de lock.** Invariante de unicidade entre linhas pertence a constraint do banco (unique index), que vale sob qualquer concorrência sem custo de lock. A checagem prévia no caso de uso existe para devolver o erro de domínio amigável; a constraint é a garantia.

## Verificação rápida

- A gravação é uma única chamada de contrato de transação, com toda decisão de domínio antes dela?
- Os parâmetros do contrato são entidades/VOs, sem modelo Prisma nem contexto de transação na assinatura?
- O contrato tem um método `run` só, em `transactions/` nas três camadas, e nenhum repositório ganhou escrita atômica?
- A implementação escreve tudo no mesmo `tx`, via mappers, sem chamar outros repositórios?
- Integração externa ficou fora da transação, depois do commit?
- Fluxo de sistema externo sem meia-escrita em volta, e lacuna residual avaliada como risco?
- Proteção de concorrência nova justificada por gatilho real, com precedente de risco aceito checado antes?
- Escrita condicional devolve o outcome declarado da operação (`false`, ou a união que nomeia cada resultado), com o código do driver lido só na implementação, e o caso de uso é quem constrói o `failure` correspondente, sem `Either`, `DomainError` nem `throw` de condição esperada saindo da persistência?
- Unicidade garantida por constraint, com a checagem prévia existindo só pelo erro amigável?
