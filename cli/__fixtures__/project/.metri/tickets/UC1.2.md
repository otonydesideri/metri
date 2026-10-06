---
id: UC1.2
title: Avisar pedido confirmado
feature: F1
slice: S2
actor: cliente
status: open
mode: afk
sensitive: false
blocked_by: [UC1.1, T2.1]
areas: [backend/operation-routing, backend/application, backend/persistence, backend/events, domain/model, backend/errors, infrastructure/services]
touches: [events:order-confirmed]
checks: ["`pnpm verify`", "`pnpm test order-confirmation`"]
---

# UC1.2 · Avisar pedido confirmado

Como cliente, quero ser avisado quando meu pedido for confirmado, para saber que ele está a caminho.

## Regras de negócio

## Critérios

- [ ] O cliente recebe um e-mail quando o pedido é confirmado.

## Notas
