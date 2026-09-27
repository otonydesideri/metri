---
id: catalog/observability
description: "observabilidade operacional como capacidade: métrica, alerta e reconciliação, cada um com a pergunta operacional que o justifica."
use_when:
  - "uma pergunta operacional pede métrica, alerta ou reconciliação"
---
# Observabilidade

## Entrega

- Métrica com pergunta e cardinalidade controlada; alerta acionável; reconciliação idempotente a partir da fonte de verdade.

## Regras

- `infrastructure/observability`

## Ativação

Pergunta: Alguma pergunta operacional do projeto pede métrica, alerta ou reconciliação?

## O que fica para o projeto

- Decide: a ferramenta; as métricas concretas; os thresholds; os destinos; as reconciliações concretas.
- Registro: Project Architecture.
- ADR quando: a ferramenta é infraestrutura nova, ou uma dimensão de identificador é aceita.
