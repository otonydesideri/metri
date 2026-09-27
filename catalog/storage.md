---
id: catalog/storage
description: "storage de objetos como capacidade: arquivos e assets do produto em dois buckets por visibilidade, com contrato por asset."
use_when:
  - "o projeto guarda arquivos ou assets"
---
# Storage

## Entrega

- Dois buckets por visibilidade, chave canônica, contrato por asset e escopo do dono; R2 é referência.

## Regras

- `infrastructure/storage`
- `infrastructure/services`

## Ativação

Pergunta: O projeto guarda arquivos ou assets?

## O que fica para o projeto

- Decide: o provider; os dois buckets; o domínio público.
- Registro: Project Architecture.
- ADR quando: o provider não comporta a forma de `infrastructure/storage.md`.
