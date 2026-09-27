---
id: UC1.1
title: Listar pedidos
feature: F1
slice: S1
actor: operador
status: in_progress
mode: afk
sensitive: false
areas: [frontend/components, frontend/data-fetching, frontend/order-list]
touches: [router:orders]
checks: ["`pnpm verify`", "`pnpm test orders-page`"]
---

# UC1.1 · Listar pedidos

## Regras de negócio

- BR1: Só aparecem pedidos da organização do operador.

## Critérios

- [ ] A lista mostra os pedidos mais recentes primeiro.

## Notas
