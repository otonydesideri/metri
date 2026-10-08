# ADR-0005 O servidor local usa SQLite com Drizzle e não tem biblioteca de fila

status: accepted
area: backend
kind: default-change

## Contexto

O Metri roda na máquina de quem o usa, com um único processo escrevendo o estado. O núcleo do método é uma stack única, NestJS com Prisma e Postgres, e a fila, quando o projeto precisa de uma, é o pg-boss, que roda sobre Postgres.

### Como o mercado faz

Conferido em 04/10/2026 e em 07/10/2026, no código-fonte (`repositório@commit:arquivo`) ou, nos apps fechados, no pacote oficial:

- Das 17 ferramentas comparáveis, 14 guardam o estado local em SQLite, com o trabalho em segundo plano no próprio processo, e nenhuma usa biblioteca de fila no local. Exemplos: Vibe Kanban (`BloopAI/vibe-kanban@d5cbb538:crates/db/src/lib.rs:79-83`), T3 Code (`pingdotgg/t3code@4ee6bfd5:apps/server/src/persistence/Layers/Sqlite.ts:18-25`) e Morphite (app 0.3.2, `out/main/backend.js`). O app desktop do Claude, o Claude Squad e o Roo Code guardam o estado em arquivos JSON.
- Nenhuma usa Prisma. Com ORM, é o Drizzle: o Superset usa o Drizzle 0.45 sobre o `better-sqlite3` no app e o mesmo Drizzle no Postgres da nuvem, com o adapter oficial do better-auth (`superset-sh/superset@a6de0c84:apps/desktop/package.json:173,184`, `packages/auth/src/server.ts:29,180`). OpenCode e Kilo Code usam o Drizzle 1.0, ainda release candidate, sobre o `node:sqlite` ou o `bun:sqlite` (`anomalyco/opencode@907b3bc5:package.json:64-65`). Sem ORM, o comum é SQL direto no `node:sqlite`, como no T3 Code, no Orca e no Morphite.
- Todas aplicam as migrations na partida, dentro do próprio app, sem CLI. O Superset escreveu um executor próprio sobre os arquivos do drizzle-kit, porque o migrador do Drizzle 0.45 escolhe pela migration mais recente e pula em silêncio a que chega com data mais antiga (`superset-sh/superset@a6de0c84:packages/shared/src/sqlite-migrations/runMigrations.ts:17-62`, `packages/host-service/src/db/db.ts:59-65`; `drizzle-team/drizzle-orm#5769`).

O Metri segue o Superset no servidor local: Drizzle sobre o `better-sqlite3` e um executor próprio de migrations.

Fuga do padrão do método: o Drizzle e o SQLite no lugar do Prisma e do Postgres, só no servidor local.

## Decisão

Só no servidor local. O plano de controle fica no default do método; levá-lo também para o Drizzle, como no Superset, é a direção, decidida no Look across da F16.

Troca estes defaults no servidor local:

- `defaults/stack`, "Stack" (Prisma com Postgres via `@metri/db`): o banco é SQLite, num arquivo da pasta de dados do app, em modo WAL, com um único processo escrevendo, acessado pelo Drizzle 0.45 sobre o `better-sqlite3`, em `packages/db/src/sqlite/<app>/`.
- `backend/persistence` (repositório e mapper sobre o Prisma): no servidor local, a regra é substituída por uma regra do projeto para o Drizzle, escrita num ticket `pattern` da fundação.
- `backend/reading`, "A query de exibição" e "A execução é direta, o contrato não" (o Prisma e o Postgres primário): a leitura usa o Drizzle sobre o SQLite.
- `backend/testing`, "Convenção de nome e execução" (um banco Postgres isolado por arquivo de e2e): cada arquivo de e2e usa um arquivo SQLite próprio.
- `infrastructure/runtime`, "Banco de desenvolvimento" (o Postgres de desenvolvimento): o banco de desenvolvimento é um arquivo SQLite, criado pelas migrations.
- `backend/boundaries`, "Persistência: `@metri/db` é de `infra/persistence/prisma`": no servidor local, o `@metri/db` é de `infra/persistence/drizzle`.
- `defaults/stack`, "Quando precisar" (a fila com o pg-boss): no servidor local não há biblioteca de fila nem Redis. A fila de integração é a tabela de integrações, processada por um worker serial no próprio processo. O scheduler roda a cada mudança de estado, e a retomada depois de um reinício lê as tabelas.

