# MATRIX

## Slices

### S0 · Fundação

horizon: now

### S1 · Projetos e acesso

horizon: now · blocked_by: [S0]
contract:
  responsibility: Só o navegador aberto pela partida fala com o servidor local, e cada projeto aberto é um repositório git com branch padrão e o método instalado, registrado sem tocar nos arquivos dele.
  interface: A sessão da partida (`POST /api/session`) e a guarda de acesso do HTTP e do upgrade do WebSocket; `GET /api/projects`, `POST /api/projects` e `GET /api/projects/:id`; o agregado `Project`, com a pasta, a branch padrão e a versão do método.
  invariants: Nenhuma chamada passa sem a credencial da partida, com `Host` e `Origin` exatos (BR101); o servidor só escuta em `127.0.0.1`; abrir um projeto não muda o repositório (BR2).
  consumers: [F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F14]
  planned: Criar projeto a partir do starter e começar o método num repositório com código (F21); a casca desktop, que entrega a credencial sem o navegador (ADR-0002).

### S2 · Harness

horizon: now · blocked_by: [S1, S4]
contract:
  responsibility: Conduz sessões de um harness por um contrato sem fornecedor, com o binário oficial sem modificação, sem ler, guardar nem acrescentar credencial.
  interface: `AgentRuntime` (`check`, `start`, `resume`) e `AgentSession` (eventos normalizados com o id do pai, `send`, `interrupt`, `cancel`, `respondToApproval`), no pacote dos drivers, com o driver do Claude e o driver falso; o modo do harness, conta Claude ou API; o filtro de mascaramento da BR103.
  invariants: Só o driver do fornecedor importa o SDK dele; no modo conta Claude, `ANTHROPIC_API_KEY` e `ANTHROPIC_AUTH_TOKEN` não chegam ao processo (BR92); toda sessão abre com o modo de permissão `default` explícito; o subagente não escapa da Policy do Run pai (ADR-0004).
  consumers: [F3, F4, F5, F8, F9, F10, F12, F14]
  planned: O driver do Codex pelo mesmo contrato (F19); o modelo pela complexidade do ticket (F20); o Windows nativo, sem sandbox (F25).

### S3 · Runs e eventos

horizon: now · blocked_by: [S2]
contract:
  responsibility: Grava cada fato do projeto num registro que só cresce, antes de mostrá-lo, e mantém cada Run, com a sessão do harness e o estado dele, que a tela acompanha ao vivo.
  interface: O registro de `ProjectEvent` (anexar na mesma transação das projeções; ler por `sequence`); o WebSocket `/api/ws`, com assinatura por projeto ou por Run a partir de `afterSeq`; `GET /api/runs/:id/events`; o agregado `Run`, com os estados da BR74, a Policy com que abriu e o Run de onde veio.
  invariants: Todo evento é gravado antes de ir para a tela, e o registro só cresce (BR17); segredo nunca entra no payload, só por referência, e o payload passa pelo mascaramento (BR103); o Run guarda a Policy com que abriu.
  consumers: [F2, F3, F4, F5, F6, F7, F8, F9, F11, F12, F14]
  planned: O mapa de Runs pelo pai que cada Run grava (F13); as métricas (F15); a exportação a partir do evento bruto do harness (F17).

### S4 · Workspaces

horizon: now · blocked_by: [S0]
contract:
  responsibility: Dá a cada alvo um lugar isolado (worktree, branch, faixa de portas e pasta temporária), prepara, roda e arquiva pelos scripts do projeto e encerra todo processo que o Metri iniciou.
  interface: `WorkspaceService` (`prepare`, `run`, `archive`) por alvo (`ticket/<id>`, `plan/<n>`, `diagnose/<n>`, Preview, fila); os scripts do projeto e a lista de arquivos ignorados que o Workspace leva (ADR-0010); a faixa de portas (`METRI_PORT`, `E2E_PORT`); o `ProcessSupervisor`, por onde passa todo processo filho.
  invariants: Nenhum Workspace usa o checkout principal do humano; uma porta pertence a um Workspace só, até ele ser arquivado; nenhum processo filho de uma partida anterior segue rodando depois da partida seguinte.
  consumers: [F3, F4, F5, F7, F8, F10, F11, F12, F14]
  planned: Banco por Workspace e várias faixas em uso para o despacho em paralelo (F13); o shell dos scripts no Windows (F25).

### S5 · Plano

horizon: now · blocked_by: [S1, S3, S6]
contract:
  responsibility: Mantém o plano do projeto (features, slices, tickets e status) e as operações de status de um ticket, com autor e motivo.
  interface: A projeção do plano, lida do git por id (ADR-0012); a frontier; as operações de ticket (cancelar, reabrir), com autor e motivo; `GET /api/projects/:id/plan` e o Board.
  invariants: Só as operações do Metri mudam o status de um ticket, com autor, e toda volta pede motivo (BR14, BR15); até a troca da S10, o plano mora no git, e o Metri só grava nele o status e o motivo, como o método manda (ADR-0012).
  consumers: [F1, F3, F4, F5, F6, F7, F8, F12, F14]
  planned: O banco como fonte do plano, depois da troca na S10; o modo Árvore (F27); o despacho em paralelo pelo `touches` (F13).

