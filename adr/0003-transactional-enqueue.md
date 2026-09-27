# ADR-0003 Forma do enfileiramento transacional

status: proposed
area: backend
kind: decision

## Contexto

O enfileiramento transacional depende da família da ferramenta: no Postgres é o adapter `executeSql`, cujo detalhe fecha na primeira implementação; fora dele, vira desenho de outbox.

## Decisão

A decidir.

## Alternativas consideradas

- Adapter `executeSql`, no Postgres
- Outbox, fora do Postgres
