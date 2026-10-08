# ADR-0013 A tela recebe os eventos por WebSocket, com cursor por sequência

status: accepted
area: frontend
kind: exception

## Contexto

A tela do Run precisa mostrar cada evento em até 300 ms (UC10.1), e o Board, a Inbox e a lista de Runs mudam a cada fato do projeto. O tier de tempo real de `frontend/data-fetching` faz isso por `refetchInterval`, com o exemplo de 3 s. Para ficar abaixo de 300 ms, cada query viva de cada aba teria de repetir a requisição mais rápido que isso.

### Como o mercado faz

Conferido em 08/10/2026:

- O WebSocket com a biblioteca `ws` é o transporte de quem tem servidor local com tela no navegador: o T3 Code (RPC sobre `ws` 8.22.0, `pingdotgg/t3code@a4c9494b:apps/server/src/ws.ts:3125-3178`), o Superset (`/events` sobre `@hono/node-ws`, `superset-sh/superset@44d2a8ad:packages/workspace-client/src/lib/eventBus.ts:423-493`) e o cliente pareado do Orca (`stablyai/orca@e3639ef8:src/main/runtime/rpc/ws-transport.ts:193-204`). Nenhum usa polling como caminho de tempo real, e nenhum usa socket.io.
- O cursor por sequência é do T3 Code: a assinatura manda `afterSequence`, o servidor devolve o que falta, marca `synchronized` e segue ao vivo, deduplicando por sequência (`pingdotgg/t3code@a4c9494b:packages/contracts/src/orchestrationV2.ts:3234-3253,3362-3388`).
- O Superset invalida as queries do React Query a cada evento e a cada reabertura (`useWorkspaceConnectionRefresh.ts:13-37`, no mesmo commit); o OpenCode invalida ou faz `setQueryData` com sequência (`anomalyco/opencode@5d9cd9b2:packages/app/src/context/server-sync.tsx:547-598`).

O Metri segue o T3 Code no protocolo e o Superset na ligação com o React Query.

## Decisão

Exceção a `frontend/data-fetching`, "Freshness: `staleTime` é decisão do hook", no tier de tempo real do app-web do Metri: os eventos chegam por push, num WebSocket por aba em `/api/ws`, em vez de `refetchInterval`.

- A assinatura é por projeto ou por Run, com o `afterSeq`. O servidor registra o ouvinte, manda o que falta do SQLite, manda `synced` e segue ao vivo, só com sequência maior que a última enviada. Um evento só sai depois do commit.
- Um assinante lento é desligado e retoma pelo `afterSeq`. Com uma lacuna grande demais, ou com a época do banco trocada por uma restauração, o servidor manda `reset`, e o cliente recarrega por REST.
- No app-web, um dono do socket por aba, como o `QueryClient`. Dado de entidade e de lista é invalidado pela key factory; a linha do tempo do Run recebe os eventos por `setQueryData`, deduplicados por sequência, com `staleTime: Infinity`. O dado do servidor continua no React Query.
- O envelope do evento é a resposta da rota REST de backfill, então entra no OpenAPI, e cada mensagem do socket é validada por ele na borda.
- O `upgrade` passa pela guarda de acesso da S1 antes do handshake, com o `ws` em `noServer`.

## Alternativas consideradas

- Polling, o default: não chega a 300 ms sem repetir requisições sem parar em cada aba.
- SSE: cada aba prende uma conexão HTTP/1.1, e com seis abas o navegador para de abrir requisições ao servidor; o `Last-Event-ID` se reproduz com o `afterSeq`.
- Estado do servidor fora do React Query, em atoms ou stores, como T3 Code, Vibe Kanban e OpenCode: dois lugares para o mesmo dado no app-web.

## Consequências

- O handler do socket é um caminho novo de sincronização de cache fora de mutation; ele usa a key factory do módulo do hook.
- O padrão é um ticket `pattern` da S3 (T3.2), com a regra do projeto e o exemplo canônico.

## Imposto por

O check da regra do projeto escrita no T3.2. Até ela, não imposto.
