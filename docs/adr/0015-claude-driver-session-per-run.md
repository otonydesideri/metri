# ADR-0015 O driver do Claude abre uma sessão por Run, num pacote de drivers

status: accepted
area: backend
kind: decision

## Contexto

O Metri conduz o Claude Code pelo Agent SDK, sem loop próprio (ADR-0009). O driver precisa mandar mensagens no meio de um turno, saber quando o turno acabou, cortar o Run no orçamento, valer a Policy também dentro dos comandos de shell e sobreviver a um reinício (UC10.5). O Codex entra no `beta` pelo mesmo contrato (F19).

### Como o mercado faz

Conferido em 08/10/2026:

- Um `query()` por sessão, com a entrada em fluxo aberta entre turnos: Conductor (0.90.1, offsets 64943443 e 64944136), T3 Code (`pingdotgg/t3code@a4c9494b:apps/server/src/orchestration-v2/Adapters/ClaudeAdapterV2.ts:614-626`) e Orca (`stablyai/orca@e3639ef8:src/main/claude/claude-stream-json-connection.ts:132-148`). Conductor e Orca decidem o fim do turno pelo estado ocioso da sessão com as tarefas em segundo plano vazias, não pelo primeiro `result` (`claude-session-state-turn-over.ts:3-11`, no mesmo commit do Orca).
- Uma pasta por fornecedor com um contrato comum, e o SDK do fornecedor carregado num ponto só: Superset ("The one place the real SDK is wired in", `superset-sh/superset@44d2a8ad:packages/chat-runtime/src/harness/claude/createClaudeAdapter/createClaudeAdapter.ts:5-8`), Orca, com um teste que garante o runtime sem o SDK (`claude-agent-sdk-import-boundary.test.ts:5-13`), e Nimbalyst.
- SDK em versão exata: Conductor, Superset, Orca e Nimbalyst. O binário que vem com o SDK: Conductor e Nimbalyst; o `claude` do usuário: Orca, T3 Code, Superset e Morphite.
- Ninguém passa `maxBudgetUsd`, e ninguém liga o sandbox do Claude Code. No Codex, o sandbox `workspace-write` é o padrão.

Fugas do padrão, que vão ao humano no portão de plano: o `maxBudgetUsd` como rede de segurança e o sandbox do Claude Code ligado.

## Decisão

Os drivers ficam num pacote do monorepo, com o contrato sem fornecedor, o driver do Claude, o do Codex no `beta` e o driver falso dos testes. Só um arquivo do driver do Claude carrega o SDK em tempo de execução, e um check barra o import em outro lugar. O servidor local roda o driver no próprio processo.

O driver do Claude:

- abre um `query()` por Run, com uma fila de entrada que só termina com o Run. O id da sessão deriva do id do Run, e a retomada passa o mesmo id;
- manda a saída de um check vermelho e a resposta de uma pergunta depois que o turno fica ocioso, e a mensagem do humano no meio de um turno com prioridade imediata. Interromper chama `interrupt()`; cancelar chama `interrupt()`, para cada tarefa em segundo plano e fecha a sessão;
- considera o turno terminado pelo estado ocioso da sessão com a lista de tarefas em segundo plano vazia; o estado que pede ação é espera do humano, não fim;
- corta o Run pelo orçamento do Metri, calculado pelos tokens e pela tabela de preços (BR61), e passa também o `maxBudgetUsd` cerca de 10% acima do saldo do Run, como rede de segurança, para o corte do Metri vir antes: é o único corte que alcança os subagentes em segundo plano. Ele vale também no login de conta Claude: num teste de 08/10/2026, com o SDK 0.3.293, o Claude Code 2.1.292 e `apiKeySource: none`, a sessão parou com `error_max_budget_usd` e `budget_exhausted`, medindo pela estimativa a preço de lista; o teto é conferido depois de cada resposta e pode ser passado por uma;
- liga o sandbox do Claude Code no Linux, no WSL2 e no macOS, com escrita só no Workspace e na pasta temporária do Run, a rede pela lista de domínios da Policy, sem comando fora do sandbox e falhando se ele não estiver disponível. Os scripts do projeto que precisam de um serviço em `localhost` rodam fora dele, pela lista da Policy;
- usa por padrão o binário que vem com o SDK; outro caminho é configurável, com a versão mínima conferida.

Os testes de contrato seguem o ADR-0004: transcrição gravada e CLI falso no CI, sem chave; o teste ao vivo é local.

## Alternativas consideradas

- Um processo por turno, com retomada pela sessão, como o Vibe Kanban: perde a condução no meio do turno e paga a abertura a cada turno.
- O fim do turno pelo primeiro `result`: termina o Run com subagente ainda rodando.
- Só o corte do Metri, sem `maxBudgetUsd`, como todo o mercado: um subagente em segundo plano segue gastando depois do limite até o Metri interromper a sessão.
- Sem sandbox, como todo o mercado no Claude: um comando de shell escreveria fora do Workspace e acessaria a rede sem passar pela aprovação, porque o `canUseTool` não vê o que um script faz.
- O `claude` do usuário como padrão: o teste de contrato não cobriria o par exato de SDK e binário.

## Consequências

- A tela de Harnesses confere, antes do primeiro Run, o que o sandbox pede no Linux (`bubblewrap`, `socat`, namespaces de usuário liberados) e recusa o WSL1.
- O binário empacotado pesa por plataforma (236 MB no macOS ARM).
- No Windows nativo não há sandbox (ADR-0010).

## Imposto por

O check da regra do projeto escrita no T2.1, que barra o import do SDK fora do driver, e os testes de contrato do driver. Até eles, não imposto.
