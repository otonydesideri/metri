# Slices com Guardrails

**Metodologia de desenvolvimento de software com IA**

> **Versão 1.1.3.** Este repositório é o Architecture Source da metodologia. O agente trabalha pelas skills (`skills/`), pelas regras (`architecture/`) e pelo `VOCABULARY.md`; este README é para humano.

## Em uma página

**O que é.** Uma forma de construir software com agentes de IA. O **método** vem do WebProdigios (Perrin): architectural guardrail, look across e Slice Matrix. A **forma das skills** vem do Matt Pocock: skills pequenas, combináveis e escritas para agentes. O modelo de conhecimento é o seu: **Architecture Source global + Project Architecture + ADRs**.

**A ideia central.** A qualidade não depende de o agente lembrar instruções. Ela vem de três coisas:

- **guardrails executáveis:** tipos, lint e checks que "gritam" quando algo sai do padrão;
- **padrões visíveis no código:** o agente copia o que vê;
- **contexto entregue sob demanda:** só o necessário, no momento em que é necessário.

O planejamento olha **transversalmente** (look across) para descobrir capacidades compartilhadas. A entrega acontece em **fatias finas e verificáveis**.

**Fluxo:**

```
Rotear → Moldar → Look across → Construir → Verificar → Aceitar → Release → Aprender
                                     ↺ Diagnosticar (bugs)
```

**Artefatos do projeto (e nada mais):**

| Artefato                | Papel                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| `AGENTS.md`             | Procedimentos e ponteiros. É a única coisa sempre carregada            |
| `docs/CONTEXT.md`       | Linguagem compartilhada do domínio (PT ↔ identificador EN)             |
| `docs/PRODUCT.md`       | Intenção e escopo                                                      |
| `docs/DESIGN.md`        | Identidade visual e design system (se houver interface)                |
| `docs/architecture/`    | Estado da ativação (`INDEX.md`) e regras só deste projeto, por área    |
| `docs/adr/`             | Decisões, trade-offs e exceções                                        |
| `docs/plan/MATRIX.md`   | Plano único: features, casos de uso, slices e contratos, tickets e checks |
| `.metri/`               | Regras de padronização globais, skills e scripts, somente leitura, só em desenvolvimento |
| Código                  | Padrões, cabeçalhos inline (e o contrato da slice construída), SOT keywords, tokens e checks |

**O humano decide em poucos pontos:** direção, plano, padrões novos e diffs sensíveis, aceite, e passos de release que só ele pode fazer. O resto é trabalho do agente.

## Princípios

1. **Confiar em erros, não em contexto.** Toda regra desce pela _escada de regras_ (`skills/guardrail/SKILL.md`, "The rules ladder") até o degrau mais barato que funcione. O que pode ser verificado no código vira check, não texto.
2. **Uma fonte da verdade por conceito.** Cada informação mora em um único lugar; os outros só apontam para ela. **A fonte migra** quando o conhecimento vira código: um critério planejado mora na matriz até virar teste; um token definido no `DESIGN.md` mora no código depois da slice de design system.
3. **Planejar por capacidade, entregar por fatia fina.** O look across descobre as slices (capacidades compartilhadas). Os tickets dentro delas são tracer bullets: finos, de ponta a ponta, verificáveis.
4. **Construir para o agora, desenhar para o futuro.** O contrato de uma slice acomoda as features previstas; a implementação atende só às features "agora". Todo ticket serve a um caso de uso atual.
5. **Contexto sob demanda.** Pouquíssimo fica sempre carregado. O resto chega por ponteiro, por resolução de regras por caminho ou por grep de SOT keyword. Cada ticket roda num contexto limpo, e a passagem entre etapas é feita por artefato + id, nunca pela conversa.
6. **Conhecimento persistente é exceção.** Só vira conhecimento o que não é derivável nem verificável e afeta o futuro (`skills/guardrail/KNOWLEDGE-GATE.md`). A maioria dos tickets termina sem gerar nenhum.
7. **O humano dirige; o agente executa.** O humano decide direção, plano, padrões e aceite. O agente não inventa arquitetura.
8. **O futuro entra por extensão.** Campos opcionais e pastas reservadas; nada que já existe muda de forma quando uma evolução chega ("Evolução futura", abaixo).

