---
id: domain/domain-services
description: "o domain service — a regra de domínio sem estado que combina conceitos que nenhum agregado possui sozinho; quando não é um (agregado que falta, orquestração, valor derivado), a forma mínima, a casa e o spec."
use_when:
  - "escrever regra de domínio fora de value object, entidade ou agregado"
  - "criar domain service em `domain/`"
  - "tirar da entidade uma regra que combina mais de um conceito"
applies_to:
  - "apps/app-api/src/domain/enterprise/domain-services/**"
keywords: [domain service, service de domínio, função pura, sem IO, enterprise/domain-services, calculateLoyaltyDiscount]
not_covered:
  - "value object, entidade, agregado e a mutação interna → domain/model"
  - "caso de uso e orquestração → backend/application"
  - "variação de comportamento escolhida por dado → domain/strategy"
  - "regra booleana de domínio com mais de um consumidor → domain/specification"
  - "interação entre contextos → domain/bounded-contexts"
activation: "Alguma BR dos UCs é regra de domínio sem dono natural num value object, numa entidade ou num agregado?"
examples: [domain/domain-services.examples.md]
status: active
---
# Domain Service

Domain service é raro: a maioria das regras tem dono no modelo (`domain/model.md`). Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Quando é um domain service

Quando a regra é de domínio, sem estado, e combina conceitos que nenhum value object, entidade ou agregado possui sozinho: **Permitido.** Ela virar domain service.

Não é domain service:

- **Estado persistido que a regra lê e reescreve** (um saldo, um contador, os lotes de um produto): é agregado, e a regra é método dele (`domain/model.md`).
- **Função que só encadeia métodos de entidades**, passando o resultado de um ao outro: é orquestração, e mora no caso de uso.
- **Valor derivado do estado de uma entidade**, mesmo que uma leitura de tela também precise dele: é método da entidade.
- **Variação escolhida por dado** ou **regra booleana com mais de um consumidor**: `domain/strategy.md` e `domain/specification.md`.

> **Por quê.** Quando o dono não existe, a regra procura casa e vira função solta ou código de infra; criar o dono é o que dá casa a ela.

## Forma e casa

**Obrigatório.** Recebe os fatos já carregados por argumento (o instante e o identificador também), devolve um valor e não muta nada; quem aplica a mudança é o caso de uso, pelos métodos das entidades.

**Proibido.** Conhecer repositório, contrato, framework ou IO, e ser chamado pela infra ou por dublê (`backend/transactions.md`).

**Obrigatório.** Mora em `src/domain/enterprise/domain-services/<regra>.ts`, um arquivo por regra, como função pura; nasce com spec unitário colocado (`<regra>.spec.ts`), sem dublê.

**Proibido.** Entidade importar de `domain-services/`: tipo compartilhado entre entidades é value object.

Exemplo: domain-services.examples.md#calculateloyaltydiscount

## Verificação

- A regra não é estado persistido sem agregado, orquestração nem valor derivado de uma entidade?
- Recebe fatos, devolve valor, sem mutar nem fazer IO, chamada só pelo caso de uso?
- Mora em `enterprise/domain-services/`, com spec unitário, sem entidade importando dela? (check: boundaries)
