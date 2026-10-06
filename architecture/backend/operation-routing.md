---
id: backend/operation-routing
description: "a escolha do mecanismo que executa uma operação ou um efeito — escrita do agregado, transação no repositório, chamada direta em linha, domain event, job assíncrono e tarefa agendada — e a resposta a um efeito pós-commit que falha."
use_when:
  - "decidir se uma reação vira chamada direta, transação, evento ou job"
  - "escrever caso de uso que grava em mais de um agregado"
  - "criar evento, subscriber, job ou cron novo"
  - "aceitar a perda de um efeito secundário"
keywords: [roteamento de operação, chamada direta, em linha, transação, domain event, subscriber, job, tarefa agendada, cron, compensação, retry, dead letter, efeito aditivo, efeito pós-commit, auditoria]
not_covered:
  - "evento, despacho, subscriber e falha no handler → backend/events"
  - "contrato de fila, worker, quem enfileira, idempotência, retry e dead letter → backend/async-jobs"
  - "escrita canônica do agregado e a `$transaction` do repositório → backend/persistence"
status: active
---
# Roteamento de operação

Por qual mecanismo cada parte de uma operação acontece. Os documentos de cada mecanismo dizem como ela é construída.

## Atomicidade só para o que precisa valer junto

**Obrigatório.** Antes de juntar dois agregados numa transação, revisar a fronteira: talvez seja um agregado só, talvez o segundo só reaja, talvez falte o agregado dono do estado que a regra lê e reescreve (`domain/model.md`).

> **Por quê.** Remodelar elimina o problema em vez de administrá-lo.

| A parte da operação | Mecanismo |
| --- | --- |
| Disparada por tempo, não por ação | Tarefa agendada (`backend/async-jobs.md`) |
| Raiz e filhos do mesmo agregado | Escrita do agregado (`backend/persistence.md`) |
| Precisa valer junto com a operação, ou o resultado decide o fluxo e a falha reverte | `$transaction` dentro do método do repositório (`backend/persistence.md`) |
| O resultado decide o fluxo, a falha não reverte a operação | Chamada direta em linha, por contrato injetado (`backend/application.md`) |
| Reação que tolera perda com log (alerta, cache, analytics) | Domain event (`backend/events.md`) |
| Reação que não pode se perder, pesada ou dependente de sistema instável | Job (`backend/async-jobs.md`) |

**Proibido.** Evento para invariante real do negócio.

> **Por quê.** Evento é fire-and-forget: a invariante vira janela de inconsistência que aparece como bug raro.

**Proibido.** Transação para efeito independente da operação principal.

> **Por quê.** Ela fica longa, com contenção e acoplada à disponibilidade do efeito.

Auditoria que não pode existir sem a operação, nem a operação sem ela: **Obrigatório.** Grava na mesma transação.

## Efeito pós-commit que falha

Quando o efeito de um fluxo eventual falha depois do commit: **Obrigatório.** Retry pela fila, fila de inspeção (dead letter) para o que falha sempre, ou compensação explícita que dispara a operação inversa; nunca compensação improvisada.

## Verificação

- A fronteira foi revista antes da transação, sem agregado faltando para o estado que a regra reescreve?
- Cada parte da operação caiu no mecanismo da tabela, sem evento para invariante real e sem transação para efeito independente?
- Efeito pós-commit que pode falhar tem retry, dead letter ou compensação explícita?
