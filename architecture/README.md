# Arquitetura

Dono de: a autoridade e a precedência da Architecture Source; a navegação, com a ordem de leitura e o índice do documento dono de cada assunto; o resumo das decisões transversais, cada uma definida no owner indicado.

Consultar antes de: localizar o documento dono de um assunto antes de criar módulo, endpoint, evento, job ou integração nova; resolver divergência entre a Source, o código e uma instrução de projeto.

A Architecture Source: a arquitetura do sistema, em documentos por área — o que cada área deve ser, as fronteiras entre camadas e as regras que valem para qualquer módulo ou aplicação do monorepo.

Estes documentos são a referência de construção do projeto. Lidos em ordem, ensinam a base inteira; consultados por área, respondem "como se faz isso aqui". Caso real que não se encaixa em nenhuma regra escrita segue a regra de escape de `authoring.md`.

## Como ler

Quem está chegando lê nesta ordem; cada bloco só depende dos anteriores.

1. **O sistema.** `overview.md` (o monorepo, as camadas, o caminho de uma request) e `backend/boundaries.md` (quem pode importar o quê). Os dois juntos dão o mapa.
2. **O módulo.** `backend/modules.md` (o que é um módulo e como módulos se comunicam), depois as peças dele: `domain/model.md` (entidade, value object, agregado), `backend/application.md` (contrato e caso de uso), `backend/persistence.md` (repositório e mapper) e `backend/http-api.md` (a porta HTTP). Depois `backend/errors.md` (erro esperado é valor de retorno), `backend/reading.md` (leitura de domínio vs. leitura de exibição) e `backend/access-scope.md` (o escopo do dono).
3. **Os padrões de domínio.** Sob demanda, quando o caso aparece: `backend/operation-routing.md` (qual mecanismo executa a operação), `backend/events.md`, `backend/transactions.md`, `domain/watched-list.md`, `domain/strategy.md`, `domain/specification.md`, `domain/domain-services.md` (regra de domínio sem dono natural), `domain/builder.md` e, quando o domínio pede mais de um modelo, `domain/bounded-contexts.md`.
4. **A infraestrutura.** `infrastructure/runtime.md` (bootstrap, providers globais, env), `infrastructure/services.md` (a regra dos níveis para serviço compartilhado), e as capacidades: `infrastructure/logging.md`, `infrastructure/observability.md` (métrica, alerta e reconciliação), `infrastructure/mail.md`, `infrastructure/storage.md`, `infrastructure/cache.md`, `backend/async-jobs.md`.
5. **O teste.** `backend/testing.md` fecha o backend.
6. **O frontend.** `frontend/structure.md` primeiro, depois `frontend/routing.md` e `frontend/components.md`; o resto (`frontend/forms.md`, `frontend/design-system.md`, `frontend/state.md`, `frontend/data-fetching.md`, `frontend/helpers.md`, `frontend/testing.md`) sob demanda.

## O que mora aqui, o que mora em outro lugar

- Aqui: a referência completa de arquitetura. O quê, o porquê, os limites e os padrões de construção de cada área, com exemplos de código.
- Instruções de projeto de cada pacote: o que `authoring.md`, "Decisões específicas de projeto", admite nelas, mais uma referência para o `docs/architecture/` certo.

Em divergência entre um documento daqui e o código, o documento vale: o desenho evolui primeiro no documento, o código segue. Instrução de projeto que contradiz um documento daqui sem ADR que a sustente é bug de documentação, corrigido na instrução de projeto.

## Autoria

Como a Source é escrita e mantida — owner de cada decisão, anatomia de documento, modalidades normativas, exemplos, verificação, pontos em aberto, regras de transição e de escape, organização física e casa das decisões específicas de projeto — está em `authoring.md`. Ler antes de criar ou editar qualquer documento daqui.

## Ativação

O que a ativação da arquitetura num projeto pergunta, quando pergunta e onde a resposta fica — as classes de decisão e a matriz das decisões delegadas ao projeto — está em `activation.md`.

## Decisões transversais

Resumo das decisões que valem em todo documento e em todo app; cada uma é definida no owner indicado. Um exemplo que contradiz uma delas é bug de documentação, não estilo alternativo.

| Tema | Decisão |
| --- | --- |
| Organização de pastas | Definida em `overview.md`, "As camadas do backend (layer-first)" |
| Contrato injetável | Definida em `backend/application.md`, "Contratos são `abstract class`" |
| Erro esperado | Definida em `backend/errors.md`, "Retornando erro: sempre `Either`, nunca `throw`" |
| Domain events | Definida em `backend/events.md`, "A entidade registra, o repositório despacha" |
| Controller | Definida em `backend/http-api.md`, "Controller por ação" |
| Servidor HTTP | Definida em `overview.md`, "Stack" |
| Env | Definida em `infrastructure/runtime.md`, "Env e montagem de client" |
| Transação | Definida em `backend/transactions.md`, "Contrato de transação" |
| Id | Definida em `domain/model.md`, "Entidade: criação e reconstituição são caminhos separados" |
| Idioma | Definida em `overview.md`, "Stack" |
| Default silencioso | Definida em `overview.md`, "Princípios não negociáveis" |

## Índice

Agrupado pela pasta da área dona de cada documento (`authoring.md`, "Organização física").

### Raiz