### S6 · Inbox

horizon: now · blocked_by: [S3]
contract:
  responsibility: Junta num lugar só tudo o que espera o humano e leva cada resposta ao Run que pediu.
  interface: `InboxItem` (aprovação de ferramenta, portão, pergunta ou aviso), com o alvo, o Run e o estado; resolver um item, gravando quem, quando e o quê (BR28); o contador.
  invariants: A resposta vai só para o Run que pediu (BR25); uma aprovação ou pergunta de um Run encerrado fica expirada, sem ações.
  consumers: [F1, F3, F4, F5, F8, F10, F11, F12, F14]
  planned: Som por tipo e "marcar como não lido" (F26); o aviso com a aba fechada, na casca desktop (ADR-0002).

### S7 · Verificação

horizon: now · blocked_by: [S3, S4]
contract:
  responsibility: Roda os checks de um alvo no Workspace dele e decide o Goal só pela evidência.
  interface: `Verifier.verify(alvo, checks)`, com o resultado de cada check (`passed`, `failed` ou `errored`), a cauda da saída, o log inteiro e o HEAD em que rodou; o veredito do Goal.
  invariants: O Goal só é atingido com os checks, o `metri verify` e o `metri scope` verdes no mesmo HEAD; só o verificador declara o Goal (BR8); a saída de um check é mascarada antes de ser gravada (BR103).
  consumers: [F8, F11, F12, F14]
  planned: Verificação de vários Workspaces ao mesmo tempo (F13).

### S9 · Integração

horizon: now · blocked_by: [S4, S5, S6, S7]
contract:
  responsibility: Faz um merge por vez no projeto, só com tudo verde, na branch da slice ou na branch padrão, sem tocar no trabalho do humano.
  interface: A fila de integração do projeto (`Integration`, com origem, destino, tipo e estado); entrar na fila; marcar um conflito como resolvido; retirar um item parado.
  invariants: Um merge por vez (BR21); vermelho depois de trazer o destino desfaz o merge (BR23); na branch padrão, só `--ff-only` no checkout limpo e nela, ou `update-ref` conferindo o valor antigo (BR99); o agente nunca faz merge nem push.
  consumers: [F5, F8, F12, F14]
  planned: Um Run que tenta resolver o conflito antes de chamar o humano (F13).

### S8 · Construção

horizon: now · blocked_by: [S1, S2, S3, S4, S5, S6, S7, S9]
contract:
  responsibility: Leva um ticket aberto até o Goal atingido por um Run de builder, sem depender da palavra do agente, só com o que a Policy e o humano liberam. É a slice do tracer (ADR-0001).
  interface: Despachar um ticket, que abre o Run de builder no Workspace do ticket com o Goal; devolver um ticket em andamento; as ferramentas do Metri para os agentes, por MCP com o token do Run (`get_work`, `rules_for`, `report`); a aprovação de ferramenta, com a Policy padrão.
  invariants: O builder não grava status, não faz merge e não escreve no plano (BR9); um ticket por vez em andamento no projeto (BR83); três correções no mesmo check ou o orçamento esgotado bloqueiam o ticket com o motivo `human` (BR11); nenhum ticket fica `in_progress` sem Run, portão ou fila.
  consumers: [F2, F3, F7, F12, F14]
  planned: Despacho em paralelo e orçamento por slice (F13); o modelo pela complexidade (F20); o Codex como builder (F19).

### S14 · Condução de Runs

horizon: now · blocked_by: [S8]
contract:
  responsibility: O humano conduz um Run em andamento, e um Run sobrevive a um reinício e avisa quando trava.
  interface: Mandar mensagem, interromper e cancelar um Run; a retomada na partida; o aviso de Run travado; a versão do método com que cada Run abriu.
  invariants: O aviso de Run travado não muda o estado do Run (BR18); na partida, nenhum Run fica ativo sem processo, antes de o Scheduler voltar (BR105); a retomada reenvia a Policy, os servidores MCP e o modo de permissão.
  consumers: [F3, F4, F5, F8, F9, F12, F14]
  planned: O mapa de Runs e o modo lado a lado (F13).

### S15 · Configuração e despacho

horizon: now · blocked_by: [S14]
contract:
  responsibility: Guarda o que só o humano ajusta no projeto (allowlist, rede, orçamentos e o modelo de cada papel) e despacha sozinho os tickets que não pedem o humano.
  interface: A configuração do projeto (Policy e modelos), com o valor padrão de cada campo; o despacho automático, que o humano liga e pausa.
  invariants: Só o humano muda a configuração (BR85); uma mudança vale só para os Runs abertos depois dela (BR87); o despacho automático só pega o que a BR82 permite.
  consumers: [F2, F8, F9]
  planned: O modelo pela complexidade (F20); o despacho em paralelo (F13).

### S16 · Portões e perguntas

