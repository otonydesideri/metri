---
id: backend/transactions
description: "consistência e concorrência da escrita — o domínio decide e a infra só faz IO; o caso de uso dono da transação pela unidade de trabalho; o agregado como unidade de concorrência (`version`); a proteção por risco medido, a retentativa, a ordem das travas e o isolamento; o pai que fecha; o trabalho pesado fora da transação; a escrita de sistema externo que não cabe na transação."
use_when:
  - "escrever um caso de uso que grava um agregado disputado ou dois ou mais agregados"
  - "proteger uma operação contra execução concorrente"
  - "gravar em sistema externo numa operação que também grava no banco"
  - "aceitar um risco de consistência novo"
applies_to:
  - "apps/app-api/src/domain/application/transactions/**"
  - "apps/app-api/src/infra/persistence/prisma/transactions/**"
  - "apps/app-api/test/transactions/**"
keywords: [transação, unidade de trabalho, UnitOfWork, run, $transaction, AsyncLocalStorage, atomicidade, concorrência, locking otimista, version, conflict, retentativa, FOR UPDATE, FOR SHARE, READ COMMITTED, deadlock, ordem de trava, pai que fecha, unicidade, unique index, sistema externo, risco aceito]
not_covered:
  - "a decisão de que a reação é atômica, em linha, evento ou job → backend/operation-routing"
examples: [backend/transactions.examples.md]
status: active
---
# Consistência e concorrência

Onde a decisão de uma escrita acontece, como uma operação grava mais de um agregado junto e como ela se protege de escrita concorrente. São princípios: quando um caso não couber, a solução que preserva "o domínio decide" vence, e a decisão fica registrada. Os exemplos usam o domínio didático de pedidos (`order`, `invoice`).

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

## Concorrência e locking

**Obrigatório.** O agregado é a unidade de concorrência: raiz com escrita concorrente tem coluna `version`, conferida e incrementada no `save()` do repositório, que devolve `'saved' | 'conflict'` (`backend/persistence.md`).

**Obrigatório.** Antes de proteger, avaliar o gatilho: quem provoca duas execuções concorrentes sobre o mesmo agregado, com que frequência, com que dano. Risco de gatilho improvável e dano contido é aceito e registrado como decisão de projeto do app, com racional e condição de revisita; a vigilância em produção segue `infrastructure/observability.md`.

**Padrão.** `version` com retentativa. Trava pessimista (`find...ForUpdate` no repositório, chamado dentro do escopo) só para linha disputada de fato, medida; a decisão continua no caso de uso e no agregado.

> **Por quê.** Trava por reflexo complica o desenho sem risco que a pague.

**Obrigatório.** Unicidade entre linhas é constraint do banco (unique index), lida pelo repositório como outcome (`'duplicate'`); a checagem prévia só existe para o erro amigável.

### Retentativa

Quando o conflito é transitório e a operação não pode falhar por concorrência: **Permitido.** O caso de uso repete o escopo inteiro, relendo e redecidindo.

**Obrigatório.** A retentativa é limitada (3, por padrão); esgotada, o caso de uso devolve o erro de `CONFLICT` (`backend/errors.md`).

### Ordem e isolamento

**Obrigatório.** As transações rodam em READ COMMITTED, o padrão do Postgres.

**Obrigatório.** Toda escrita que toca as mesmas linhas trava e grava na mesma ordem fixa: o pai antes dos filhos; entre linhas do mesmo tipo, por id.

> **Por quê.** Ordem diferente entre duas transações é o deadlock que só aparece sob carga; outro nível de isolamento muda o que `FOR SHARE` e `version` garantem.

### Pai que fecha

Quando um pai fecha e o fechamento calcula sobre os filhos (o total de um pedido sobre os pagamentos dele): **Obrigatório.** A entrada de filho confere o pai aberto com trava compartilhada (`findOpenForShare`, `FOR SHARE`) e o fechamento trava o pai para escrita (`findForUpdate`, `FOR UPDATE`) antes de ler os filhos, os dois dentro do escopo. O cálculo fica no domínio.

> **Por quê.** Sem serializar sobre o pai, um filho escapa do cálculo ou entra num pai fechado.

### Trabalho pesado

**Proibido.** Trabalho de CPU pesado (hash de senha ou PIN) ou espera por rede dentro do escopo.

Quando a decisão depende desse trabalho: **Obrigatório.** Ele roda antes, fora do escopo, e o escopo confirma que o estado em que ele se baseou continua valendo.

## Escrita de sistema externo fica fora do alcance

Quando a gravação é executada por um sistema externo (o adapter de uma biblioteca que traz o próprio schema, uma API de terceiro): **Proibido.** Meia-escrita nossa em volta dela para completar uma atomicidade que ela não oferece. A lacuna residual é avaliada como risco, como em "Concorrência e locking".

## Verificação

- Nenhuma implementação em `infra/` ou dublê chama método de entidade que muda estado, domain service ou regra de negócio?
- Toda regra de negócio da operação está em entidade, value object ou domain service, chamados pelo caso de uso?
- Operação com mais de um agregado, ou com decisão sobre estado lido na transação, usa `UnitOfWork`, sem IO externo dentro?
- A proteção de concorrência tem gatilho concreto, e o conflito volta como valor, com retentativa limitada?
- Travas e escritas na ordem fixa, em READ COMMITTED; pai que fecha com `FOR SHARE` na entrada do filho e `FOR UPDATE` no fechamento?
- Nenhum trabalho de CPU pesado ou espera por rede dentro do escopo?
- Unicidade garantida por constraint?
