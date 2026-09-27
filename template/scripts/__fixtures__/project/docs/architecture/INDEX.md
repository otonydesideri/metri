# Arquitetura do projeto

source: .metri@v0.0

## Stack

- Sem desvio.

## Caminho linear

Padrão: `.metri/architecture/backend/layers.md`, "O caminho de uma request".

- Sem desvio.

## Capacidades ativas

- defaults/ui: shadcn/ui, sem troca
- infrastructure/storage: Cloudflare R2, bucket `orders-attachments`

## Delegações

- Identidade do dono: `Organization`, pelo `organizationId` da sessão

## Caminhos do projeto

- `packages/orders-contract/src/**` → backend/http-api

## Exceções e defaults trocados

- `frontend/components`, "Estados de leitura": a lista de pedidos pagina no servidor → ADR-0001

## Áreas ativas

<!-- rules-index -->

- `frontend` → `frontend/INDEX.md` (1 regra)
