---
id: infrastructure/logging
description: "o log da aplicação — o `Logger` nativo do NestJS, quem loga e onde, o identificador no lugar da entidade e o que nunca entra em log; o erro inesperado logado pelo filtro global; métrica, alerta e reconciliação quando uma pergunta operacional pede."
use_when:
  - "adicionar log a um provider, controller, subscriber, worker ou repositório"
  - "decidir que dado pode entrar num log"
  - "mandar as linhas de log para um coletor ou agregador"
  - "criar métrica, alerta ou reconciliação"
applies_to:
  - "apps/app-api/src/main.ts"
  - "apps/app-api/src/app.module.ts"
keywords: [log, Logger, "@nestjs/common", nível, dado sensível, PII, coletor, nestjs-pino, redact, métrica, alerta, reconciliação, cardinalidade, dimensão]
not_covered:
  - "a tradução de erro em resposta HTTP → backend/errors"
examples: [backend/errors.examples.md]
status: active
---
# Log

Como a aplicação loga: o `Logger` nativo do NestJS, chamado só por quem está em `infra/`, com o identificador do que aconteceu e sem dado sensível.

## Onde mora

| Quem loga | Como |
| --- | --- |
| Provider de `infra/`: controller, subscriber, worker, repositório, implementação de contrato | `private readonly logger = new Logger(<Classe>.name)` |
| Erro inesperado | o `UnexpectedErrorFilter` loga o 5xx com a stack (`backend/errors.md`) |
| Caso de uso, entidade e value object | não logam: o resultado volta pelo `Either`, e o fato que precisa ser observado vira domain event, logado pelo subscriber (`backend/events.md`) |

## Regras

**Obrigatório.** O log leva o identificador do que aconteceu (`orderId`), nunca a entidade inteira.

> **Por quê.** A entidade arrasta campo pessoal ou sensível para o log.

**Proibido.** Senha, token, cookie, URL assinada, body de request e dado pessoal em log.

**Padrão.** `error` para a falha que pede ação, `warn` para o degradado esperado, `log` para o fato operacional e `debug` para diagnóstico.

## Métrica, alerta e reconciliação

Quando uma pergunta operacional do projeto pede métrica, alerta ou reconciliação:

- **Obrigatório.** A métrica responde à pergunta, e cada dimensão tem um conjunto de valores fechado e pequeno (fila, status, template da rota), nunca um identificador.
- **Obrigatório.** O alerta é sobre comportamento agregado numa janela (taxa, contagem, idade, profundidade) e declara a ação esperada e quem age.
- **Obrigatório.** A reconciliação parte da fonte de verdade, é idempotente e não destrói o que o critério não distingue de um estado ainda em curso.

A ferramenta é decisão de projeto (`.metri/ARCHITECTURE.md`).

## Sob demanda

- **Log estruturado.** Quando as linhas vão para um coletor ou agregador: `nestjs-pino` no lugar do `Logger` nativo (`defaults/stack.md`, "Quando precisar"), com `redact` de `authorization` e `cookie` da request e de `set-cookie` e `location` da response.

## Verificação

- Só `infra/` loga, com `new Logger(<Classe>.name)`; caso de uso, entidade e value object não logam?
- O log leva identificador, e nenhuma senha, token, cookie, URL assinada, body ou dado pessoal?
- O 5xx é logado pelo filtro global, com a stack?
- Métrica com dimensão de valores fechados e alerta com ação e dono, quando existem?
