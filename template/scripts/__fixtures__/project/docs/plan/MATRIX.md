# MATRIX

## Features

### F1 · Pedidos no painel

horizon: now · slices: [S1, S2]
outcome: O operador acompanha os pedidos da organização.

#### UC1.1 · Listar pedidos

actor: operador · status: open

- BR1: Só aparecem pedidos da organização do operador.
- [ ] A lista mostra os pedidos mais recentes primeiro.

#### UC1.2 · Avisar pedido confirmado

actor: cliente · status: open

- [ ] O cliente recebe um e-mail quando o pedido é confirmado.

### F2 · Relatórios

horizon: planned

## Slices

### S1 · Lista de pedidos

horizon: now · entry: apps/app-web/src/pages/orders/orders-page.tsx

#### T1.1 · Listar pedidos no painel

uc: UC1.1 · type: tracer · mode: afk · status: in_progress · sensitive: false
areas: [frontend/components, frontend/data-fetching, frontend/order-list] · touches: [router:orders]
checks: [`pnpm verify`]

### S2 · Avisos de pedido

horizon: now · blocked_by: [S1]
contract:
  responsibility: Avisa o cliente quando o pedido muda de estado.
  interface: `OrderConfirmationSender.send(order)`.
  invariants: Um aviso por mudança de estado.
  consumers: [F1]
  planned: Aviso de pedido enviado.

#### T2.1 · Enviar e-mail de pedido confirmado

uc: UC1.2 · type: tracer · mode: afk · status: open · blocked_by: [T1.1] · sensitive: false
areas: [infrastructure/mail, backend/application, backend/persistence, backend/events, domain/model, backend/errors, infrastructure/services] · touches: [events:order-confirmed]
checks: [`pnpm verify`, `pnpm test order-confirmation`]

## Fog

- Como relatórios agregam pedidos por período.

## Gaps

- GAP-1 · filtro por status → T1.1

## Pattern proposals

- PP-1 · de T1.1 · a lista precisa de ordenação por coluna; frontend/components não cobre → próximo look across
