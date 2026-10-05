# Arquitetura

A Architecture Source: a arquitetura do sistema, em documentos por área — o que cada área deve ser, as fronteiras entre camadas e as regras que valem para qualquer módulo ou aplicação do monorepo.

Caso real que não se encaixa em nenhuma regra escrita segue a regra de escape do `AGENTS.md`.

## Visão geral

O sistema numa página: o que existe no monorepo (`general/code-placement.md`), as camadas do backend (`backend/layers.md`) e o caminho que uma request percorre (`backend/layers.md`, "O caminho de uma request").

O como construir cada artefato vive no documento correspondente (`backend/layers.md`, "Onde cada arquivo mora"); o que não é decisão da Source segue `skills/writing-for-agents/RULE-FORMAT.md`, "Decisões específicas de projeto". Fronteiras de import vivem em `backend/boundaries.md`; estrutura de módulo e comunicação entre módulos, em `backend/modules.md`.

### Observabilidade

O log, com métrica, alerta e reconciliação quando uma pergunta operacional pede, tem desenho em `infrastructure/logging.md`, e a captura de erro inesperado (filtro global, corpo padronizado), em `backend/errors.md`; ferramenta e valores concretos são decisão de projeto (`.metri/ARCHITECTURE.md`).

### Testes

O desenho transversal de testes (pirâmide, factories, repositórios em memória, e2e) está em `backend/testing.md`, para o backend, e em `frontend/testing.md`, para o frontend.

## Como ler

Quem está chegando lê nesta ordem; cada bloco só depende dos anteriores.

1. **O sistema.** `architecture/INDEX.md`, "Visão geral" (o mapa), `general/code-placement.md` (o monorepo), `backend/layers.md` (as camadas), o caminho de uma request (`backend/layers.md`, "O caminho de uma request"), `backend/boundaries.md` (quem pode importar o quê), `general/principles.md` (os princípios não negociáveis), `general/http-surface.md` (a superfície HTTP same-origin), `general/date-time.md` (instante e momento de parede) e `defaults/stack.md` (a stack padrão).
2. **O módulo.** `backend/modules.md` (o que é um módulo e como módulos se comunicam), depois as peças dele: `domain/model.md` (entidade, value object, agregado), `backend/application.md` (contrato e caso de uso), `backend/persistence.md` (repositório e mapper) e `backend/http-api.md` (a porta HTTP). Depois `backend/errors.md` (erro esperado é valor de retorno), e `backend/reading.md` (leitura de domínio vs. leitura de exibição).
3. **Os padrões de domínio.** Sob demanda, quando o caso aparece: `backend/operation-routing.md` (qual mecanismo executa a operação), `backend/events.md`, `backend/transactions.md`, `domain/watched-list.md` (coleção filha gravada pelo delta), `domain/domain-services.md` (regra de domínio sem dono natural) e, quando o domínio pede mais de um modelo, `domain/bounded-contexts.md`.
4. **A infraestrutura.** `infrastructure/runtime.md` (bootstrap, providers globais, env), `infrastructure/services.md` (a regra dos níveis para serviço compartilhado), e as capacidades: `infrastructure/logging.md` (log, métrica, alerta e reconciliação), `infrastructure/storage.md`, `infrastructure/cache.md`, `backend/async-jobs.md`.
5. **O teste.** `backend/testing.md` fecha o backend.
6. **O frontend.** `frontend/structure.md` primeiro, depois `frontend/routing.md`, `frontend/components.md` e `frontend/experience.md` (a experiência de uma tela); o resto (`frontend/forms.md`, `frontend/state.md`, `frontend/data-fetching.md`, `frontend/helpers.md`, `frontend/theming.md`, `defaults/ui.md` (o kit de UI), `frontend/testing.md`) sob demanda.

## O que mora aqui, o que mora em outro lugar

- Aqui: a referência completa de arquitetura.
- Instruções de projeto de cada pacote: o que `skills/writing-for-agents/RULE-FORMAT.md`, "Decisões específicas de projeto", admite nelas, mais uma referência para o `.metri/rules/` certo.
- Precedência: ADR > regra do projeto > regra global > default global.

Em divergência entre um documento daqui e o código, o documento vale: o desenho evolui primeiro no documento, o código segue. Instrução de projeto que contradiz um documento daqui sem ADR que a sustente é bug de documentação, corrigido na instrução de projeto.

## Autoria

Como a Source é escrita e mantida está em `skills/writing-for-agents/RULE-FORMAT.md`. Ler antes de criar ou editar qualquer documento daqui.

## Ativação

A pergunta de ativação de cada capacidade condicional é a chave `activation` da regra dona, listada em "Capacidades condicionais", abaixo; a resposta do projeto fica no `.metri/ARCHITECTURE.md`, "Capacidades ativas".

## Decisões transversais

Resumo das decisões que valem em todo documento e em todo app; cada uma é definida no owner indicado. Um exemplo que contradiz uma delas é bug de documentação.

| Tema | Decisão |
| --- | --- |
| Organização de pastas | Definida em `backend/layers.md`, "As camadas do backend (layer-first)" |
| Contrato injetável | Definida em `backend/application.md`, "Contratos são `abstract class`" |
| Erro esperado | Definida em `backend/errors.md`, "Retornando erro: sempre `Either`, nunca `throw`" |
| Domain events | Definida em `backend/events.md`, "A entidade registra, o repositório despacha" |
| Controller | Definida em `backend/http-api.md`, "Controller por ação" |
| Servidor HTTP | Definida em `defaults/stack.md`, "Stack" |
| Env | Definida em `infrastructure/runtime.md`, "Env e montagem de client" |
| Transação | Definida em `backend/transactions.md`, "Unidade de trabalho" |
| Id | Definida em `domain/model.md`, "Entidade: criação e reconstituição são caminhos separados" |
| Idioma | Definida em `defaults/stack.md`, "Stack" |
| Default silencioso | Definida em `general/principles.md`, "Princípios não negociáveis" |

## Índice

Agrupado pela pasta da área dona de cada documento (`skills/writing-for-agents/RULE-FORMAT.md`, "Organização física").

Os documentos de frontend descrevem `apps/app-web`, com a stack de `defaults/stack.md`, "Stack", e seguem o mesmo domínio didático de pedidos dos de backend.

<!-- rules-index -->

- `backend` → `backend/INDEX.md` (13 regras)
- `defaults` → `defaults/INDEX.md` (2 regras)
- `domain` → `domain/INDEX.md` (4 regras)
- `frontend` → `frontend/INDEX.md` (10 regras)
- `general` → `general/INDEX.md` (4 regras)
- `infrastructure` → `infrastructure/INDEX.md` (5 regras)

## Capacidades condicionais

| id | activation |
| --- | --- |
| backend/async-jobs | `backend/operation-routing.md` leva alguma operação do projeto a job ou tarefa agendada? |
| defaults/ui | O projeto tem interface? O estilo visual (docs/DESIGN.md) é decidido no /shape. |
| domain/bounded-contexts | O domínio dos UCs mostra um dos sinais de `domain/bounded-contexts.md` para mais de um modelo, como o mesmo termo com dois significados? |
| domain/domain-services | Alguma BR dos UCs é regra de domínio sem dono natural num value object, numa entidade ou num agregado? |
| domain/watched-list | Algum agregado grava uma coleção filha pelo delta (o que entrou e o que saiu), em vez de regravá-la inteira? |
| infrastructure/cache | O projeto tem necessidade medida de cache, pelo critério de `infrastructure/cache.md`? |
| infrastructure/storage | O projeto guarda arquivos ou assets? |
