# ADR-0016 O registro de eventos só cresce, e as telas leem projeções gravadas junto

status: accepted
area: backend
kind: decision

## Contexto

O Metri mostra a conversa de um Run ao vivo e precisa reconstruí-la depois de um reinício, e a evidência do verificador e do aceite precisa ser imutável (F10; `ProjectEvent`, "um fato imutável"). O estado das telas (Runs, Inbox, Board) muda a cada fato.

### Como o mercado faz

Conferido em 08/10/2026:

- Quem reconstrói a conversa ao vivo usa um log que só cresce como fonte e grava a projeção na mesma transação: T3 Code (`pingdotgg/t3code@a4c9494b:apps/server/src/persistence/Migrations/001_OrchestrationEvents.ts:8-43`), OpenCode, com Drizzle sobre SQLite e transação `immediate` (`anomalyco/opencode@5d9cd9b2:packages/core/src/event/sql.ts:4-25`), Superset (`superset-sh/superset@44d2a8ad:packages/chat-runtime/src/journal/journal/journal.ts:81-124`) e Orca. Conductor, Vibe Kanban e Morphite usam tabelas de estado.
- O delta de streaming não é gravado; o evento que fecha o item leva o valor inteiro (OpenCode e Superset).
- O evento bruto do harness fica fora do banco: o T3 Code o grava em NDJSON por thread, com rotação (`apps/server/src/provider/EventNdjsonLogger.ts:25-62,195-235`), e o Vibe Kanban tirou os logs brutos do SQLite por desempenho (`BloopAI/vibe-kanban@d5cbb538:crates/services/src/services/container.rs:845-860`).

O Metri segue o OpenCode e o Superset, sem o CQRS inteiro do T3 Code.

## Decisão

- Uma tabela de eventos que só cresce, com a sequência global (o cursor das telas), a sequência por Run, o tipo e a versão dele, o ator, a causa, o payload validado pelo schema do tipo e a referência ao evento bruto. O banco recusa alterar ou apagar uma linha.
- As projeções que as telas leem (`runs`, `run_items` e as dos outros módulos) são gravadas na mesma transação do evento, por código síncrono; o evento vai ao WebSocket logo depois do commit (ADR-0013).
- O delta de streaming vai só pelo WebSocket. O evento bruto do harness vai num NDJSON por Run, na pasta de dados, sem os deltas.
- Um campo de payload acima de 16 KiB guarda o começo, o tamanho, o hash e a marca de cortado, como o Orca; a íntegra fica em arquivo, por referência.
- Segredo nunca entra no payload; entra por referência. O evento de início de um processo grava os nomes das variáveis de ambiente, não os valores.
- O banco tem uma época, trocada quando uma cópia é restaurada (UC10.3); o cliente com outra época recarrega.
- O registro não é compactado no `dogfood`: é a evidência do verificador e do aceite.

## Alternativas consideradas

- Tabelas de estado com upsert, como Conductor, Vibe Kanban e Morphite: a conversa de antes de um reinício não se reconstrói, e a evidência pode mudar.
- O CQRS inteiro do T3 Code, com recibos de comando e outbox: custo sem uso no `dogfood`, com um processo só escrevendo.
- O evento bruto no banco: o Vibe Kanban saiu disso por desempenho.

## Consequências

- O teto do NDJSON bruto por Run e no total se decide no portão de plano; a F17 exporta o Run a partir dele.
- Nenhuma das ferramentas lidas mascara por padrão o payload de evento; o Metri mascara pela BR103 e testa que nenhum valor de variável marcada como sensível chega ao payload.

## Imposto por

O check da regra do projeto escrita no T3.1 e a recusa do banco a alterar ou apagar um evento. Até eles, não imposto.