**Limiares:**

- Arquivo só existe se tiver conteúdo que nenhum outro pode carregar.
- ADR só com decisão tomada, difícil de reverter, surpreendente e com trade-off real.
- O `docs/` do projeto tem só `PRODUCT.md`, `CONTEXT.md`, `DESIGN.md`, `docs/architecture/INDEX.md` (e regra de projeto quando houver caso real), `docs/adr/` e `docs/plan/MATRIX.md`, e o `docs-lint` barra o resto.
- Regra nunca é pré-carregada: cerca de 5 por ticket, pelo `rules-for`, e encolhe quando um check ou o código assume o que ela diz.
- O agente lê `AGENTS.md`, skills e regras; este README é para humano.
- Skill: adaptar do Matt; skill nova só para método nosso.

## Política de idioma

| O quê                                                                                               | Idioma                            |
| --------------------------------------------------------------------------------------------------- | --------------------------------- |
| Código, identificadores, nomes de arquivos de código                                                | `architecture/defaults/stack.md`, "Stack" |
| Chaves de frontmatter, campos da matriz, ids, status, tipos                                         | Inglês, fixos, validados por lint |
| Skills e `AGENTS.md`                                                                                | Inglês                            |
| `PRODUCT.md`, `CONTEXT.md` (definições), `DESIGN.md` (prosa), regras (prosa), ADRs, prosa da matriz | Português                         |
| Conversa com o agente                                                                               | Português                         |

A regra que evita deriva: **a conversa pode ser em português, mas toda chave, campo, id e identificador tem uma forma canônica em inglês.** Dois agentes nunca traduzem o mesmo conceito de formas diferentes, porque a tradução já está fixada e o lint rejeita qualquer outra.

### Dois glossários, duas casas

| Glossário                      | Conteúdo                                   | Onde mora                                               |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| **Linguagem do domínio**       | Termos do produto (ex.: Pedido → `Order`)  | `docs/CONTEXT.md`, por projeto (`skills/domain-language/CONTEXT-FORMAT.md`)              |
| **Vocabulário da metodologia** | Termos do processo (ex.: toca → `touches`) | `.metri/VOCABULARY.md`, global |

As chaves canônicas e o frontmatter de regra: `VOCABULARY.md`.

## Mapa do projeto e do source

### Quatro naturezas de conteúdo

| Natureza                                     | Exemplo                                      | Onde                                             |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| **Consumido** (não é produzido pelo projeto) | Regras globais, templates, skills            | `.metri/` na raiz, somente leitura               |
| **Conhecimento durável**                     | Contexto, produto, design, arquitetura, ADRs | `docs/`                                          |
| **Plano temporário**                         | Matriz, technical design                     | `docs/plan/`                                     |
| **Saída gerada** (reservado)                 | Evidências de teste                          | `.evidence/` (fora do git)                       |

### Árvore do projeto

```
AGENTS.md                     procedimentos + ponteiros (CLAUDE.md = uma linha apontando para ele)
.metri/                       global, somente leitura, versão fixada, fora do código entregue
.claude/skills/<nome>         link para .metri/skills/<nome> (o /setup cria)
docs/
  CONTEXT.md                  linguagem compartilhada do domínio
  PRODUCT.md                  intenção, escopo, fora de escopo
  DESIGN.md                   identidade visual e design system (se houver interface)
  architecture/
    INDEX.md                  base (source@vX.Y), desvios de stack, caminho linear, capacidades ativas, delegações, caminhos do projeto, exceções, áreas ativas
    <área>/*.md               regras só do projeto          (+ INDEX.md gerado)
  adr/NNNN-*.md
  plan/
    MATRIX.md                 plano vivo
    tech/                     [reservado] technical design de features complexas
.evidence/                    [reservado, fora do git] evidências por ticket
```

