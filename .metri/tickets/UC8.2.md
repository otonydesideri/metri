---
id: UC8.2
title: Registrar lacuna e proposta de padrão
feature: F8
slice: S10
actor: humano
status: open
mode: afk
blocked_by: [T10.2, UC5.1]
areas: [backend/application, domain/model, frontend/components]
touches: [plan, gates]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/plan`", "`pnpm --filter app-web test:e2e e2e/gates/`"]
---

# UC8.2 · Registrar lacuna e proposta de padrão

Como humano, quero que o builder registre pelo Metri o que deixou de fora e a regra que não serviu, para eu ver cada caso com id e decidir o que fazer.

## Regras de negócio

- BR13: Os ids de lacuna (`GAP-n`) e de proposta de padrão (`PP-n`) são dados pelo Metri, nunca pelo agente.

## Critérios

- [ ] Quando o builder registra uma lacuna, existe um `GAP-n`, e o builder recebe o id para o comentário no código.
- [ ] Quando o builder registra uma proposta de padrão, existe uma `PP-n`, o Run termina, o ticket fica `blocked` com o motivo `human` apontando para ela, e a Inbox tem o portão da proposta.
- [ ] No portão de uma proposta de padrão, virar lacuna ou descartar devolve o ticket a `open`, com a resposta nas notas, para um Run novo; levar ao próximo Look across o mantém bloqueado até o novo portão de plano.

## Notas
