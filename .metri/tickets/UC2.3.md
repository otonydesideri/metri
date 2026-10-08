---
id: UC2.3
title: Usar o Claude Code com chave de API
feature: F2
slice: S2
actor: humano
status: open
mode: afk
blocked_by: [UC2.1]
areas: [infrastructure/services, backend/application, infrastructure/logging, frontend/forms]
touches: [packages/harness, run-env]
sensitive: true
checks: ["`pnpm verify`", "`pnpm --filter @metri/harness test claude`", "`pnpm --filter app-api test use-cases/harnesses`", "`pnpm --filter app-web test:e2e e2e/harnesses/`"]
---

# UC2.3 · Usar o Claude Code com chave de API

Como humano, quero usar o Claude Code com uma chave de API em vez do plano da conta Claude, para ter o caminho que os termos da Anthropic garantem.

## Regras de negócio

- BR55 (sensitive): O login por API fica no próprio Claude Code: pela conta do Console, com chave ou com o perfil sem chave, ou pela variável no ambiente da máquina, que o processo do harness herda. O Metri nunca guarda nem lê uma credencial.
- BR56: Na tela de Harnesses, a pessoa escolhe o modo, conta Claude ou API, e o Metri mostra a origem da credencial que o SDK informa (`apiKeySource` e `accountInfo`) para ela conferir.
- BR103 (sensitive): Antes de gravar um evento, um log ou a saída de um check, o Metri mascara os padrões conhecidos de chave e de token da Anthropic, sem ler o ambiente.
- BR92 (sensitive): O modo escolhido decide a chave de API no ambiente do Run: em conta Claude, o Metri não repassa o `ANTHROPIC_API_KEY` nem o `ANTHROPIC_AUTH_TOKEN` ao processo do Run; em API, repassa os dois. Com um deles no ambiente e nenhum modo escolhido, o Metri pergunta antes do primeiro Run.

## Critérios

- [ ] Com o `ANTHROPIC_API_KEY` ou o `ANTHROPIC_AUTH_TOKEN` no ambiente e o modo conta Claude, a sessão do harness abre sem eles, e a origem que o SDK informa não é a chave do ambiente.
- [ ] Com o modo API, a sessão abre com a chave do ambiente, e a tela mostra essa origem.
- [ ] Com a chave no ambiente e nenhum modo escolhido, nenhuma sessão do harness abre antes da escolha, e o motivo diz onde escolher.
- [ ] Trocar o modo vale a partir da sessão seguinte.
- [ ] Com o Claude Code logado com uma conta do Console, com ou sem chave, o teste abre uma sessão curta do harness e mostra a origem da credencial.
- [ ] Tela: a tela explica como entrar com chave de API no próprio Claude Code e não tem campo para digitar a chave.
- [ ] Chaves de exemplo da Anthropic, uma chave de API e um token de autenticação, que passam pelo log do servidor e pela saída da sessão de teste, não aparecem gravadas em lugar nenhum.

## Notas

- Como `apiKeySource`, `subscriptionType` e `tokenSource` se traduzem em conta Claude, chave, Console sem chave e provedor de nuvem não está documentado (não confirmado); este ticket confirma na prática.
