---
id: backend/transactions
description: "consistência da escrita — o domínio decide e a infra só faz IO; o caso de uso dono da transação pela unidade de trabalho; IO externo e trabalho pesado fora do escopo; unicidade por constraint; sob demanda, a concorrência sobre agregado disputado (`version`, retentativa, ordem das travas, pai que fecha, spec de concorrência)."
use_when:
  - "escrever um caso de uso que grava um agregado disputado ou dois ou mais agregados"
  - "proteger uma operação contra execução concorrente"
  - "chamar IO externo numa operação que também grava no banco"
  - "aceitar um risco de consistência novo"
applies_to:
  - "apps/app-api/src/domain/application/transactions/**"
  - "apps/app-api/src/infra/persistence/prisma/transactions/**"
  - "apps/app-api/test/transactions/**"
keywords: [transação, unidade de trabalho, UnitOfWork, run, $transaction, AsyncLocalStorage, atomicidade, concorrência, locking otimista, version, conflict, retentativa, FOR UPDATE, FOR SHARE, READ COMMITTED, deadlock, ordem de trava, pai que fecha, unicidade, unique index, risco aceito, concurrency.e2e-spec]
not_covered:
  - "a decisão de que a reação é atômica, em linha, evento ou job → backend/operation-routing"
enforced_by: [concurrency]
examples: [backend/transactions.examples.md]
status: active
---
# Consistência da escrita

Onde a decisão de uma escrita acontece e como uma operação grava mais de um agregado junto. Quando um caso não couber, a solução que preserva "o domínio decide" vence, e a decisão fica registrada. Os exemplos usam o domínio didático de pedidos (`order`, `invoice`).

## O domínio decide; a infra só faz IO

**Obrigatório.** Toda regra de negócio (o que muda, quanto custa, se é permitido) roda em entidade, value object ou domain service, chamados pelo caso de uso.

**Proibido.** Implementação em `infra/` (repositório, unidade de trabalho, query) ou dublê em memória chamar método de entidade que muda estado, chamar domain service ou ramificar por regra de negócio: eles leem, convertem pelo mapper e gravam.

> **Por quê.** Regra na infra existe em duas cópias, a real e a do dublê, que divergem; fica sem spec unitário; e o agregado vira dado manipulado de fora.

## Unidade de trabalho

Quando uma operação precisa gravar mais de um agregado junto, ou decidir sobre estado lido dentro da transação: **Obrigatório.** O caso de uso abre o escopo pela porta `UnitOfWork` (`domain/application/transactions/unit-of-work.contract.ts`) e faz leitura, decisão e gravação dentro dele, com os repositórios e os métodos de domínio de sempre.

- Os repositórios chamados dentro do escopo participam da mesma transação sem que o caso de uso veja `tx`: a implementação publica o `tx` num contexto assíncrono que os repositórios usam quando existe.
- `failure(...)` devolvido pelo trabalho desfaz o escopo inteiro e volta como está: o `Either` continua valendo dentro da transação.
- Os eventos dos agregados gravados no escopo são despachados depois do commit; num escopo desfeito, são descartados (`backend/events.md`).

**Proibido.** IO externo (e-mail, API de terceiro, fila fora do banco) dentro do escopo: ele acontece depois, pelo mecanismo de `backend/operation-routing.md`.

> **Por quê.** O caso de uso conhece o fluxo; com a fronteira da transação nele, a decisão fica no domínio mesmo quando depende do estado lido dentro da transação.

### Trabalho pesado

**Proibido.** Trabalho de CPU pesado (hash de senha ou PIN) ou espera por rede dentro do escopo.

Quando a decisão depende desse trabalho: **Obrigatório.** Ele roda antes, fora do escopo, e o escopo confirma que o estado em que ele se baseou continua valendo.

## Concorrência e locking

**Obrigatório.** Unicidade entre linhas é constraint do banco (unique index), lida pelo repositório como outcome (`'duplicate'`); a checagem prévia só existe para o erro amigável.

A proteção de um agregado disputado por escrita concorrente é a receita de "Sob demanda".

## Aplicação

A infraestrutura é código real do starter, sem domínio nenhum nela:

- O contrato: transactions.examples.md#unitofwork-o-contrato.
- `TransactionContext`, que publica o `tx` por `AsyncLocalStorage`: `client()` para leitura (o `tx` aberto, ou o client comum fora de escopo) e `requireTx()` para escrita (o mesmo `tx`, ou lança): transactions.examples.md#transactioncontext.
- `PrismaUnitOfWork.run()`, com o despacho ou o descarte dos eventos depois do `$transaction`: transactions.examples.md#prismaunitofwork.
- A prova, contra uma tabela que o próprio teste cria e derruba: transactions.examples.md#a-prova-do-unitofwork.

O caso de uso com dois agregados no mesmo escopo, `Order` confirmado e `Invoice` emitida, é exemplo didático: transactions.examples.md#unitofwork.

## Sob demanda

- **Concorrência.** Quando um agregado é disputado de fato por escrita concorrente (duas execuções sobre a mesma raiz, com dano medido): transactions.examples.md#concurrency — `version` no `save()`, retentativa, ordem das travas, pai que fecha e o spec de concorrência.

## Verificação

- Nenhuma implementação em `infra/` ou dublê chama método de entidade que muda estado, domain service ou regra de negócio?
- Toda regra de negócio da operação está em entidade, value object ou domain service, chamados pelo caso de uso?
- Operação com mais de um agregado, ou com decisão sobre estado lido na transação, usa `UnitOfWork`, sem IO externo dentro?
- Nenhum trabalho de CPU pesado ou espera por rede dentro do escopo?
- Unicidade garantida por constraint?
- Agregado com coluna `version` tem o `*.concurrency.e2e-spec.ts` da receita? (check: concurrency)
