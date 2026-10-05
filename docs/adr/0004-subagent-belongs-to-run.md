# ADR-0004 O subagente pertence ao Run que o disparou

status: accepted
area: backend
kind: decision

## Contexto

Claude Code e Codex disparam subagentes por conta própria dentro de uma sessão, e o Metri precisa mostrá-los. Um Run tem sessão própria no harness, Workspace, orçamento, Goal e motivo de parada. O subagente não tem nada disso: quem o cria, controla e encerra é o harness.

O que cada harness expõe, conferido em 04/10/2026:

- Claude Agent SDK, versão 0.3.289, com o Claude Code 2.1.289:
  - as mensagens e as chamadas de ferramenta do subagente chegam no mesmo fluxo de eventos, marcadas com `parent_tool_use_id`, o id da chamada que o criou; o aninhamento chega a 3 níveis, com até 20 subagentes simultâneos ([subagents](https://code.claude.com/docs/en/agent-sdk/subagents), [typescript](https://code.claude.com/docs/en/agent-sdk/typescript));
  - texto e pensamento do subagente só chegam com a opção `forwardSubagentText`, e nunca token a token ([streaming-output](https://code.claude.com/docs/en/agent-sdk/streaming-output));
  - o `canUseTool` recebe o id do subagente, e o subagente roda no modo de permissão do pai ([permissions](https://code.claude.com/docs/en/agent-sdk/permissions));
  - um subagente em segundo plano pode ser parado sozinho, por `stopTask`, com `perTaskStopAffordance` ligado (`sdk.d.ts` do pacote `@anthropic-ai/claude-agent-sdk`);
  - o custo em dólar vem somado para a árvore inteira; por subagente, só o total de tokens ([cost-tracking](https://code.claude.com/docs/en/agent-sdk/cost-tracking)).
- Codex `app-server`, repositório `openai/codex` no commit `d0759639` (npm `@openai/codex` 0.160.0):
  - os subagentes são estáveis e ligados por padrão (`features.multi_agent`, em `codex-rs/features/src/lib.rs`; [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents));
  - cada subagente é uma thread filha com `parentThreadId`, e a thread pai recebe o item `collabAgentToolCall` (`app-server-protocol/schema/typescript/v2/Thread.ts`, `v2/ThreadItem.ts`);
  - os eventos da thread filha chegam na mesma conexão, com o `threadId` dela; isso vem do código, não da documentação (`app-server/src/lib.rs`, [app-server](https://learn.chatgpt.com/docs/app-server));
  - o filho herda a política de aprovação e o sandbox do pai, e os pedidos de aprovação trazem o `threadId` (`core/src/agent/child_config.rs`);
  - os tokens vêm por thread, sem custo em dólar no fluxo; por padrão o subagente não cria netos.

### Como o mercado faz

- Nenhum produto trata o subagente como sessão de primeiro nível. O Conductor desenha o subagente aninhado e expansível dentro da conversa pai, com o status e o prompt (bundle 0.90.1, `renderApp-*.js`). O Nimbalyst mostra cada subagente como um card no transcript, com os eventos filhos indentados (`Nimbalyst/nimbalyst`, `RichTranscriptView.tsx`). O Orca mostra linhas filhas sob o agente líder (`stablyai/orca`, `docs/site/content/docs/agents/claude-code.mdx`).
- O Superset, o T3 Code e o app desktop do Claude mostram o subagente como filho do pai, com um painel para abri-lo (changelog do Superset de 13/09/2026; `pingdotgg/t3code`, `docs/user/thread-sidebar.md`; https://code.claude.com/docs/en/desktop).

O Metri segue o padrão. O painel para abrir um subagente, comum no mercado, fica como refinamento da tela do Run.

## Decisão

O subagente (`Subagent`) pertence ao Run que o disparou. Ele aparece dentro da conversa desse Run e como nó filho no mapa de Runs, com os eventos marcados pelo id do pai. O orçamento e a Policy são os do Run pai, e o custo do subagente é estimado pelos tokens. O Metri não despacha, não retoma e não dá orçamento próprio a um subagente.

Junto, três regras:

1. O subagente é conveniência do harness. Quando o método precisa de contexto limpo, Policy própria ou papel definido (crítico, surveyor, pesquisa, revisores), isso é um Run de papel, nunca um subagente. Um subagente não substitui uma revisão.
2. O subagente não chama `propose`, `report`, `ask_human` nem `add_note`. Se o harness repassar o MCP ao subagente (não confirmado; o ticket do MCP do Metri confere), a chamada é registrada no Run pai, com o id do subagente no evento.
3. A herança de Policy e de custo é teste de contrato de cada driver: o filho não escapa da Policy do pai, e o custo dele entra no orçamento do pai.

## Alternativas consideradas

- O subagente como Run próprio, filho do pai: daria uniformidade na tela, mas o Run, que é a unidade de custo, tentativa, orçamento e Goal, passaria a ter um ciclo de vida que o Metri não controla.
- Não modelar: o subagente apareceria só como uma chamada de ferramenta, e o humano não veria o que ele fez.

## Consequências

- O evento normalizado tem um id de pai, e o subagente tem um id próprio como apelido.
- Quando o harness não informa o custo, o Metri calcula pela tabela de preços, com os tokens que tiver.
- No Claude, o Run não termina no primeiro resultado enquanto houver subagente em segundo plano.
- Fica como risco, em todas as plataformas, o bug em que o `canUseTool` deixa de funcionar para subagentes em segundo plano depois do primeiro resultado (`anthropics/claude-agent-sdk-typescript#376` e `#384`, abertos em 05/10/2026). O ticket do driver do Claude decide como contornar.
- No Codex, o Metri descobre o filho pelo item de spawn na thread pai ou pelo primeiro evento com um `threadId` desconhecido.

## Imposto por

Os testes de contrato de cada driver, da regra 3. Até eles existirem, não imposto.