- **Os arquivos que agentes já reconhecem pelo nome ficam em maiúsculas:** `AGENTS.md`, `CONTEXT.md` (nome do Matt), `DESIGN.md` (nome do spec). O nome funciona como palavra-guia.
- **`AGENTS.md` fica na raiz**, porque as ferramentas o procuram lá.
- **Arquivos gerados** (`INDEX.md` de área) têm como primeira linha "Gerado por rules-index. Não edite."; no `INDEX.md` raiz, só a lista abaixo do marcador `<!-- rules-index -->` é gerada. O `rules-index:check` confere se estão atualizados.
- **O lint estrutural** aceita exatamente essa árvore; a pasta reservada `docs/plan/tech/` entra no lint quando for usada (`pnpm docs-lint --help`).

### Árvore do Architecture Source

```
.metri/                         repositório próprio, versionado por tags (vX.Y), montado nos projetos nesta pasta
  architecture/
    INDEX.md                    parte escrita à mão + gerado abaixo de <!-- rules-index -->: área → INDEX.md da área e a tabela "Capacidades condicionais"
    general/  backend/  domain/  frontend/  infrastructure/  ...   regras de padronização por área (+ <tema>.examples.md, INDEX.md gerado)
    defaults/                   escolhas padrão quando o projeto não decide (ex.: stack.md, ui.md → shadcn/ui) (+ INDEX.md gerado)
  template/                     scripts em template/scripts/ e, quando existir, o código do starter (block, registry, adapters, regras de lint)
  adr/                          decisões globais (inclusive as que sustentam os defaults)
  skills/                       as skills: skills/<nome>/SKILL.md, o formato de cada artefato que a skill escreve (<ARTEFATO>-FORMAT.md) e o arquivo copiado igual para o projeto (<ARQUIVO>-TEMPLATE.md)
  VOCABULARY.md                 vocabulário da metodologia (chaves canônicas)
  README.md                     a metodologia para humano: porquê, princípios, mapa e referências
  AGENTS.md, CLAUDE.md          instruções do agente neste repositório
  CHANGELOG.md                  o que mudou em cada versão e como atualizar
  package.json                  scripts do source (pnpm): rules-index, rules-index:check, docs-lint, rules-for, verify, test (+ pnpm-workspace.yaml, pnpm-lock.yaml)
```

`general/` guarda as regras que valem para mais de uma área (princípios transversais, colocação de código entre app e pacote). As áreas podem crescer conforme a necessidade (ex.: `mobile/`, `ai/`, `data/`).

### Modelo de conhecimento

| Camada               | Onde                    | Conteúdo                                                         | Quem escreve                            | Quando é lido                          |
| -------------------- | ----------------------- | ---------------------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| Architecture Source  | `.metri/`               | Padronização, capacidades condicionais, defaults, vocabulário, templates, skills | Você, por PR no repositório do source   | Via `rules-for`, `INDEX.md` e defaults |
| Project Architecture | `docs/architecture/`    | Estado da ativação e regras só do projeto                        | Look across, ticket de padrão, Aprender | Via `rules-for` e ponteiros do ticket  |
| ADRs                 | `docs/adr/`             | Decisões, trade-offs, exceções                                   | Moldar, Look across, Aprender           | Quando uma regra ou ticket cita o ADR  |
| Linguagem            | `docs/CONTEXT.md`       | Termos do domínio, PT ↔ EN                                       | Moldar, Look across                     | Ao nomear qualquer coisa               |
| Produto              | `docs/PRODUCT.md`       | Intenção e escopo                                                | Moldar                                  | Ao discutir requisitos                 |
| Design               | `docs/DESIGN.md`        | Identidade visual, uso de componentes                            | Moldar (triagem de design), Aprender    | Via ponteiro em regras de `frontend/`  |
| Plano                | `docs/plan/MATRIX.md`   | Features, UCs, BRs, slices, tickets, checks                      | Moldar, Look across, Construir (status) | Só a seção do ticket em trabalho       |
| Procedimentos        | `AGENTS.md`             | Operação + ponteiros                                             | Setup, Aprender                         | Sempre (~20 linhas)                    |
| Código               | `src/` etc.             | Padrões, cabeçalhos inline, tokens, checks                       | Construir                               | Grep por SOT keyword, exemplo canônico |