horizon: now · blocked_by: [S14, S15]
contract:
  responsibility: Leva ao humano cada portão e cada pergunta com o que ele precisa para decidir, devolve a resposta ao Run e o avisa de tudo o que espera por ele.
  interface: O portão, com os três blocos e a resolução (aprovar, pedir ajuste, recusar); responder a pergunta de um agente; o portão de padrão e o de passo humano; a notificação do sistema por tipo de item.
  invariants: Todo portão mostra os três blocos (BR27); toda resolução grava quem, quando e o quê (BR28); aprovação de ferramenta sempre notifica (BR29).
  consumers: [F3, F4, F5, F8, F12, F14]
  planned: Som por tipo e "marcar como não lido" (F26).

### S17 · Preview

horizon: now · blocked_by: [S16]
contract:
  responsibility: Mostra o app rodando, de um Workspace, da slice em aceite ou da branch padrão, sem tocar no checkout do humano.
  interface: Abrir o Preview de um Workspace ou da branch padrão, em desktop e em mobile, com o motivo quando não sobe.
  invariants: O Preview roda só em `127.0.0.1`, na porta de Preview do Workspace (BR19); nunca usa o checkout principal do humano (BR20).
  consumers: [F1, F12]
  planned: Vários Previews ao mesmo tempo, com o despacho em paralelo (F13).

### S18 · Matriz e Visão geral

horizon: now · blocked_by: [S16, S17]
contract:
  responsibility: Mostra o plano como um quadro de features e slices em ordem de build e o próximo passo do projeto.
  interface: A Matriz, com a posição pela BR37 e pela BR39 e o painel da slice; a Visão geral, com o próximo passo da BR78.
  invariants: A posição de cada slice é regra do plano, e nada se arrasta (BR39); a barra de entrega não conta cancelados nem tickets em andamento (BR38).
  consumers: [F1, F5, F6]
  planned: O modo Árvore (F27); o mapa de Runs (F13).

### S10 · Iniciativas

horizon: now · blocked_by: [S16, S18]
contract:
  responsibility: Conduz uma iniciativa do pedido ao plano aprovado, com o Moldar e o Look across em Runs no `plan/<n>`, o crítico e os portões de direção e de plano.
  interface: Abrir o Run de Moldar e o de Look across no Workspace `plan/<n>`; a ferramenta `propose` (UC, ticket, plano, lacuna, padrão e check de reprodução) e `add_note`; os portões de direção e de plano; as mudanças pendentes (BR49).
  invariants: Uma mudança no que foi aprovado só vale depois de um novo portão de plano (BR49); o crítico roda antes de todo portão de direção e de plano (BR48); depois da troca, o banco é a fonte do plano, e os arquivos são exportação, nunca lidos de volta.
  consumers: [F3, F6, F8, F9, F12, F14]
  planned: Começar o método num repositório com código, pelo mapeamento (F21).

### S12 · Aceite

horizon: now · blocked_by: [S10, S17]
contract:
  responsibility: Revisa uma slice pronta por eixos independentes e só a leva à branch padrão com o aceite do humano, gravando só o conhecimento que ele aprovou.
  interface: Abrir o aceite da slice (uma rodada de checks e os revisores em paralelo); o portão de aceite, com achados e propostas de conhecimento; a decisão de cada achado e de cada proposta; os passos do método antes do merge.
  invariants: Cada revisor recebe só as entradas do seu eixo (BR31); um eixo não coberto nunca conta como limpo (BR33); só o texto exato aprovado entra no git (BR35); o merge só depois do portão aprovado (BR34).
  consumers: [F3, F6, F11, F14]
  planned: Ver o conhecimento aprovado numa tela (F22); as métricas do aceite (F15).

### S13 · Diagnóstico

horizon: now · blocked_by: [S12]
contract:
  responsibility: Corrige um bug só depois que um check que o reproduz fica vermelho, gravado pelo verificador.
  interface: Abrir o Run de diagnóstico; o check de reprodução com a expectativa vermelha; o ticket de correção na slice da capacidade afetada.
  invariants: Sem o vermelho registrado antes da correção, o verificador recusa o resultado (BR52); o ticket de correção não muda feature, UC nem contrato aprovados (BR53).
  consumers: [F3]
  planned: A correção urgente direto na branch padrão, com o release (F24).

### S11 · Pedidos

horizon: now · blocked_by: [S13]
contract:
  responsibility: Recebe os pedidos do humano numa conversa contínua com o Coordinator e leva cada um à rota do método.
  interface: A conversa do projeto, um Run de Coordinator contínuo; o `WorkRequest`, com a rota proposta, a conferência do Metri e o destino.
  invariants: A rota direta só vale com as condições da BR41; o orçamento do Coordinator conta por pedido (BR42); o Coordinator não aprova ferramenta, não resolve portão e não escreve código (BR44).
  consumers: [F1, F10]
  planned: O Coordinator respondendo builders e despachando em paralelo (F13).

## Fog

- Um recurso de nuvem que leve conteúdo do projeto ao plano de controle, quando a regra do Escopo se rever.

## Gaps

## Pattern proposals
