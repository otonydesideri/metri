---
id: frontend/order-list
description: "a lista de pedidos do painel — o estado vazio sem a ação de criar pedido."
use_when:
  - "mexer na lista de pedidos do painel"
applies_to:
  - "apps/app-web/src/pages/orders/**"
read_first: [frontend/state]
adr: [ADR-0001]
status: active
---
# Lista de pedidos

**Obrigatório.** Sem filtro ativo na URL, o estado vazio da lista oferece atualizar a lista e não oferece criar pedido (ADR-0001).
