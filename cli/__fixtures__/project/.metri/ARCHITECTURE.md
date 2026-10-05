# Arquitetura do projeto

## Stack

- Sem desvio.

## Caminho linear

1. `apps/app-web/src/pages/orders/orders-page.tsx:OrdersPage` lista os pedidos da organização na rota /orders.
2. `apps/app-api/src/legacy/order-export.ts:orderExportRoute` recebe a exportação legada de pedidos.

## Capacidades ativas

- defaults/ui: —
- infrastructure/storage: Cloudflare R2, bucket `orders-attachments`

## Delegações

- Identidade do dono: `Organization`, pelo `organizationId` da sessão

## Caminhos do projeto

- `apps/app-api/src/legacy/**` → backend/http-api

## Exceções e defaults trocados

- `frontend/components`, "Estados de leitura": o vazio da lista de pedidos não convida a criar → ADR-0001

## Áreas ativas

<!-- rules-index -->

- `frontend` → `rules/frontend/INDEX.md` (1 regra)
