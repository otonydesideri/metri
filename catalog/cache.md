---
id: catalog/cache
description: "cache do backend como capacidade: leitura servida de um mecanismo fora da fonte de verdade, com escopo do dono na chave e falha que degrada para a fonte."
use_when:
  - "uma leitura do backend tem necessidade medida de cache"
---
# Cache

## Entrega

- Semântica no fluxo dono; escopo do dono na chave; cache fora da fonte de verdade; falha degrada para a fonte.

## Regras

- `infrastructure/cache`
- `infrastructure/services`

## Ativação

Pergunta: O projeto tem necessidade medida de cache, pelo critério de `infrastructure/cache.md`?

## O que fica para o projeto

- Decide: ativar ou não; o provider; a validade e a invalidação concretas de cada fluxo.
- Default: sem cache.
- Registro: Project Architecture, com a necessidade medida.
- ADR quando: o cache vira dependência de disponibilidade, ou o provider é infraestrutura nova.
