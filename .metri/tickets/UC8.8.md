---
id: UC8.8
title: Parar um ticket que não chega ao Goal
feature: F8
slice: S8
actor: humano
status: open
mode: afk
blocked_by: [UC8.1]
areas: [backend/application, domain/model, backend/http-api]
touches: [runs, tickets]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/build`"]
---

# UC8.8 · Parar um ticket que não chega ao Goal

Como humano, quero que um ticket que não chega ao Goal pare com o resumo do que foi tentado, para decidir o próximo passo em vez de pagar por tentativas sem fim.

## Regras de negócio

- BR11: O ticket fica bloqueado, com o motivo `human` (ADR-0003), depois de três correções no mesmo check vermelho ou quando o orçamento do Run acaba.
- BR108: Um Run de builder começa com o orçamento que o Goal do ticket traz ou, sem ele, com o padrão por Run da Policy.

## Critérios

- [ ] Com o setup do projeto falhando, o ticket volta a `open`, e a Inbox tem o aviso com a saída do setup.
- [ ] Depois de três correções no mesmo check vermelho, o Run termina, o ticket fica `blocked` com o motivo `human`, e a Inbox tem o resumo do que foi tentado.
- [ ] Com o orçamento do Run esgotado, o Run termina sem orçamento, o ticket fica `blocked` com o motivo `human`, e a Inbox tem o resumo do que foi tentado.
- [ ] Quando o Run de um ticket termina falho, ou é interrompido, o ticket fica `blocked` com o motivo `human`, e a Inbox tem o aviso; nenhum ticket fica `in_progress` sem Run, portão ou fila.

## Notas
