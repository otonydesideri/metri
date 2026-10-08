---
id: UC9.3
title: Ser avisado do que espera você
feature: F9
slice: S16
actor: humano
status: open
mode: afk
blocked_by: [S14, S15]
areas: [frontend/state, frontend/components, frontend/experience]
touches: [app-web:notifications]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-web test lib/notifications`", "`pnpm --filter app-web test:e2e e2e/inbox/`"]
---

# UC9.3 · Ser avisado do que espera você

Como humano, quero ser avisado fora do Metri quando algo espera por mim, para não deixar um agente parado sem saber.

## Regras de negócio

- BR29: Aprovação de ferramenta sempre notifica, porque o agente está parado; os outros tipos de item seguem a configuração.
- BR30: O aviso diz o projeto, o alvo e o estado, e só diz "concluído" depois que o verificador confirmou.

## Critérios

- [ ] Com uma aprovação de ferramenta pendente, o sistema operacional mostra uma notificação, mesmo com a aba do Metri em segundo plano.
- [ ] O humano liga ou desliga a notificação por tipo de item, menos para aprovação de ferramenta.
- [ ] Tela: o contador da Inbox aparece em toda tela, com as aprovações de ferramenta destacadas.
- [ ] Sem permissão de notificação no navegador, a Inbox diz como ligar.
- [ ] Tela: a Inbox ensina a manter a aba do Metri ativa, isentando o site do descarte de abas do navegador.

## Notas
