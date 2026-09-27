# MATRIX

<!-- matrix-view -->
### Features × Slices

| Feature \ Slice | S1 | S2 |
| --- | --- | --- |
| F1 | UC1.1 ~ | UC1.2 o |
| F2 | — | — |
| T (sem UC) | — | T2.1 o |

### Dependências (blocked_by)

```mermaid
graph LR
  classDef draft fill:#eee,stroke:#999
  classDef open fill:#dbeafe,stroke:#3b82f6
  classDef in_progress fill:#fef9c3,stroke:#ca8a04
  classDef blocked fill:#fee2e2,stroke:#dc2626
  classDef done fill:#dcfce7,stroke:#16a34a
  classDef slice fill:#f3e8ff,stroke:#9333ea
  S1["S1"]:::slice
  S2["S2"]:::slice
  T2_1["T2.1"]:::open
  UC1_1["UC1.1"]:::in_progress
  UC1_2["UC1.2"]:::open
  UC2_1["UC2.1"]:::draft
  UC1_1 --> UC1_2
  T2_1 --> UC1_2
```
<!-- /matrix-view -->

## Features

### F1 · Pedidos no painel

horizon: now · slices: [S1, S2]
outcome: O operador acompanha os pedidos da organização.
ucs: [UC1.1, UC1.2]

### F2 · Relatórios

horizon: planned
ucs: [UC2.1]

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

## Fog

- Como relatórios agregam pedidos por período.

## Gaps

- GAP-1 · filtro por status → UC1.1

## Pattern proposals

- PP-1 · de UC1.1 · a lista precisa de ordenação por coluna; frontend/components não cobre → próximo look across
