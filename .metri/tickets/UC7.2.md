---
id: UC7.2
title: Operar um ticket
feature: F7
slice: S5
actor: humano
status: open
mode: afk
blocked_by: [T5.1, T5.4]
areas: [domain/model, backend/application, domain/domain-services, frontend/forms]
touches: [tickets, scheduler]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/tickets`", "`pnpm --filter app-web test:e2e e2e/tickets/`"]
---

# UC7.2 · Operar um ticket

Como humano, quero cancelar ou reabrir um ticket com o motivo registrado, para que nenhuma mudança de status aconteça em silêncio.

## Regras de negócio

- BR15: Toda volta de status (cancelar, reabrir, devolver) exige motivo, que vai para as notas e para o histórico, com o autor. Cancelar põe o ticket em `cancelled` e cancela o Run dele, se houver (ADR-0003). Um ticket que outro tem como dependência só se cancela depois que o plano tirar a dependência.
- BR16: Reabrir um ticket feito só vale enquanto a slice dele não foi aceita. Os dependentes que não estão feitos ficam bloqueados com o motivo `dependency`, apontando para ele.

## Critérios

- [ ] Tela: o ticket mostra história e regras de negócio (ou o que entrega, num T), critérios, Goal, o último resultado de cada check, notas, Runs e o histórico de status com autor e motivo.
- [ ] Cancelar com motivo um ticket aberto o põe em `cancelled`, com o motivo nas notas, e ele sai da frontier.
- [ ] Cancelar sem motivo é recusado, e o erro aparece junto do campo de motivo.
- [ ] Reabrir com motivo um ticket feito, numa slice ainda não aceita, o devolve a `open`; o motivo vai para as notas, e os dependentes que não estão feitos ficam `blocked` com o motivo `dependency`.
- [ ] Cancelar um ticket que outro tem como dependência é recusado, com o motivo.
- [ ] Numa slice já aceita, reabrir fica desabilitado, com o motivo: faça um pedido, que vira um ticket novo.
- [ ] Tela: um ticket bloqueado mostra o motivo em texto ("Precisa de você", "Dependência" ou "Externo", ADR-0003) e o link para o item que o destrava.

## Notas
