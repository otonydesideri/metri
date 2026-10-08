---
id: UC9.2
title: Resolver um portão
feature: F9
slice: S16
actor: humano
status: open
mode: afk
blocked_by: [T16.1]
areas: [backend/application, domain/model, frontend/components]
touches: [inbox, gates]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test use-cases/inbox`", "`pnpm --filter app-web test:e2e e2e/inbox/`"]
---

# UC9.2 · Resolver um portão

Como humano, quero ver cada portão com o que está definido, o que foi inferido e o que está em aberto, para decidir sem reconstruir o contexto.

## Regras de negócio

- BR27: Todo portão mostra os três blocos: definido (com a fonte), inferido (com o motivo) e perguntas.
- BR28: Toda resolução grava quem resolveu, quando e o quê.

## Critérios

- [ ] Tela: qualquer portão abre com os três blocos.
- [ ] Tela: a Inbox mostra os itens em três grupos, nesta ordem: aprovações de ferramenta, portões e perguntas, avisos. Aprovação de ferramenta e pergunta se resolvem no próprio card; os portões de direção, de plano e de aceite abrem no painel de detalhe.
- [ ] Os avisos de Goal bloqueado e de Run falho ou travado se resolvem devolvendo o ticket a `open`, com a opção de trocar o modelo do próximo Run, ou cancelando; nenhum devolve o ticket a `in_progress` sem Run.
- [ ] "Resolvidos" mostra o histórico, com quem resolveu, quando e o quê.

## Notas