### Architecture Source (global)

**O que é:** regras de **padronização** de como construímos software. Não contém nada específico de um projeto nem de uma tecnologia que varia de projeto para projeto. A exceção são os `architecture/defaults/`: escolhas tecnológicas padrão, usadas quando o projeto não decide nada diferente; a de UI é sustentada por ADR global (ADR-0001), e a stack tem o `architecture/defaults/stack.md` como registro.

**Stack padrão:** a stack que se repete entre projetos é um default, como a biblioteca de UI (`architecture/defaults/ui.md`): `architecture/defaults/stack.md`. As regras citam essa stack no próprio texto. Projeto com outra stack registra a troca em ADR e escreve uma regra de projeto para o que muda.

**Entrada no projeto:** submódulo ou pacote em `.metri/`, **somente leitura e com versão fixada**. É dependência só de desenvolvimento: **não vai para o código entregue** (fica fora de build, exportação e pacote final).

### Project Architecture (projeto)

**O que é:** regras **só deste projeto**, na mesma organização por áreas e no mesmo formato das globais. Exemplos: método de autenticação, stack e bibliotecas escolhidas, integrações, particularidades de infra e deploy.

**Relação com o global:** **complementa, não repete.** Não existem duas fontes da verdade: o global padroniza, o projeto acrescenta o que é dele.

- Uma regra do projeto nunca reescreve uma regra global.
- **Contrariar uma regra global é uma exceção:** vira ADR, e a regra do projeto aponta para ele.
- **Trocar um default global** (ex.: outra biblioteca de UI) é uma decisão registrada em ADR.
- **Precedência:** `architecture/INDEX.md`, "O que mora aqui, o que mora em outro lugar".

### A área `domain`

A área `domain/` (global e do projeto) define **como modelamos domínio no código**: entidade, value object, caso de uso, agregado, invariantes, eventos, comunicação com outras camadas.

**Ela não lista entidades nem regras do projeto.** A fonte de cada coisa:

- o **significado** dos termos → `CONTEXT.md`;
- o **modelo em si** → schema e código;
- as **regras de negócio planejadas** → casos de uso na matriz, que migram para testes e invariantes no código.

### Carregamento sob demanda (regras por caminho)

- A **fonte da verdade do escopo** de uma regra é o `applies_to` no frontmatter.
- Se a ferramenta de agente suportar regras nativas por caminho, os ponteiros nativos são **gerados** a partir do frontmatter, nunca escritos à mão.
- `rules-for`, `rules-index` e os `INDEX.md` gerados: `pnpm rules-for --help` e `template/scripts/rules-index.ts`.
- **Orçamento:** um ticket deve precisar de **no máximo ~5 regras**. Se precisar de mais, atravessa áreas demais e deve ser dividido.

### Fonte única por conceito