| Documento | Cobre |
| --- | --- |
| `authoring.md` | Como a Source é escrita e mantida: ownership de decisão, anatomia, modalidades, exemplos, ferramentas, verificação, pontos em aberto, transição, escape, organização física e decisões de projeto |
| `overview.md` | O sistema numa página: monorepo e colocação app × pacote, camadas, topologia HTTP e o caminho de uma request |
| `activation.md` | Ativação num projeto: classes de decisão, perguntas condicionais, ordem, registro e matriz de delegações |

### Domínio (`domain/`)

| Documento | Cobre |
| --- | --- |
| `domain/model.md` | Entidade, value object, agregado, propriedade do agregado, referência por identidade, atualização parcial |
| `domain/domain-services.md` | Domain service e policy: regra de domínio sem dono natural, sem IO, forma mínima, relação com o caso de uso |
| `domain/watched-list.md` | Coleção filha com delta rastreado: WatchedList, substituição completa, coleção de vínculo, arquivo físico |
| `domain/strategy.md` | Variação de comportamento selecionada por dado: família pura de domínio, variação de integração, Template Method |
| `domain/specification.md` | Regra booleana com mais de um consumidor: `isSatisfiedBy()` em memória, `toWhere()` na query |
| `domain/builder.md` | Construção passo a passo: onde cada caso já tem casa, gatilhos raros do padrão |
| `domain/bounded-contexts.md` | Bounded context: contexto único como padrão, sinais de divisão, relação com módulo, interação entre contextos |

### Backend (`backend/`)

| Documento | Cobre |
| --- | --- |
| `backend/boundaries.md` | Grafo de dependência permitido entre camadas e pacotes, exceções, comandos de verificação |
| `backend/modules.md` | Módulo: conceito, quando criar, granularidade, composição nas camadas, fronteira e comunicação entre módulos |
| `backend/application.md` | Contrato injetável como `abstract class`, caso de uso, adaptador de entrada fino |
| `backend/persistence.md` | Repositório, mapper, escrita do agregado, leitura em lote, schema, SQL cru, outcome de persistência |
| `backend/reading.md` | Leitura: caminho de domínio vs. query de exibição, paginação, não-encontrado, agregação |
| `backend/http-api.md` | Porta HTTP: controller por ação, DTO, validação na fronteira, presenter, contrato compartilhado com o frontend |
| `backend/errors.md` | Modelagem, retorno e tradução de erro de domínio |
| `backend/access-scope.md` | Contrato genérico de escopo do dono: origem validada, propagação, leitura, escrita, storage, prova A/B |
| `backend/operation-routing.md` | Escolha do mecanismo: escrita do agregado, chamada direta, service dedicado, transação, evento, job, cron, compensação |
| `backend/events.md` | Domain events: emissão, subscribers, falhas |
| `backend/transactions.md` | Atomicidade entre agregados, locking, escrita de sistema externo |
| `backend/async-jobs.md` | Workers, filas, crons, idempotência |
| `backend/testing.md` | A pirâmide de teste do backend: specs, e2e por controller, factories, dublês |

### Infraestrutura (`infrastructure/`)

| Documento | Cobre |
| --- | --- |
| `infrastructure/runtime.md` | Montagem do app: bootstrap, providers globais, env e client, shutdown gracioso, fronteiras de request, paridade com o e2e |
| `infrastructure/services.md` | A regra dos níveis para serviço de infra compartilhado |
| `infrastructure/logging.md` | Log estruturado: bootstrap, contexto progressivo de request, redação, uso em provider |
| `infrastructure/observability.md` | Métrica, alerta e reconciliação: quatro sinais, cardinalidade, alerta acionável, reconciliação a partir da fonte de verdade |
| `infrastructure/mail.md` | E-mail: sender por fluxo sobre o client do vendor |
| `infrastructure/storage.md` | Storage de objetos: chave canônica, o critério de tamanho e volume, passthrough pelo backend e upload direto com registro pendente |
| `infrastructure/cache.md` | Cache do backend: sem cache por padrão, semântica no fluxo dono, chave com escopo, invalidação, falha que degrada para a fonte |

### Frontend (`frontend/`)

Os documentos de frontend descrevem `apps/app-web`, com a stack de `overview.md`, "Stack", e seguem o mesmo domínio didático de pedidos dos de backend.

| Documento | Cobre |
| --- | --- |
| `frontend/structure.md` | Estrutura de pastas (casas por função), nomeação de arquivo, pasta do dono, fronteira de casa |
| `frontend/routing.md` | Grupo de rota e guard, rota × modal de tarefa, página lazy com `Suspense`, segmento de rota |
| `frontend/components.md` | Construção de página e componente: ordem do corpo e condicionais, corpo do modal, um arquivo por componente, composição, estados de leitura |
| `frontend/forms.md` | Formulário: onde mora, React Hook Form, `defaultValues`, schema de form × API, campo montado, rótulo e nome acessível |
| `frontend/design-system.md` | Consumo do design system: tokens, tema, vocabulário visual das telas |
| `frontend/state.md` | Divisão servidor/cliente, árvore de decisão, URL state, Context, Zustand, troca de dono |
| `frontend/data-fetching.md` | Cliente HTTP same-origin, funções de `api/`, hooks de React Query, cache, erros, provider e defaults |
| `frontend/helpers.md` | Hierarquia de código auxiliar, rules de UI, constantes, tipos compartilhados, Zod vs. type plain |
| `frontend/testing.md` | Pirâmide de níveis, MSW na fronteira do fetch, builders |
