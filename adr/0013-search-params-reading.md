# ADR-0013 Leitura de search params

status: proposed
area: frontend
kind: decision

## Contexto

A leitura de search params usa `useSearchParams` do react-router enquanto for pontual; `nuqs` (adapter de react-router, parsers tipados) entra quando a conversão manual de número, boolean ou enum virar repetição, ou quando um filtro composto precisar de atualização em lote da URL.

## Decisão

A decidir.

## Alternativas consideradas

- `useSearchParams` do react-router
- `nuqs` (adapter de react-router, parsers tipados)