| Conceito                                       | Mora em                                   | Nunca em                                       |
| ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| Intenção e escopo                              | `PRODUCT.md`                              | ticket, regra                                  |
| Termos do domínio (PT ↔ EN)                    | `CONTEXT.md`                              | `PRODUCT.md`, código solto                     |
| Vocabulário da metodologia                     | `VOCABULARY.md` (global)      | projeto                                        |
| Padronização (como construímos)                | Architecture Source                       | projeto                                        |
| Escolha padrão de tecnologia                   | `architecture/defaults/` (global)         | projeto                                        |
| Regras só do projeto                           | `docs/architecture/<área>/`               | global, README                                 |
| Contrato de uma slice                          | Bloco `contract` na matriz; construída, cabeçalho do `entry` | arquivo próprio em `docs/`                     |
| Decisão, trade-off, exceção                    | ADR                                       | comentário solto                               |
| Identidade visual e uso de componentes         | `DESIGN.md`                               | regras de código                               |
| Valores dos tokens de design                   | Código (tema)                             | `DESIGN.md` (depois da slice de design system) |
| Regra que pode ser verificada                  | check, lint, tipo, teste                  | qualquer `.md`                                 |
| Features, UCs, BRs planejadas, tickets, status | `MATRIX.md`, a fonte única dos tickets; um board próprio, no futuro, é uma visão que lê e escreve a MATRIX pelo formato estrito dela | chat, handoff                                  |
| Comportamento já construído                    | testes + código                           | matriz (a linha colapsa num ponteiro)          |
| Como um módulo funciona                        | código + cabeçalho inline                 | `docs/`                                        |
| Procedimentos do agente                        | `AGENTS.md` + skills                      | regras de arquitetura                          |

Escada de regras: `skills/guardrail/SKILL.md`, "The rules ladder".

### Interface e Design System

Não é uma etapa própria do fluxo. É uma **triagem** dentro do `/shape`, um **artefato** (`DESIGN.md`) e uma **capacidade condicional** (`defaults/ui`).

Default global (shadcn/ui, sem recriar componente): `architecture/defaults/ui.md` e `adr/0001-default-ui-library.md`; triagem, formato do `DESIGN.md` e onde cada decisão mora: `skills/shape/DESIGN-TRIAGE.md`.

### O fluxo

```
Pedido ─► 0 Rotear ─┬─ direto (cabe numa slice, 1 ticket, sem regra nova, não sensível) ─► 3 Construir
                    ├─ bug ─► ↺ Diagnosticar ─► ticket ──────────────────────────────────► 3 Construir
                    └─ iniciativa ─► 1 Moldar ─► 2 Look across ─► 3 Construir ─► 4 Verificar
                                                                       ▲             │
                                                                       └── vermelho ─┘
                                                           verde ─► 5 Aceitar ─► 6 Release
                                                                        │
                                                                        ▼
                                                                  7 Aprender e evoluir
                                                   (checks, regras, ADRs, contexto, design, source global)
```

**Etapas:**

| Etapa | Onde |
| --- | --- |
| 0 Rotear | `skills/setup/AGENTS-TEMPLATE.md`, "How to work here" |
| 1 Moldar | `skills/shape/SKILL.md` |
| 2 Look across | `skills/look-across/SKILL.md` |
| 3 Construir | `skills/build/SKILL.md` |
| 4 Verificar | `skills/build/SKILL.md`, passo 5, e o `verify` |
| 5 Aceitar | `skills/accept/SKILL.md` |
| 6 Release | `skills/build/TICKET-TYPES.md`, "release" |
| 7 Aprender e evoluir | `skills/guardrail/KNOWLEDGE-GATE.md`, no fim do `/accept` e do `/diagnose` |
| ↺ Diagnosticar | `skills/diagnose/SKILL.md` |

A cadeia de contexto de um ticket: `skills/build/SKILL.md`, passo 1.

### Agentes, paralelismo e git

**Um agente separado se justifica em três casos:**

1. **Julgamento, que precisa de isolamento:** revisores do aceite, teste do consumidor sem contexto, crítico da matriz.
2. **Varredura da qual interessa só a conclusão:** pesquisa externa, survey de arquitetura, mapeamento de projeto existente.
3. **Paralelismo real:** tickets ou subtarefas desbloqueados, sem `touches` em comum, em áreas diferentes.

**Não usar:** personas (PM, arquiteto, QA), passagem de trabalho entre agentes, revisor por ticket, agente planejador separado do humano.

Coordenador, workers e paralelismo: `skills/build/COORDINATOR.md`; git: `skills/build/SKILL.md`, "Git"; revisores isolados e teste do consumidor: `skills/accept/SKILL.md`; crítico sem contexto e mapeamento: `skills/look-across/SKILL.md`; pesquisa externa: `skills/research/SKILL.md`.

