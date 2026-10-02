---
id: frontend/order-list
description: "a lista de pedidos do painel — paginação no servidor e filtros na URL."
use_when:
  - "mexer na lista de pedidos do painel"
applies_to:
  - "apps/app-web/src/pages/orders/**"
read_first: [frontend/state]
adr: [ADR-0001]
status: active
---
# Lista de pedidos

**Obrigatório.** A página pedida e os filtros ficam na URL, e a query da lista leva os dois ao servidor.
