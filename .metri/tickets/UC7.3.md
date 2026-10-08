---
id: UC7.3
title: Devolver um ticket em andamento
feature: F7
slice: S8
actor: humano
status: open
mode: afk
blocked_by: [UC8.1]
areas: [backend/application, domain/model, frontend/forms]
touches: [tickets, runs]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/tickets`", "`pnpm --filter app-web test:e2e e2e/tickets/`"]
---

# UC7.3 · Devolver um ticket em andamento

Como humano, quero devolver um ticket em andamento ou bloqueado, com o motivo, para tirar o trabalho de um Run que não vai chegar ao Goal.

## Regras de negócio

## Critérios

- [ ] Devolver com motivo um ticket em andamento, ou bloqueado com o motivo `human`, cancela o Run dele, se houver, e põe o ticket de novo em `open`, com o motivo nas notas.
- [ ] Devolver sem motivo é recusado, e o erro aparece junto do campo de motivo.
- [ ] Cancelar com motivo um ticket em andamento cancela o Run dele antes de pôr o ticket em `cancelled`.
- [ ] Reabrir um ticket feito que tem um dependente em andamento interrompe o Run do dependente antes de bloqueá-lo com o motivo `dependency`.

## Notas