### Portões humanos

1. **Direção:** `skills/shape/SKILL.md`, "5. Direction gate".
2. **Plano:** `skills/look-across/SKILL.md`, "8. Quiz the user".
3. **Padrões e partes sensíveis:** `skills/build/TICKET-TYPES.md`, "pattern", e `skills/accept/SKILL.md`, "5. Human gate".
4. **Aceite:** `skills/accept/SKILL.md`, "5. Human gate" e "6. Knowledge gate".
5. **Release:** `skills/build/TICKET-TYPES.md`, "release".

Todo o resto é trabalho do agente.

### Integração entre planejamento, arquitetura e execução

| Passagem                   | Risco                                                 | Como é fechado                                                                        |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Planejamento → arquitetura | A slice precisa de um padrão que não existe           | Cobertura arquitetural no look across + ticket `pattern` primeiro, com revisão humana |
| Planejamento → arquitetura | O contrato se perde quando o plano termina            | Contrato na matriz enquanto é plano; construído, no cabeçalho do `entry`              |
| Planejamento → execução    | Regra de negócio discutida some entre sessões         | UCs e BRs gravados na matriz desde o Moldar; depois migram para testes                |
| Planejamento → execução    | Agentes nomeiam o mesmo conceito de formas diferentes | `CONTEXT.md` com identificador EN; chaves da metodologia fixas e validadas            |
| Arquitetura → execução     | O agente lê regras demais ou de menos                 | `applies_to` + `rules-for` + orçamento de ~5 regras por ticket                        |
| Arquitetura → execução     | O builder altera padrões em silêncio                  | O builder não edita arquitetura; proposta de padrão                                   |
| Design → execução          | Componentes recriados ou estilos fixos                | Biblioteca base + tokens no tema + lint sem valores fixos                             |
| Execução → verificação     | Checks afrouxados por quem constrói                   | Checks imutáveis para o `/build`; revisor de contrato confere a cobertura             |
| Execução → execução        | Conflitos em paralelo                                 | `touches` + serialização de pontos centrais + worktrees                               |
| Execução → produção        | Tarefas humanas e deploy esquecidos                   | Tickets `task` e `release`                                                            |
| Produção → evolução        | Bug volta                                             | Diagnosticar com check vermelho + "por que o guardrail não pegou?"                    |

### Skills e scripts

Cada skill em `skills/<nome>/SKILL.md`; a `description` diz o que faz e quando. Chamadas pelo usuário: `/setup`, `/shape`, `/look-across`, `/build`, `/accept`, `/diagnose`. Chamadas pelo modelo: `grilling`, `domain-language`, `guardrail`, `tdd`, `research`, `writing-for-agents`. Como são escritas: `skills/writing-for-agents/SKILL.md` e `skills/writing-for-agents/SKILL-MECHANICS.md`.

**Scripts no template** (código, não skill; TypeScript rodando com `tsx`, sem build): `verify`, `rules-for`, `rules-index` (gera os INDEX; `rules-index:check` confere), `docs-lint` (lint estrutural + formato da matriz).

## Referências e origem de cada peça

A metodologia fica próxima das duas referências. Cada peça tem origem rastreável:

