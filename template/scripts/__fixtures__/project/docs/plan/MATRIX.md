# MATRIX

## Features

### F1 · Pedidos no painel

horizon: now · slices: [S1, S2]
outcome: O operador acompanha os pedidos da organização.

#### UC1.1 · Listar pedidos

actor: operador · status: in_progress · slice: S1 · mode: afk · sensitive: false
areas: [frontend/components, frontend/data-fetching, frontend/order-list] · touches: [router:orders]
checks: [`pnpm verify`, `pnpm test orders-page`]

- BR1: Só aparecem pedidos da organização do operador.
- [ ] A lista mostra os pedidos mais recentes primeiro.

#### UC1.2 · Avisar pedido confirmado

actor: cliente · status: open · slice: S2 · mode: afk · blocked_by: [UC1.1, T2.1] · sensitive: false
areas: [infrastructure/mail, backend/application, backend/persistence, backend/events, domain/model, backend/errors, infrastructure/services] · touches: [events:order-confirmed]
checks: [`pnpm verify`, `pnpm test order-confirmation`]

- [ ] O cliente recebe um e-mail quando o pedido é confirmado.

### F2 · Relatórios

horizon: planned

#### UC2.1 · Ver pedidos por período

actor: operador · status: draft

- [ ] O operador vê o total de pedidos de cada mês.

## Slices

### S1 · Lista de pedidos

horizon: now · entry: apps/app-web/src/pages/orders/orders-page.tsx

### S2 · Avisos de pedido

horizon: now · blocked_by: [S1]
contract:
  responsibility: Avisa o cliente quando o pedido muda de estado.
  interface: `OrderConfirmationSender.send(order)`.
  invariants: Um aviso por mudança de estado.
  consumers: [F1]
  planned: Aviso de pedido enviado.

#### T2.1 · Conta no provedor de e-mail

type: task · mode: hitl · status: open · sensitive: true
areas: [infrastructure/mail, infrastructure/runtime] · touches: [env:app-api]
checks: [`pnpm verify`]
what: A conta no provedor de e-mail, com o domínio de envio verificado e a chave de API no env do app-api.
criteria:
- [ ] O domínio de envio está verificado no provedor.
- [ ] A chave de API existe no env de desenvolvimento do app-api.

## Fog

- Como relatórios agregam pedidos por período.

## Gaps

- GAP-1 · filtro por status → UC1.1

## Pattern proposals

- PP-1 · de UC1.1 · a lista precisa de ordenação por coluna; frontend/components não cobre → próximo look across
