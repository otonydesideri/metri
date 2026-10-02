# ADR-0001 Lista de pedidos vazia não convida a criar

status: accepted
area: frontend
kind: exception

## Contexto

- O operador acompanha pedidos no painel; quem cria o pedido é o cliente, no checkout.

## Decisão

- Exceção a `frontend/components`, "Estados de leitura", só na lista de pedidos do painel: o vazio sem filtro não convida a criar pedido e oferece atualizar a lista.

## Alternativas consideradas

- Convidar a criar, como a regra pede: leva o operador a uma ação que o painel não tem.

## Consequências

- O vazio da lista de pedidos não tem a ação de criar.

## Imposto por

não imposto
