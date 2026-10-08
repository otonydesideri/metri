---
id: UC8.3
title: Despachar automaticamente
feature: F8
slice: S15
actor: humano
status: open
mode: afk
blocked_by: [T15.1]
areas: [domain/domain-services, backend/application, backend/async-jobs, frontend/components]
touches: [scheduler]
sensitive: false
checks: ["`pnpm verify`", "`pnpm --filter app-api test domain-services/scheduler`", "`pnpm --filter app-api test use-cases/scheduler`", "`pnpm --filter app-web test:e2e e2e/board/`"]
---

# UC8.3 · Despachar automaticamente

Como humano, quero que o Metri despache sozinho o próximo ticket que não precisa de mim, para deixar de fazer o papel de scheduler.

## Regras de negócio

- BR82: O despacho automático só pega ticket `open`, com as dependências feitas, `afk`, e que não é `pattern`, sensível nem `release`, na ordem do método: os T primeiro, porque destravam, e depois o menor id. Um ticket que voltou a `open` por qualquer volta de status (falha do setup do projeto, devolução, reabertura, recusa de portão) só roda de novo quando o humano o despacha, como os que a regra não pega.
- BR84: Pausar o despacho automático não interrompe o Run em andamento; só impede o próximo despacho.

## Critérios

- [ ] Num projeto recém-aberto, o despacho automático começa pausado.
- [ ] Com o despacho automático ligado, sempre que nenhum ticket do projeto está `in_progress` e a BR82 permite um ticket, o Metri o despacha, sem o humano: quando o plano aprovado entra na branch padrão, quando um ticket sai de `in_progress`, quando um ticket novo fica `open` e ao retomar.
- [ ] Um ticket que voltou a `open` porque o setup do projeto falhou não é despachado de novo sozinho.
- [ ] Um ticket `hitl`, `pattern`, sensível ou `release` na frontier não é despachado sozinho, e o motivo aparece no card dele.
- [ ] Com um ticket `in_progress` no projeto, nenhum outro é despachado automaticamente (BR83).
- [ ] Com o Claude Code no modo conta Claude, ligar o despacho automático mostra o aviso de que os limites do Pro e do Max supõem uso individual comum (ADR-0009).
- [ ] Ao pausar com um Run em andamento, o Run segue até o fim, e nenhum ticket é despachado até o humano retomar.
- [ ] Tela: o Board mostra se o despacho automático está ligado ou pausado, com a ação de pausar e retomar.

## Notas
