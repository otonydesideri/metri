# Contexto: Metri

## Termos

### Projeto e pedido

**Humano** · `Human`
A pessoa que usa o Metri: faz os pedidos e decide nos portões.
_Evitar:_ Usuário (sozinho), User, Operador

**Projeto** · `Project`
Um repositório git local que o Metri conduz pelo método.
_Evitar:_ Repo, Repositório (como entidade), Repository

**Pedido** · `WorkRequest`
O que o humano pede ao Metri, antes de virar trabalho.
_Evitar:_ Request, Tarefa, Task

**Etapa** · `Stage`
Uma das fases do método que o Metri conduz: rotear, moldar, look across, construir, verificar, aceitar, integrar, release, aprender e diagnosticar.
_Evitar:_ Fase, Phase, Step

**Goal** · `Goal`
O contrato de conclusão de um ticket, escrito junto com o ticket (no Look across, na rota direta ou no diagnóstico): o que entrega, como se verifica, o que não pode regredir, quando parar e o orçamento.
_Evitar:_ Objetivo, Meta

**Proposta** · `Proposal`
Uma mudança que um agente pede ao Metri, com o texto exato: um ticket, o plano, uma lacuna, um padrão ou conhecimento. O Metri a valida antes de gravar.
_Evitar:_ Sugestão, Suggestion

**Proposta de conhecimento** · `KnowledgeProposal`
Uma Proposta do tipo conhecimento: o texto exato do que o projeto aprendeu e o destino dele (check, regra, ADR, linguagem do domínio ou design).
_Evitar:_ Lição, Lesson

**Rota** · `Route`
O caminho que um pedido segue: direta (vira um ticket numa slice que já existe), bug (abre um Run de diagnóstico) ou iniciativa (abre um Run de moldar).
_Evitar:_ Fluxo, Caminho (sozinho)

### Execução

**Run** · `Run`
Uma execução de um agente sobre um alvo, com uma sessão própria no harness.
_Evitar:_ Job, Tarefa, Task

**Papel** · `AgentRole`
A função que um agente cumpre num Run, como coordinator, builder ou revisor de contrato.
_Evitar:_ Persona, Role (sozinho)

**Coordinator** · `Coordinator`
O papel que conversa com o humano sobre o projeto e julga: propõe a rota de cada pedido e responde sobre o andamento. Não decide o que roda.
_Evitar:_ Coordenador (como quem despacha), Orquestrador

**Subagente** · `Subagent`
Um agente que o harness dispara por conta própria dentro de um Run. Pertence a esse Run.
_Evitar:_ Run filho, Sub-run

**Harness** · `Harness`
Um agente de código de terceiros que o Metri conduz, como Claude Code ou Codex.
_Evitar:_ Provedor, Provider, Agente (sozinho)

**Sessão do harness** · `HarnessSession`
A conversa de um Run dentro do harness, que o harness identifica pelo próprio id nativo.
_Evitar:_ Sessão (sozinha), Chat, AgentSession

**Definição de agente** · `AgentDefinition`
Um papel escrito sem fornecedor: instruções, skills, Policy e formato de saída, com versão.
_Evitar:_ Prompt

**Workspace** · `Workspace`
O lugar isolado onde o Metri faz um trabalho: uma worktree com a sua branch, as suas portas e uma pasta temporária. Quase sempre pertence a um Run; o Preview da branch padrão usa um Workspace sem Run.
_Evitar:_ Sandbox, Ambiente

**Preview** · `Preview`
O app rodando a partir de um Workspace, na porta dele e só em `127.0.0.1`, para o humano ver.
_Evitar:_ Demo, Ambiente de teste

**Policy** · `Policy`
O que um Run pode fazer sem pedir ao humano: onde escreve, que rede acessa, o que exige aprovação e o orçamento padrão.
_Evitar:_ Sandbox, Permissões, Permissions

**Aprovação de ferramenta** · `ToolApproval`
Pedido de um harness, durante um Run, para usar uma ferramenta fora da Policy.
_Evitar:_ Permissão, Permission

**Scheduler** · `Scheduler`
A parte do Metri que decide, por regras exatas, quais tickets podem rodar agora.
_Evitar:_ Despachante, Dispatcher

**Despacho automático** · `AutoDispatch`
O modo em que o Scheduler despacha sozinho os tickets que não pedem o humano. O humano o pausa e o retoma.
_Evitar:_ Piloto automático, Autopilot

**Verificador** · `Verifier`
A parte do Metri que roda os checks de um ticket e decide, só pela evidência, se o Goal foi atingido.
_Evitar:_ Validador, Juiz

**Achado** · `Finding`
O que um revisor aponta no aceite de uma slice, com a evidência citada, a confiança e a classe, ou o que o crítico aponta antes de um portão de direção ou de plano.
_Evitar:_ Issue, Problema (sozinho)

**Orçamento** · `Budget`
O limite de tokens, custo e tempo de um Run, de um pedido ou de uma slice. O padrão vem da Policy.
_Evitar:_ Cota, Limite (sozinho)

