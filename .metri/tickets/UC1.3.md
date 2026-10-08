---
id: UC1.3
title: Entrar no Metri pela partida
feature: F1
slice: S1
actor: humano
status: open
mode: afk
blocked_by: [S0]
areas: [infrastructure/runtime, general/http-surface, frontend/routing, frontend/data-fetching]
touches: [access-guard]
sensitive: true
checks: ["`pnpm verify`", "`pnpm --filter app-api test:e2e infra/access`", "`pnpm --filter app-web test:e2e e2e/access/`"]
---

# UC1.3 · Entrar no Metri pela partida

Como humano, quero que só o navegador aberto pela partida do Metri fale com o servidor, para que nenhum outro site ou programa da máquina comande os meus agentes.

## Regras de negócio

- BR101 (sensitive): O servidor escuta só em `127.0.0.1` e exige o token em toda chamada HTTP e WebSocket, conferindo o `Origin` e o `Host`. A regra vale para todo o Metri, e este UC é o primeiro que a usa.
- BR104 (sensitive): O token da partida chega à página só pelo fragmento da URL, vira uma sessão em cookie que o script da página não lê e sai da barra de endereço. Ele nunca vai no HTML servido nem na URL do WebSocket, e a sessão vive só na memória do servidor.

## Critérios

- [ ] A partida abre o navegador com o token no fragmento da URL; a página o troca por uma sessão e o tira da barra de endereço.
- [ ] Uma segunda partida abre o navegador já com acesso ao servidor que roda, e a instância continua única, com o arquivo de execução só do dono.
- [ ] Um check recusa um servidor que escute em `0.0.0.0`.
- [ ] Uma chamada HTTP ou a abertura do WebSocket em `/api/ws` sem a credencial da partida recebe 401.
- [ ] Uma chamada com `Origin` ou `Host` diferente da origem do servidor, com a porta, é recusada, inclusive a que vem do app do Preview, noutra porta de `127.0.0.1`.
- [ ] Uma aba aberta antes de o servidor reiniciar diz que o Metri reiniciou e como abri-lo de novo.
- [ ] As respostas levam os cabeçalhos de segurança do servidor local, e a política de conteúdo só libera em quadro as portas de Preview de `127.0.0.1` e `localhost`.

## Notas