| Peça                                                                                                                                                                                  | Origem                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Architectural guardrail: confiar em erros, não em contexto; o _block_ por onde toda requisição passa; registry como fonte da verdade; tipos derivados; `server-only` imposto por lint | WebProdigios                             |
| SOT keywords, busca por grep antes de ler, cabeçalho inline (o quê / por quê / onde / como), barrels como mapa                                                                        | WebProdigios                             |
| Documentação mínima para a IA; `AGENTS.md`/`CLAUDE.md` como ponteiro, não como descrição                                                                                              | WebProdigios                             |
| Look across, Vertical Slice Matrix, slice como capacidade compartilhada, contrato da slice, checks por ticket, "nada órfão", planejar para o futuro                                   | WebProdigios                             |
| Coordenador + workers em worktrees; worker fala só com o coordenador; subtarefas                                                                                                      | WebProdigios (Morphite)                  |
| Teste com agente sem contexto; lacuna sinalizada (_gap method_); "assuma que já existe"                                                                                               | WebProdigios                             |
| Tokens de design no lugar de valores fixos; componentes globais com slots                                                                                                             | WebProdigios                             |
| Grilling, linguagem do domínio (`CONTEXT.md`), critério de ADR                                                                                                                        | Matt Pocock                              |
| Tracer bullets, dependências de bloqueio, fronteira, expand–contract, prefactor primeiro                                                                                              | Matt Pocock                              |
| TDD no seam, módulos profundos                                                                                                                                                        | Matt Pocock                              |
| Revisão em dois eixos por subagentes isolados                                                                                                                                         | Matt Pocock                              |
| HITL/AFK, tipo de ticket `task`, contexto limpo por tarefa, filas em vez de loops, protótipo descartável                                                                              | Matt Pocock                              |
| Forma das skills: pequenas, divididas entre invocadas pelo usuário e pelo modelo, ponteiros, critérios de conclusão, palavras-guia                                                    | Matt Pocock (`writing-for-agents`)       |
| Architecture Source global + Project Architecture por áreas + ADRs                                                                                                                    | Seu modelo                               |
| Caso de uso como unidade de definição, ligando planejamento e código                                                                                                                  | DDD                                      |
| `DESIGN.md` como referência de design para agentes                                                                                                                                    | Formato do getdesign.md (spec do Google) |

Referências:

- Matt Pocock, repositório de skills: https://github.com/mattpocock/skills (em especial `to-tickets`, `wayfinder`, `code-review`, `domain-modeling`, `writing-for-agents`); as skills adaptadas e a licença: `skills/THIRD-PARTY-LICENSES.md`.
- WebProdigios, curso _Advanced Claude Code for Web Developers_: https://www.youtube.com/watch?v=GCz83HTg2vI
- WebProdigios, vídeo de construção do Flute com Morphite (Vertical Slice Matrix).
- getdesign.md, coleção de arquivos `DESIGN.md` para agentes: https://getdesign.md/
- shadcn/ui (default global de componentes) e Coss UI (alternativa, design system do Cal.com): https://coss.com/ui/docs

## O que ficou de fora, e por quê

| Prática comum                       | Decisão            | Motivo                                                                                                                                                                |
| ----------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD / spec por feature              | Fora               | A intenção fica no `PRODUCT.md`, a decisão no ADR, o comportamento nos UCs. Uma spec separada duplicaria os três e desatualizaria                                     |
| Lista longa de user stories         | Fora               | O UC com critérios diz o mesmo de forma verificável, com menos tokens                                                                                                 |
| Plano por fases                     | Fora               | É planejamento horizontal: gera mini-apps isolados. A matriz substitui                                                                                                |
| Design técnico por feature, sempre  | Fora na v1         | O agente planeja no próprio contexto; padrão novo vira ticket `pattern`; decisão difícil vira ADR. Technical design para features complexas fica reservado ("Evolução futura") |
| Etapa própria de UI/UX              | Fora               | Triagem de design no `/shape` + `DESIGN.md` + slice de design system bastam                                                                                           |
| Pasta de documentação livre         | Fora               | Desatualiza. Regras com escopo e enforcement + cabeçalhos inline                                                                                                      |
| Review por ticket                   | Fora               | O portão do ticket são os checks. Julgamento por slice; exceção: tickets sensíveis e de padrão                                                                        |
| Review humano linha a linha         | Trocado            | Pela leitura do caminho linear + QA + diff das partes sensíveis                                                                                                       |
| Etapa separada de aceite de feature | Fundida            | Acontece no aceite da última slice da feature                                                                                                                         |
| Triagem com máquina de estados      | Fora               | Uma regra de roteamento no `AGENTS.md` basta                                                                                                                          |
| Wayfinder como processo separado    | Fundido            | Vira a seção Fog da matriz                                                                                                                                            |
| Standup, relatório de status, retro | Fora               | A matriz é o status; o aprendizado é disparado por evento e passa por portão                                                                                          |
| Estimativas                         | Fora               | O tamanho já é limitado: um ticket cabe num contexto limpo e em ~5 regras                                                                                             |
| Times de agentes com papéis         | Fora na v1         | Passar trabalho entre agentes perde contexto ("Evolução futura")                                                                                            |
| Documento de handoff                | Só se interrompido | O ticket já é autocontido                                                                                                                                             |
| Arquivo de lições aprendidas        | Fora               | A lição vira check, regra, ADR, contexto, design, ou nada                                                                                                             |

