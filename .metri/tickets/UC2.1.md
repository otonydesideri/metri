---
id: UC2.1
title: Conferir o Claude Code
feature: F2
slice: S2
actor: humano
status: open
mode: afk
blocked_by: [T2.1, T2.2]
areas: [infrastructure/services, backend/application, backend/http-api, frontend/components]
touches: [packages/harness, app-web:pages/harnesses]
sensitive: true
checks: ["`pnpm verify`", "`pnpm --filter @metri/harness test claude`", "`pnpm --filter app-api test:e2e controllers/harnesses`", "`pnpm --filter app-web test:e2e e2e/harnesses/`"]
---

# UC2.1 · Conferir o Claude Code

Como humano, quero ver se o Claude Code está pronto para o Metri usar, para não despachar trabalho para um agente que não vai rodar.

## Regras de negócio

- BR3: O Metri nunca oferece login de Claude; usa o login que a pessoa fez no próprio Claude Code.
- BR4 (sensitive): O Metri nunca lê nem guarda credencial ou token do harness, e nunca acrescenta credencial ao ambiente do harness. O processo do harness recebe o ambiente da máquina como está, menos o `ANTHROPIC_API_KEY` e o `ANTHROPIC_AUTH_TOKEN` quando o modo escolhido é conta Claude (BR92). O teste do login é uma sessão curta do harness, nunca a leitura dos arquivos de credencial.
- BR5: Os dois métodos de login do Claude Code, a conta Claude e a API, continuam disponíveis, e quem escolhe é a pessoa, na tela de Harnesses. Uma credencial que passa à frente do login da conta (o `apiKeyHelper` ou um provedor de nuvem) gera aviso; o Metri se baseia na origem que o SDK informa, nunca no valor.

## Critérios

- [ ] Com o Claude Code logado na máquina, o teste abre uma sessão curta do harness, e a tela mostra a resposta, a versão e o modelo.
- [ ] Com outro caminho do binário configurado, o teste usa esse caminho e mostra a versão dele.
- [ ] Sem login, o teste falha, e a tela diz que o login se faz no próprio Claude Code.
- [ ] Com um `apiKeyHelper` ou um provedor de nuvem ligado, a tela mostra a origem da credencial que o SDK informa e avisa que a cobrança não vai para a conta Claude.
- [ ] Um teste sem resposta em 60 s para a sessão, diz que o Claude Code não respondeu e não deixa processo rodando.
- [ ] Com a versão do binário diferente da suportada, a tela avisa e mostra a versão suportada.
- [ ] Nenhum evento, log ou linha do banco contém credencial ou token do harness depois do teste.
- [ ] Tela: nos menus, o harness aparece como "Claude Agent".
- [ ] Tela: o estado do Claude Code aparece em texto (pronto, sem login, versão diferente), nunca só por cor.

## Notas

- No WSL2, o login do Claude Code pode pedir para colar um código mostrado no navegador (https://code.claude.com/docs/en/authentication); a tela de Harnesses explica isso.
