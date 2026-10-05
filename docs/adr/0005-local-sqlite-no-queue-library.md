# ADR-0005 O servidor local usa SQLite e não tem biblioteca de fila

status: accepted
area: backend
kind: default-change

## Contexto

O Metri roda na máquina de quem o usa, com um único processo escrevendo o estado. A stack padrão do método pede Postgres, e a fila padrão, o pg-boss, só roda sobre Postgres. Seguir o padrão no servidor local obrigaria cada usuário a ter um Postgres rodando.

### Como o mercado faz

O que ferramentas comparáveis usam para o estado local, conferido em 04/10/2026 no código-fonte (`repositório@commit:arquivo`) ou, nos apps fechados, no pacote oficial:

- Vibe Kanban: SQLite pelo sqlx, com journal `DELETE` (sem WAL), e tarefas tokio com intervalo no próprio processo; um processo só (`BloopAI/vibe-kanban@d5cbb538:crates/db/src/lib.rs:79-83`).
- Conductor (fechado): um `conductor.db` em SQLite, aberto pelo `tauri-plugin-sql` sobre o sqlx (strings do binário 0.90.1). WAL, migrações e trabalho em segundo plano: sem fonte primária.
- Morphite (fechado): SQLite pelo `node:sqlite`, em WAL, com migrações próprias; trabalho em segundo plano com mutex e timers no processo, sem biblioteca de fila; um processo só escreve (`out/main/backend.js` do app 0.3.2). Uma trava num SQLite separado, no diretório comum do git, impede duas instâncias de integrar no mesmo repositório.
- OpenCode: SQLite com Drizzle sobre `bun:sqlite` ou `node:sqlite`, em WAL; trabalho em segundo plano em fibers Effect no processo (`anomalyco/opencode@907b3bc5:packages/core/src/database/database.ts:27-53`).
- ZCode (fechado): SQLite pelo `node:sqlite`, em WAL; um processo agendador separado varre a tabela a cada 20 s e devolve tarefas interrompidas à fila na partida (`out/scheduler/index.js` do app 3.14.4).
- T3 Code: SQLite pelo `node:sqlite`, em WAL; um scheduler no processo lê o trabalho devido das tabelas (`pingdotgg/t3code@4ee6bfd5:apps/server/src/persistence/Layers/Sqlite.ts:18-25`).
- Sculptor: SQLite com SQLAlchemy, em WAL; uma thread lê as tarefas da tabela e, na partida, devolve as que estavam rodando à fila (`imbue-ai/sculptor@f847102a:sculptor/sculptor/database/core.py:120`).
- Orca, Superset, Nimbalyst, Goose, Cline e Kilo Code também usam SQLite em WAL, com trabalho em segundo plano no processo. O app desktop do Codex usa SQLite com better-sqlite3 e uma tabela de jobs com lease. O app desktop do Claude, o Claude Squad e o Roo Code guardam o estado em arquivos JSON.

Das 17 ferramentas, 14 usam SQLite e nenhuma usa biblioteca de fila no local. Nenhuma usa Prisma: o acesso mais comum é o `node:sqlite` (7), seguido de `bun:sqlite`, `better-sqlite3` e sqlx (3 cada).

Fuga do padrão: o acesso pelo Prisma. O humano decidiu manter o Prisma 7, porque as regras de persistência e de transação do método e o starter são escritos para ele.

### Por que as ferramentas locais evitam o Prisma

Conferido em 05/10/2026. Nenhuma das ferramentas escreve por que não usa o Prisma: não há justificativa nas issues e nos PRs de OpenCode, Kilo Code, T3 Code, Cline, Superset, Nimbalyst e Orca. Os motivos vêm da documentação e das issues do próprio Prisma.