As migrations são os arquivos SQL que o drizzle-kit gera no desenvolvimento. Na partida, o app copia o banco, confere a cópia e aplica as migrations com um executor próprio: ele guarda o nome de cada migration aplicada, roda as pendentes numa transação e aborta a partida se uma falhar. Isso vale desde a fundação, então o primeiro marco já usa o caminho do `beta`. O drizzle-kit fica só no desenvolvimento.

Um trabalho em segundo plano que não caiba nisso volta como pergunta no Look across.

## Alternativas consideradas

- Prisma 7 com SQLite, o default do método:
  - nenhuma das ferramentas comparáveis usa Prisma;
  - no Prisma 8 o SQLite é prova de conceito (`prisma/orm@57675308d6:README.md:100`; https://www.prisma.io/docs/orm/supported-databases), e o 7 recebe correções só por 18 meses depois do lançamento do 8 (https://www.prisma.io/docs/orm/release-status);
  - rodar as migrations pede o CLI e o schema engine nativo, sem API para fazê-lo de dentro do app (`prisma/orm#4703`; https://www.prisma.io/blog/prisma-7-ama-clearing-up-the-why-behind-the-changes).
- Drizzle também no método e no plano de controle, como no Superset: muda o default de todos os projetos, quando a evidência vem de app local. O Prisma está em 22 arquivos de regra e em 15 do starter, e no check `boundaries` (medição de 07/10/2026).
- SQL direto no `node:sqlite`, sem ORM, como T3 Code, Orca e Morphite: dispensa módulo nativo, mas o repositório e o mapper tipados viram regra escrita do zero. O driver do Drizzle para o `node:sqlite` só existe na linha 1.0, ainda release candidate (npm, 07/10/2026: `drizzle-orm` 0.45.3 é a `latest`).
- Postgres embutido em WebAssembly (PGlite), que manteria as regras do método e roda o pg-boss (`pg-boss@12.36.0:README.md:56`):
  - o selo do projeto é alpha;
  - o fsync vem desligado (`electric-sql/pglite@ae182ff`, pacote `pglite`, `src/pglite.ts:151`);
  - nada impede duas instâncias no mesmo diretório, o que corrompe a base (`electric-sql/pglite#327`, `#709`);
  - o formato quebra entre versões minor (`docs/docs/upgrade.md:1-7`).
- Postgres instalado ou em Docker na máquina do usuário: cada instalação passaria a depender de um Postgres rodando.
- Uma biblioteca de fila (BullMQ com Redis, por exemplo): nenhum trabalho do servidor local pede retry com backoff, dead letter ou vários consumidores.

## Consequências

- O `@metri/db` ganha a pasta `src/sqlite/<app>/` do servidor local; a do plano de controle chega no v1.
- A transação do `better-sqlite3` é síncrona ("Transaction functions do not work with async functions", `WiseLibs/better-sqlite3@f8e2d54120:docs/api.md:102`). A escrita atômica fica dentro do repositório, como o método pede, sem esperar nada de fora no meio dela.
- O check `boundaries` tem o caminho `infra/persistence/prisma/` fixo no código. Ele passa a aceitar o caminho da persistência do servidor local numa mudança do método, depois do planejamento e antes da fundação.
- Na casca desktop, o `better-sqlite3` precisa do binário do Electron e de ficar fora do asar (`WiseLibs/better-sqlite3@f8e2d54120:docs/troubleshooting.md:27-31`). Isso se decide antes do `beta`.
- O servidor fica no Drizzle 0.45 e no executor próprio até o Drizzle 1.0 sair estável. Nesse momento, a troca se revê, inclusive o driver do `node:sqlite`, que dispensa módulo nativo.
- O que `backend/async-jobs` diz valer com qualquer ferramenta continua valendo no worker da fila de integração: worker fino, regra de falha e idempotência.
- O aviso de Run travado é um timer no próprio processo (F10). A cópia antes de cada migration e o comando de restaurar valem já no `dogfood` (UC10.3); a cópia de hora em hora entra no `beta`, na F30.

## Imposto por

Não imposto.