## Evolução futura

Estes itens **não fazem parte da v1**, mas são direção declarada do sistema. O modelo atual já foi desenhado para não bloqueá-los: cada um tem um ponto de extensão preparado (campo opcional, pasta reservada ou convenção) e **nada do que existe precisa mudar de forma** quando eles chegarem.

| Item                                            | Já preparado na v1                                                                                                                                                                                         | Evolução                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Plano incremental do produto (V1 → Vn)**      | Campo `milestone` nas features; horizontes `now / planned / fog / out`; releases por milestone                                                                                                             | Visão de roadmap gerada a partir da matriz; skill de planejamento de versões                       |
| **Technical Design para features complexas**    | Pasta reservada `docs/plan/tech/`; campo `tech_design` na feature; ciclo de vida definido: **documento temporário**, cujas decisões migram para ADRs, regras e contratos no aceite, e então ele é removido | Template, critério de quando é obrigatório, skill própria                                          |
| **Evidências anexadas ao ticket (screenshots)** | Campo `evidence` no ticket; pasta `.evidence/<ticket>/` fora do git                                                                                                                                        | Captura automática (ex.: Playwright), anexo ao PR ou ao ticket na MATRIX, a fonte única dos tickets, evidência exigida por tipo de ticket |
| **Board próprio**                               | Formato estrito, legível por máquina, com ids estáveis e chaves em inglês, validado por lint; a MATRIX é a fonte única dos tickets | Um board próprio, sem ferramenta externa: uma visão que lê e escreve a MATRIX pelo formato estrito dela (e pode desenhar o diagrama da matriz, no estilo da demonstração do WebProdigios) |
| **Comunicação entre agentes**                   | Comunicação por artefatos (status, `PP`, `GAP`, `notes`), mediada pelo coordenador                                                                                                                         | Canais ou "rooms"; troca de informação entre workers (nunca repasse de trabalho)                   |
| **Acompanhamento de consumo de tokens**         | Campo `metrics` no ticket (tokens, regras carregadas), preenchido pelo `/build` quando a ferramenta expõe o dado. Já usado no piloto                                                                       | Painel de consumo, orçamentos por agente e por slice                                               |
| **Times de agentes coordenados**                | Papéis de coordenador e worker; matriz como grafo de dependências (`blocked_by`, `touches`); convenção de branches `slice/<id>` e `ticket/<id>`; worktrees                                                 | Orquestrador contínuo (no estilo Sandcastle ou Morphite), orçamentos, notificações                 |

### Validação e melhoria (piloto)

Uma iniciativa real de 2–3 slices, medindo:

- regras carregadas por ticket (meta ≤ 5);
- propostas de padrão surgidas na construção (se forem muitas, o look across está fraco);
- achados de padrão no aceite que um lint poderia ter pego (se forem muitos, a escada não está sendo usada);
- vezes em que o agente precisou de contexto fora da cadeia de ponteiros;
- lições aprovadas por slice (se forem muitas, o portão de conhecimento está frouxo);
- tokens por ticket e retrabalho após o aceite.

Os resultados alimentam a v1.2 desta metodologia.