- Até o Prisma 6, o client dependia de um query engine nativo em Rust, de cerca de 14 MB, um por sistema e versão de OpenSSL, escolhido por `binaryTargets` (https://www.prisma.io/docs/orm/v6/more/internals/engines; https://www.prisma.io/blog/rust-to-typescript-update-boosting-prisma-orm-performance). No Electron, o binário ficava fora do asar, com o caminho passado por API interna (`prisma/orm#9619`). A issue de suporte ao Electron está aberta desde 2021, com relatos de 70 MB de binários no Windows (`prisma/orm#9613`) e de 4 a 5 s só para importar o client (`prisma/orm#7457`).
- O `migrate` só roda pelo CLI, como processo filho; não há API para rodá-lo de dentro do app (`prisma/orm#4703`, aberta desde 2020).

No Prisma 7 (7.0.0, de 19/11/2025), o query engine nativo saiu. O client usa um compilador em Wasm de 2 a 4 MB com o driver adapter, e o runtime cabe num arquivo só (https://github.com/prisma/orm/releases/tag/7.0.0). Continuam:

- as migrations no schema engine nativo, um binário de cerca de 23 MB por plataforma, baixado na instalação e chamado pelo CLI ("The Driver Adapter flow for introspection and migration was scrapped", https://www.prisma.io/blog/prisma-7-ama-clearing-up-the-why-behind-the-changes; `prisma/orm#29394`);
- a falta de API para rodar o `migrate` de dentro do app (`prisma/orm#4703`);
- a falta de guia para Electron.

Além disso, no Prisma 8, com GA previsto para outubro de 2026, o SQLite é experimental, num pacote separado (`@prisma/orm-sqlite`). O 7 recebe correções por 18 meses depois do GA do 8 (https://www.prisma.io/docs/orm/supported-databases; https://www.prisma.io/docs/orm/release-status).

O motivo principal, o engine nativo do client, não vale no Prisma 7. Valem o binário das migrations e a falta de API para rodá-las de dentro do app, que só pesam quando o Metri roda empacotado, fora do repositório.

## Decisão

Troca dois defaults, só no servidor local; o plano de controle fica no Postgres e na fila padrão.

- `defaults/stack`, "Stack" (Prisma com Postgres): no servidor local, o banco é SQLite, com Prisma 7 e o adapter `better-sqlite3`, em modo WAL, num arquivo da pasta de dados do app, com um único processo escrevendo.
- `defaults/stack`, "Stack", e `backend/async-jobs` (a fila é o pg-boss): no servidor local não há biblioteca de fila nem Redis. A fila de integração é a tabela de integrações, processada por um worker serial no próprio processo. O scheduler roda a cada mudança de estado. A retomada depois de um reinício lê as tabelas.

Um trabalho em segundo plano que não caiba nisso volta como pergunta no Look across.

## Alternativas consideradas

- Postgres instalado ou em Docker na máquina do usuário: mantém a stack padrão, mas cada instalação passa a depender de um Postgres rodando.
- Postgres embutido em WebAssembly (PGlite): mantém o dialeto, mas o adapter do Prisma é da comunidade, e não há confirmação de que o pg-boss rode nele.
- `node:sqlite`: dispensa módulo nativo, mas o Prisma não tem adapter oficial para ele.
- Drizzle sobre o `better-sqlite3`, como OpenCode, Kilo Code e Superset: as migrations rodam de dentro do app, sem binário. As regras de persistência e de transação do método e o starter, porém, são escritos para o Prisma, e o servidor local teria um acesso ao banco diferente do plano de controle.
- Uma biblioteca de fila (BullMQ com Redis, por exemplo): nenhum trabalho do servidor local pede retry com backoff, dead letter ou vários consumidores.

## Consequências

- O `packages/db` tem um cliente por banco: SQLite para o servidor local e Postgres para o plano de controle.
- O `better-sqlite3` é módulo nativo: a casca desktop do ADR-0002 precisa recompilá-lo para o Electron.
- No primeiro marco, as migrations rodam pelo CLI do Prisma, na cópia fixa do ADR-0008. Como elas rodam na partida, na máquina de um usuário de fora, volta como pergunta no Look across do `beta`: o CLI com o schema engine de cada plataforma junto, ou os `migration.sql` aplicados por um executor próprio sobre o `better-sqlite3`.
- O servidor local fica no Prisma 7 enquanto o SQLite do Prisma 8 for experimental. O fim do suporte do 7 é o prazo para rever esta decisão.
- O que `backend/async-jobs` diz valer com qualquer ferramenta continua valendo no worker da fila de integração: worker fino, regra de falha e idempotência.
- O aviso de Run travado é um timer no próprio processo (F10). O backup diário do banco, outro trabalho por tempo, volta como pergunta no Look across.

## Imposto por

Não imposto.
