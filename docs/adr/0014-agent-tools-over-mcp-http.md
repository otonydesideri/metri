# ADR-0014 Os agentes falam com o Metri por MCP HTTP, com um token por Run

status: accepted
area: backend
kind: decision

## Contexto

Os agentes pedem trabalho, entregam o resultado, perguntam ao humano e propõem plano ao Metri, e o Metri precisa saber de qual Run veio cada chamada e o que o papel dele pode fazer. O transporte serve o Claude Code agora e o Codex no `beta` (F19).

### Como o mercado faz

Conferido em 08/10/2026:

- Ferramentas próprias por MCP num endpoint HTTP em `127.0.0.1`, com token: o T3 Code, com token por sessão e só o hash guardado (`pingdotgg/t3code@a4c9494b:apps/server/src/orchestration-v2/Adapters/ClaudeAdapterV2.ts:977-985`; `McpSessionRegistry.ts:128`), e o Nimbalyst, com token por execução do app (`Nimbalyst/nimbalyst@6f14adff`, `McpConfigService.ts:141-145,268`), para o Claude e para o Codex. O Morphite usa o mesmo caminho para o Codex (app 0.3.2, `out/main/backend.js:31268-31279`).
- Conductor e Morphite servem o MCP dentro do processo do SDK (`type: "sdk"`), só para o Claude. Orca e Superset dão uma CLI no shell.
- O "terminei" é o fim do turno em quase todos. Só o Orca tem um sinal explícito, o `worker_done` (`stablyai/orca@e3639ef8`, `preamble.ts:106-111`).
- A pergunta ao humano prende a chamada até a resposta, com prazo longo: Orca, T3 Code (65 minutos) e Nimbalyst (uma semana).

Fugas do padrão, que vão ao humano no portão de plano: o `report` como sinal de fim, como só o Orca faz; o `ask_human` sem prender a chamada; e o hook que recusa ao subagente as ferramentas de escrita.

## Decisão

As ferramentas do Metri (`get_work`, `rules_for`, `report`, `ask_human`, `propose` e `add_note`) ficam num endpoint MCP do servidor local, em `127.0.0.1`, com um token por Run.

- O token tem 32 bytes aleatórios, é guardado só como hash, é comparado em tempo constante e é revogado quando o Run termina; a retomada recebe um novo. Ele resolve o Run, o papel e o projeto, e a lista de ferramentas devolve só as do papel.
- O servidor recusa chamada com `Origin` e com `Host` diferente do esperado.
- O fim do trabalho é o `report`, com o resultado estruturado que o verificador precisa. Ele grava e responde na hora. Todo fim de turno dispara o verificador: vermelho volta ao agente; verde sem `report` pede o `report` uma vez, e o ticket só fica `blocked` se o pedido for ignorado.
- O `ask_human` não prende a chamada: o Run fica esperando você, e a resposta chega como mensagem nova na mesma sessão, o que sobrevive a um reinício (UC10.5). A pergunta nativa do Claude Code passa pelo `canUseTool` e prende a chamada sem prazo (`@anthropic-ai/claude-agent-sdk@0.3.293`, `sdk.d.ts:205-211`; https://code.claude.com/docs/en/agent-sdk/user-input), então fica desligada (`disallowedTools`) e, com `toolAliases`, vai para o `ask_human`: um caminho só.
- As ferramentas do Metri são pré-aprovadas no harness. Um hook antes de cada ferramenta recusa ao subagente `report`, `propose`, `ask_human` e `add_note` e grava o evento no Run pai, com o id do subagente (ADR-0004); `get_work` e `rules_for`, de leitura, ficam liberadas.
- `propose` e `add_note` só existem depois da troca da fonte do plano (ADR-0012).

## Alternativas consideradas

- MCP dentro do processo do SDK, como Conductor e Morphite: não serve o Codex e depende do canal do SDK que tem os bugs `anthropics/claude-agent-sdk-typescript#376` e `#384` abertos.
- Uma CLI no shell, como Orca e Superset: a identidade do Run iria por variável de ambiente, que o agente lê e repassa.
- O fim do turno como sinal de fim: o verificador ficaria sem o resultado estruturado.
- A pergunta presa até a resposta: morre com o processo num reinício, e a retomada a mostra cortada.

## Consequências

- O token do Run entra na configuração MCP da sessão; no Codex, se a configuração ficar gravada no histórico dele, o token fica em disco até ser revogado (não confirmado; o driver do Codex confere).
- Se o Claude Code mandar à requisição MCP algo que identifique o subagente, o hook pode dar lugar a uma checagem no servidor (não confirmado).

## Imposto por

O check da regra do projeto escrita no T8.1, que acusa ferramenta registrada fora do arquivo de registro, e o teste de contrato do hook do subagente. Até eles, não imposto.
