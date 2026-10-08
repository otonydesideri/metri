# Arquitetura do projeto

## Stack

Padrão: `node_modules/metri/architecture/defaults/stack.md`.

- Servidor local: SQLite em modo WAL, pelo Drizzle 0.45 sobre o `better-sqlite3`, com executor próprio de migrations e sem biblioteca de fila → ADR-0005
- Kit de UI: coss ui no lugar do shadcn/ui, com o toast do Base UI → ADR-0006
- Drivers de harness num pacote próprio, com o Claude Agent SDK em versão exata → ADR-0015
- Node 24

## Caminho linear

## Capacidades ativas

- backend/async-jobs: o worker roda no próprio processo do servidor local, sobre uma tabela do SQLite → ADR-0005
- defaults/ui: —
- domain/domain-services: —

## Delegações

- Autenticação: token novo a cada partida, trocado por uma sessão em cookie `HttpOnly`, só em memória → ADR-0002
- Autorização: as ferramentas do Metri por papel do Run, pelo token do Run → ADR-0014
- Módulos e agregados: um módulo por capacidade (`projects`, `harness`, `runs`, `events`, `workspaces`, `plan`, `inbox`, `verification`, `build`, `integrations`, `initiatives`, `requests`, `acceptance`, `diagnosis`); todo agregado é do app, e o plano é projeção do git até a troca → ADR-0012
- Banco de desenvolvimento: arquivo SQLite na pasta de dados (`METRI_HOME`), criado pelas migrations → ADR-0005
- Topologia de deploy: um processo local em `127.0.0.1`, que roda da cópia fixa → ADR-0002, ADR-0008
- Segurança HTTP: cabeçalhos pelo `helmet`, com a CSP só da própria origem e das portas de Preview em quadro, sem HSTS

## Exceções e defaults trocados

- `general/http-surface`, "Superfície HTTP": o servidor local entrega o build do app-web em `/`, com a API em `/api` → ADR-0002
- `defaults/stack`, "Stack": o servidor local usa SQLite com o Drizzle sobre o `better-sqlite3` → ADR-0005
- `defaults/stack`, "Quando precisar": sem biblioteca de fila no servidor local → ADR-0005
- backend/persistence substituída pela regra do projeto → ADR-0005
- `backend/reading`, "A query de exibição": a leitura usa o Drizzle sobre o SQLite → ADR-0005
- `backend/testing`, "Convenção de nome e execução": cada arquivo de e2e usa um arquivo SQLite próprio → ADR-0005
- `infrastructure/runtime`, "Banco de desenvolvimento": o banco de desenvolvimento é um arquivo SQLite → ADR-0005
- `backend/boundaries`, "Persistência: `@metri/db` é de `infra/persistence/prisma`; `PrismaService` circula dentro de infra": o `@metri/db` do SQLite é de `infra/persistence/drizzle` → ADR-0005
- `defaults/ui`, "Kit": o kit é o coss ui → ADR-0006
- `defaults/ui`, "Tema e dark mode do `app-web`": os tokens, as cores e as fontes são os do coss → ADR-0006
- `frontend/theming`, "Tema: contrato de classe e provider no `@metri/ui`": quem nunca escolheu vê o tema escuro → ADR-0007
- `frontend/data-fetching`, "Freshness: `staleTime` é decisão do hook": o tier de tempo real recebe os eventos por WebSocket, em vez de `refetchInterval` → ADR-0013

## Áreas ativas

<!-- rules-index -->
