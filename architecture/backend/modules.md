---
id: backend/modules
description: "o que é um módulo, quando criar um, a granularidade, do que ele é feito e como se organiza nas camadas, a fronteira entre módulos e a comunicação entre eles."
use_when:
  - "criar um módulo ou decidir se um conceito merece um"
  - "expor comportamento novo de um módulo existente"
  - "fazer um módulo usar outro"
keywords: [módulo, granularidade, agregado principal, agregado satélite, módulo de tela, layer-first, comunicação entre módulos, http.module.ts, persistence.module.ts, bounded context, checklist de módulo novo]
not_covered:
  - "entidade, value object, agregado e propriedade do agregado → domain/model"
  - "contrato e caso de uso → backend/application"
  - "repositório, mapper e schema → backend/persistence"
  - "a porta HTTP → backend/http-api"
  - "o mecanismo de reação ou de atomicidade entre módulos → backend/operation-routing"
  - "o bounded context e a interação entre contextos → domain/bounded-contexts"
  - "a divisão real de módulos de cada app, que é decisão de projeto (\"Delegações\") → project:ARCHITECTURE"
status: active
---
# Módulos

Os exemplos de código usam o domínio didático de pedidos (`order`, `invoice`) de `skills/writing-for-agents/RULE-FORMAT.md`, "Domínio didático". Divisão de módulos e forma de cada agregado são decisão por app, registradas como decisão de projeto do app, nunca aqui (`skills/writing-for-agents/RULE-FORMAT.md`, "Decisões específicas de projeto").

## A pergunta que precede tudo: isso merece ser um módulo?

Antes de criar o primeiro arquivo de um módulo novo, três perguntas:

1. Existe um conceito de negócio claro e nomeável que esse módulo representa?
2. Esse conceito tem regras próprias, estado próprio ou operações próprias?
3. O conceito sobreviveria a uma reestruturação técnica do sistema?

Se qualquer resposta é "não", o que está prestes a nascer provavelmente é outra coisa:

- Conjunto de helpers puros e agnósticos de domínio pode ir para `packages/utils`, pela colocação de `general/code-placement.md`.
- Constante ou infraestrutura transversal do app vai para `infra/common/`.
- Wrapper de client externo vai para `infra/services/<capacidade>/` (`infrastructure/services.md`).
- Subdivisão técnica de um módulo existente fica dentro do módulo dono.

A granularidade segue o domínio: um módulo gira em torno de um agregado principal e dos agregados satélites que só existem por causa dele, e conceito com ciclo de vida próprio é módulo próprio (`order` e `invoice` são dois módulos nos exemplos deste documento: a fatura nasce e fecha por regras próprias). Dois módulos existem sem agregado próprio: o módulo de tela, cujo conceito é a tela que não pertence a nenhum agregado (`backend/reading.md`, "Agregação: dashboard e relatório"), e o módulo que existe só por causa de uma capacidade externa (`infrastructure/services.md`).

## Do que um módulo é feito

Um módulo é o mesmo nome repetido nas camadas que ele usa:

- Entidades, value objects e classes de erro dos agregados dele, casos de uso em `use-cases/<módulo>/`, contratos dos repositórios.
- Uma porta de entrada por ação: controller + DTO (`backend/http-api.md`).
- Factories, repositórios em memória e e2e-specs correspondentes.

A estrutura é layer-first (`backend/layers.md`): módulo nunca é pasta com camadas dentro. Ele aparece como subpasta nas camadas que acumulam vários arquivos por módulo (`use-cases/<módulo>/`, `controllers/<módulo>/`, `dtos/<módulo>/`); as camadas com um arquivo por agregado ficam planas (`application/repositories/`, `persistence/prisma/repositories/`). `enterprise/` agrupa por tipo de artefato, nunca por módulo. O caminho e o nome de cada artefato estão na tabela "Onde cada arquivo mora" do `backend/layers.md`.

Módulo de negócio não ganha módulo Nest próprio. Controller e caso de uso entram nas listas de `http.module.ts`, agrupados por um comentário de área (`// <Módulo>`); repositório concreto entra em `persistence.module.ts`. Área nova é um comentário novo nessas listas, nunca um `@Module` em `http/modules/`.

Teste mora ao lado do que ele prova: spec unitário junto do arquivo testado, e2e junto do controller. Factories e dublês compartilhados moram em `test/` (caminhos em `backend/testing.md`, "A pirâmide").

## Comunicação entre módulos

- Contrato é do app: qualquer caso de uso injeta qualquer contrato, inclusive de agregado de outro módulo do mesmo bounded context, pelo mecanismo de `backend/application.md`, "Contratos são `abstract class`". Não existe mecanismo de integração além disso; ver "Delegado ao projeto".
- Entre bounded contexts diferentes valem as proibições de `domain/bounded-contexts.md`, "Interação entre contextos".
- A fronteira que protege o sistema é a de camada (`backend/boundaries.md`), não a de módulo.
- Leitura de N registros de outro módulo é em lote, com `Map` no consumo (`backend/persistence.md`, "Leitura em lote").
- Reação a algo que outro módulo fez e operação atômica entre agregados de módulos diferentes escolhem o mecanismo pela árvore de `backend/operation-routing.md`.

## A porta de um módulo

Todo comportamento exposto por um módulo entra por uma porta: a HTTP, um controller por ação, segue `backend/http-api.md`; qualquer outra (o router de uma biblioteca, uma fila, um webhook) é adaptador fino de `backend/application.md`.

## Checklist de módulo novo

1. Regra de negócio fechada antes do primeiro arquivo; comportamento sem regra decidida não se implementa.
2. Propriedade de cada agregado decidida antes de qualquer contrato e registrada como decisão de projeto (`domain/model.md`).
3. Entidades e value objects conforme `domain/model.md`.
4. Contratos e casos de uso conforme `backend/application.md`, com spec unitário colocado, factory e repositório em memória (`backend/testing.md`).
5. Repositório, mapper e model no `models/<módulo>.prisma` do módulo dono, conforme `backend/persistence.md`.
6. Porta de entrada: controller por ação + DTO, conforme `backend/http-api.md`, com a tradução de erro de `backend/errors.md`.
7. Registro nos módulos Nest centrais: `http.module.ts` (bloco comentado por área) e `persistence.module.ts`.
8. E2e-spec por controller.

## Verificação rápida

- O módulo tem conceito de negócio nomeável, com regra fechada antes do primeiro arquivo?
- A granularidade segue o domínio: agregado principal e satélites, e conceito com ciclo de vida próprio como módulo próprio?
- O módulo aparece só como subpasta nas camadas que usa, sem módulo Nest próprio, registrado nas listas centrais?
- Outro módulo é usado pelo contrato compartilhado, com leitura em lote, e reação ou atomicidade pelo mecanismo de `backend/operation-routing.md`?

## Delegado ao projeto

- **Integração entre módulos além do contrato compartilhado.** O projeto decide a integração entre módulos além do contrato compartilhado (capacidade exposta dedicada, comando de um módulo sobre outro).