**Evento** · `ProjectEvent`
Um fato imutável, com tipo, gravado no registro de um projeto. Pode estar ligado a um Run.
_Evitar:_ Event, Log

**Integração** · `Integration`
Uma entrada na fila de merge do projeto: uma branch que espera para entrar no seu destino.
_Evitar:_ Deploy, Merge (como entidade)

**Inbox** · `Inbox`
A vista de tudo o que espera o humano.
_Evitar:_ Notificações, Notifications

### Conta

**Plano de controle** · `ControlPlane`
A parte do Metri na nuvem: organização, membros e licença, sem conteúdo do projeto.
_Evitar:_ Backend, Servidor, Nuvem (sozinho)

**Organização** · `Organization`
O cliente no plano de controle, com membros, licença e padrões para projetos novos.
_Evitar:_ Conta, Time, Team, Workspace

**Membro** · `Member`
Uma pessoa numa organização. Ocupa um assento.
_Evitar:_ Usuário, User

**Papel na organização** · `MemberRole`
O que um membro pode fazer na organização: `owner`, `admin` ou `member`.
_Evitar:_ Cargo, Papel (sozinho)

**Sessão de login** · `AuthSession`
O login de uma pessoa no plano de controle.
_Evitar:_ Sessão (sozinha)

**Licença** · `License`
Plano, assentos, validade e carência de uma organização.
_Evitar:_ Assinatura

**Instância** · `Instance`
Uma instalação do Metri numa máquina, ligada a um membro.
_Evitar:_ Dispositivo, Device, Máquina

## Relações

Os termos do método (feature, slice, ticket, caso de uso, regra de negócio, contrato, horizonte, lacuna, proposta de padrão, portão, fronteira (`frontier`), névoa (`fog`), tracer, donos da slice (`sot`)) vêm do vocabulário do método e não se repetem aqui.

Um `Project` tem as features, as slices e os tickets do método, os `Run` que trabalham neles e os `ProjectEvent` do seu registro. Um `WorkRequest` segue uma `Route`: vira um ticket, um Run de diagnóstico ou um Run de moldar.

Um `Run` cumpre um `AgentRole`, usa um `Harness` numa `HarnessSession`, trabalha num `Workspace`, segue uma `AgentDefinition` e a `Policy` do projeto, e pode abrir `ToolApproval`. Um `Subagent` pertence a um `Run`. O `Scheduler` só libera um ticket para um `Run` quando as regras deixam. Uma `Proposal` do tipo `pattern` dá origem a uma proposta de padrão, e uma do tipo conhecimento é uma `KnowledgeProposal`. O `Verifier` decide o Goal de cada ticket, e os revisores do aceite produzem `Finding`.

Um `Human` faz o `WorkRequest` e resolve os portões. No plano de controle, o `Human` é um `Member`. Uma `Organization` tem uma `License` e `Member`. Cada `Member` tem um `MemberRole`, as suas `AuthSession` e as suas `Instance`.

## Ambiguidades resolvidas

"Plano de controle" é só a nuvem; o que conduz o trabalho roda na máquina de quem usa.

No Board, "Aberto" é o rótulo do status `open`. Só um ticket `open` com as dependências feitas está na fronteira e pode ser despachado.

"Decisão" não é termo do domínio. O ponto em que o humano decide é o portão (`gate`), termo do método, e o que ele escolhe ali é a resolução do portão. "Decisão" fica com o ADR (`kind: decision`) e com as Decisões de implementação e de teste da spec.

"Papel" sozinho é a função de um agente. O da pessoa é sempre "papel na organização".

"Sessão" sozinha não se usa: ou é a sessão do harness, ou a sessão de login. O segredo que a interface local usa para falar com o servidor é um token, não uma sessão.

"Workspace" é o lugar onde um Run trabalha. No monorepo, o que o pnpm chama de workspace é um pacote, e a conta do cliente é a organização.

"Licença" é a da organização. A licença do código do pacote do método não é termo do domínio.

O Coordinator julga e conversa; quem decide o que roda é o Scheduler, e quem faz o merge é a fila de integração. No método usado à mão, o coordenador também despacha e faz merge.

"Sandbox" é só o isolamento que o sistema operacional dá ao processo do harness, como o do Claude Code ou o do Codex. O que um Run pode fazer é a Policy, e o lugar onde ele trabalha é o Workspace.

"Assinatura" sozinha não se usa. No harness, a pessoa paga pelo plano da própria conta (conta Claude ou ChatGPT) ou pela chave de API; no Metri, o que se paga é a licença.

Subagente e Run são coisas diferentes: o Run é aberto pelo Metri, com sessão, Workspace, orçamento e Goal; o subagente é aberto pelo harness, dentro de um Run.

`task`, tipo de ticket T, é trabalho que não entrega um caso de uso mas destrava outros. Não é a "task" dos harnesses, que é um subagente ou um processo em segundo plano dentro de uma sessão.
