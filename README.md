# Slices com Guardrails

**Metodologia de desenvolvimento de software com IA**

> Este repositório é o Architecture Source da metodologia, instalado nos projetos como o pacote `metri`. O agente trabalha pelas skills (`skills/`), pelos agents (`agents/`), pelas regras (`architecture/`) e pelo `VOCABULARY.md`; este README é para humano.

## Em uma página

**O que é.** Uma forma de construir software com agentes de IA. O método vem do WebProdigios (Perrin): architectural guardrail, look across e Slice Matrix. A forma das skills vem do Matt Pocock: skills pequenas, combináveis e escritas para agentes. O modelo de conhecimento é o seu: Architecture Source global, Project Architecture e ADRs.

**A ideia central.** A qualidade não depende de o agente lembrar instruções. Ela vem de três coisas:

- **guardrails executáveis:** tipos, lint e checks que "gritam" quando algo sai do padrão;
- **padrões visíveis no código:** o agente copia o que vê;
- **contexto entregue sob demanda:** só o necessário, no momento em que é necessário.

O planejamento olha transversalmente (look across) para descobrir capacidades compartilhadas, e a entrega acontece em fatias finas e verificáveis.

**Fluxo:**

```
Rotear → Moldar → Look across → Construir → Verificar → Aceitar → Release → Aprender
                                     ↺ Diagnosticar (bugs)
```

**Artefatos do projeto (e nada mais):**

| Artefato                 | Papel                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| `AGENTS.md`              | Procedimentos e ponteiros. É a única coisa sempre carregada            |
| `docs/CONTEXT.md`        | Linguagem compartilhada do domínio (PT ↔ identificador EN)             |
| `docs/PRODUCT.md`        | Intenção e escopo                                                      |
| `docs/DESIGN.md`         | Identidade visual e design system (se houver interface)                |
| `docs/adr/`              | Decisões, trade-offs e exceções                                        |
| `.metri/ARCHITECTURE.md` | Estado do projeto: o caminho linear, desvios, capacidades ativas, delegações, exceções |
| `.metri/rules/`          | Regras só deste projeto, por área                                      |
| `.metri/specs/<F-id>.md` | Uma spec por feature: problema, solução, casos de uso e decisões de implementação e de teste          |
| `.metri/MATRIX.md`       | Plano: slices e contratos, Fog, Gaps, Pattern proposals                |
| `.metri/tickets/<id>.md` | Um arquivo por ticket (UC ou T): frontmatter, critérios e notas; a evidência dos critérios `Tela:` ao lado, em `<id>/` |
| `node_modules/metri/`    | O pacote do método: regras globais, skills, agents e a CLI; somente leitura, só em desenvolvimento |
| Código                   | Padrões, o cabeçalho `SOURCE OF TRUTH` de cada dono (onde fica a slice construída), tokens e checks |

**O humano decide em poucos pontos:** direção, plano, padrões novos e diffs sensíveis, aceite, e passos de release que só ele pode fazer. O resto é trabalho do agente.

## Começar um projeto

Na raiz do repositório git do projeto, instale o pacote `metri` numa tag e rode o `metri init`:

```bash
printf 'allowBuilds:\n  esbuild: false\n' >> pnpm-workspace.yaml   # sem isso, o pnpm 11 para no build do esbuild
pnpm add -D github:otonydesideri/metri#<tag>                   # ou link:<caminho do source>, para evoluir o método
pnpm exec metri init
```

O `metri init` cria o que o método precisa no projeto (árvore em "Mapa do projeto e do source"). Num repositório sem código, entrega também o starter: o monorepo da fundação (app-api, app-web, `packages/core`, `db` e `ui`), com o nome do diretório no lugar de `__PROJECT__`, o `.env` criado do `.env.example` e instalado pelo `pnpm install`. Termina com `metri verify` verde, com o `design-tokens` pendente. Com o banco no ar, `pnpm dev` abre a tela inicial em http://localhost:5279, com o estado da API e do banco, os próximos passos e a documentação da API. Quando o `/shape` escreve um `docs/DESIGN.md` com a marca do projeto, o `design-tokens` passa a falhar até o ticket de design system, o primeiro da slice de fundação. Num projeto que já tem código, nada disso é copiado, e o `/look-across` começa pelo mapeamento. Depois, no Claude Code: `/reload-skills` quando `.claude/skills/` não existia ao abrir a sessão, e `/shape`. Trocar de versão: `node_modules/metri/CHANGELOG.md`.

A slice de fundação fica com o que o starter não tem como saber: o banco de desenvolvimento, que é o Postgres que já roda ou o do `compose.yaml` do starter (`architecture/infrastructure/runtime.md`, "Banco de desenvolvimento"), e, com interface, o tema e o shell do starter, pelos tokens do `DESIGN.md`.

As skills e os agents entram por link, não por plugin: o plugin pede marketplace, `enabledPlugins` e aceite de confiança, e prefixa cada skill (`/<plugin>:<skill>`).

## Princípios

1. **Confiar em erros, não em contexto.** Toda regra desce pela _escada de regras_ (`skills/guardrail/SKILL.md`, "The rules ladder") até o degrau mais barato que funcione. O que pode ser verificado no código vira check, não texto.
2. **Uma fonte da verdade por conceito.** Cada informação mora em um único lugar; os outros só apontam para ela. **A fonte migra** quando o conhecimento vira código: um critério planejado mora no ticket até virar teste.
3. **Planejar por capacidade, entregar por fatia fina.** O look across descobre as slices (capacidades compartilhadas). Os tickets dentro delas são tracer bullets: finos, de ponta a ponta, verificáveis.
4. **Construir para o agora, desenhar para o futuro.** O contrato de uma slice acomoda as features previstas; a implementação atende só às features "agora". Todo ticket serve a um caso de uso atual.
5. **Contexto sob demanda.** Pouquíssimo fica sempre carregado. O resto chega por ponteiro, por resolução de regras por caminho ou por grep do cabeçalho `SOURCE OF TRUTH`. Cada ticket roda num contexto limpo, e a passagem entre etapas é feita por artefato + id, nunca pela conversa.
6. **Conhecimento persistente é exceção.** Só vira conhecimento o que não é derivável nem verificável e afeta o futuro (`skills/guardrail/KNOWLEDGE-GATE.md`). A maioria dos tickets termina sem gerar nenhum.
7. **O humano dirige; o agente executa.** O humano decide direção, plano, padrões e aceite. O agente não inventa arquitetura.
8. **O futuro entra por extensão.** Campos opcionais; nada que já existe muda de forma quando uma evolução chega ("Evolução futura", abaixo).

**Limiares:**

- Arquivo só existe se tiver conteúdo que nenhum outro pode carregar.
- ADR só com decisão tomada, difícil de reverter, surpreendente e com trade-off real.
- Regra nunca é pré-carregada: cerca de 5 por ticket, pelo `rules-for`, e encolhe quando um check ou o código assume o que ela diz.
- Skill: adaptar do Matt; skill nova só para método nosso.

## Política de idioma

| O quê                                                                                               | Idioma                            |
| --------------------------------------------------------------------------------------------------- | --------------------------------- |
| Código, comentários (o cabeçalho `SOURCE OF TRUTH` inclusive), identificadores, nomes de arquivos de código | Inglês (`architecture/defaults/stack.md`, "Stack") |
| Chaves de frontmatter, campos da matriz, ids, status, tipos                                         | Inglês, fixos, validados por lint |
| Skills e `AGENTS.md`                                                                                | Inglês (a `humanizer`, que trata texto em português, é em português) |
| `PRODUCT.md`, `CONTEXT.md` (definições), `DESIGN.md` (prosa), regras (prosa), ADRs, prosa da matriz, das specs e dos tickets, mensagens de erro | Português                         |
| Conversa com o agente                                                                               | Português                         |

A regra que evita deriva: **a conversa pode ser em português, mas toda chave, campo, id e identificador tem uma forma canônica em inglês.** Dois agentes nunca traduzem o mesmo conceito de formas diferentes, porque a tradução já está fixada e o lint rejeita qualquer outra.

### Dois glossários, duas casas

| Glossário                      | Conteúdo                                   | Onde mora                                               |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------- |
| **Linguagem do domínio**       | Termos do produto (ex.: Pedido → `Order`)  | `docs/CONTEXT.md`, por projeto (`skills/domain-language/CONTEXT-FORMAT.md`)              |
| **Vocabulário da metodologia** | Termos do processo (ex.: toca → `touches`) | `node_modules/metri/VOCABULARY.md`, global |

As chaves canônicas e o frontmatter de regra: `VOCABULARY.md`.

## Mapa do projeto e do source

### Três naturezas de conteúdo

| Natureza                                     | Exemplo                                              | Onde                                  |
| -------------------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| **Consumido** (não é produzido pelo projeto) | Regras globais, skills, CLI                          | `node_modules/metri/`, somente leitura |
| **Conhecimento do produto**                  | Produto, contexto, design, ADRs                      | `docs/`                               |
| **Estado da metodologia**                    | Ativação, regras do projeto, matriz, tickets         | `.metri/`                             |

### Árvore do projeto

```
AGENTS.md                     procedimentos + ponteiros (CLAUDE.md = uma linha apontando para ele)
.claude/skills/<nome>         link → node_modules/metri/skills/<nome>
.claude/agents/<nome>.md      link → node_modules/metri/agents/<nome>.md
docs/
  PRODUCT.md                  intenção, escopo, fora de escopo
  CONTEXT.md                  linguagem compartilhada do domínio
  DESIGN.md                   identidade visual e design system (se houver interface)
  adr/NNNN-*.md
.metri/
  ARCHITECTURE.md             desvios de stack, caminho linear, capacidades ativas, delegações, caminhos do projeto, exceções, áreas ativas
  rules/<área>/*.md           regras só do projeto          (+ INDEX.md gerado)
  specs/F<n>.md               uma spec por feature: problema, solução, casos de uso, decisões de implementação e de teste
  MATRIX.md                   plano vivo: slices e contratos, Fog, Gaps, Pattern proposals
  tickets/<id>.md             um arquivo por ticket (UC ou T): frontmatter, critérios e notas
  tickets/<id>/*.png          evidência dos critérios `Tela:` do ticket, até a poda da slice
apps/  packages/              código: no projeto novo, nasce do starter do metri init, com o compose.yaml e o .env.example
```

- **Critério de casa:** `docs/` é o conhecimento do produto e vale sem a metodologia; `.metri/` é o estado da metodologia no projeto.
- **Os arquivos que agentes já reconhecem pelo nome ficam em maiúsculas:** `AGENTS.md`, `CONTEXT.md` (nome do Matt), `DESIGN.md` (nome do spec). O nome funciona como palavra-guia.
- **`AGENTS.md` fica na raiz**, porque as ferramentas o procuram lá.
- **Arquivos gerados** (`INDEX.md` de área) têm como primeira linha "Gerado por rules-index. Não edite."; no `.metri/ARCHITECTURE.md`, só a lista abaixo do marcador `<!-- rules-index -->` é gerada. O `rules-index --check` confere se estão atualizados.
- **O lint estrutural** aceita só essa árvore (`pnpm docs-lint --help`).

### Árvore do Architecture Source

```
architecture/
  INDEX.md                      parte escrita à mão + gerado abaixo de <!-- rules-index -->: área → INDEX.md da área e a tabela "Capacidades condicionais"
  general/  backend/  domain/  frontend/  infrastructure/  ...   regras de padronização por área (+ <tema>.examples.md, INDEX.md gerado)
  defaults/                     escolhas padrão quando o projeto não decide (ex.: stack.md, ui.md → shadcn/ui) (+ INDEX.md gerado)
agents/                         os subagentes por função, no formato do Claude Code ("Agentes")
skills/                         as skills: skills/<nome>/SKILL.md, o formato de cada artefato que a skill escreve (<ARTEFATO>-FORMAT.md) e a base que a skill adapta no projeto (<ARQUIVO>-TEMPLATE.md)
cli/                            a CLI metri (TypeScript com tsx, sem build) e, em cli/templates/, o que o metri init copia
starter/                        o código inicial que o metri init copia num projeto novo; o exemplo canônico que as regras citam em examples
VOCABULARY.md                   vocabulário da metodologia (chaves canônicas)
README.md                       a metodologia para humano: porquê, princípios, mapa e referências
AGENTS.md, CLAUDE.md            instruções do agente neste repositório
CHANGELOG.md                    o que mudou em cada versão e como atualizar
package.json                    o pacote metri: o bin, os arquivos que o projeto recebe (files) e os scripts do source
```

`general/` guarda as regras que valem para mais de uma área (princípios transversais, colocação de código entre app e pacote). As áreas podem crescer conforme a necessidade (ex.: `mobile/`, `ai/`, `data/`).

### Modelo de conhecimento

| Camada               | Onde                    | Conteúdo                                                         | Quem escreve                            | Quando é lido                          |
| -------------------- | ----------------------- | ---------------------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| Architecture Source  | `node_modules/metri/`   | Padronização, capacidades condicionais, defaults, vocabulário, templates, skills | Você, por PR no repositório do source   | Via `rules-for`, `INDEX.md` e defaults |
| Project Architecture | `.metri/ARCHITECTURE.md`, `.metri/rules/` | Estado da ativação e regras só do projeto        | Look across, ticket de padrão, Aprender | Via `rules-for` e ponteiros do ticket  |
| ADRs                 | `docs/adr/`             | Decisões, trade-offs, exceções                                   | Moldar, Look across, Aprender           | Quando uma regra ou ticket cita o ADR  |
| Linguagem            | `docs/CONTEXT.md`       | Termos do domínio, PT ↔ EN                                       | Moldar, Look across                     | Ao nomear qualquer coisa               |
| Produto              | `docs/PRODUCT.md`       | Intenção e escopo                                                | Moldar                                  | Ao discutir requisitos                 |
| Design               | `docs/DESIGN.md`        | Identidade visual, uso de componentes                            | Moldar (triagem de design), Aprender    | Via ponteiro em regras de `frontend/`  |
| Spec                 | `.metri/specs/<F-id>.md` | Problema, solução, casos de uso e decisões de implementação e de teste da feature | Moldar, Look across; Aceitar, no portão de conhecimento | Construir, na cadeia de contexto do ticket |
| Plano                | `.metri/MATRIX.md`   | Slices e contratos, Fog, Gaps, Pattern proposals                  | Look across                             | Ao planejar                            |
| Ticket                | `.metri/tickets/<id>.md` | Um UC ou um T: frontmatter, história e BRs (UC) ou "O que entrega" (T), critérios e notas | Moldar (draft), Look across, Construir (status), Aceitar e Diagnosticar (reabrir, T novo) | Só o arquivo do ticket em trabalho |
| Procedimentos        | `AGENTS.md`             | Operação + ponteiros                                             | `metri init`                            | Sempre (~20 linhas)                    |
| Código               | `apps/`, `packages/`    | Padrões, cabeçalhos `SOURCE OF TRUTH`, tokens, checks            | Construir                               | Grep do `SOURCE OF TRUTH`, caminho linear, exemplo canônico |

### Architecture Source (global)

**O que é:** regras de padronização de como construímos software. Não contém nada específico de um projeto nem de uma tecnologia que varia de projeto para projeto. A exceção são os `architecture/defaults/`: escolhas tecnológicas padrão, usadas quando o projeto não decide nada diferente; a de UI é `architecture/defaults/ui.md`, e a stack tem o `architecture/defaults/stack.md` como registro. O porquê de cada decisão global: "Decisões do método".

**Stack padrão:** a stack que se repete entre projetos é um default, como a biblioteca de UI (`architecture/defaults/ui.md`): `architecture/defaults/stack.md`. As regras citam essa stack no próprio texto.

**Entrada no projeto:** o pacote `metri`, dependência de desenvolvimento numa tag, somente leitura ("Começar um projeto"). Ele fica fora do código entregue: fora de build, exportação e pacote final.

### Project Architecture (projeto)

**O que é:** regras só deste projeto, na mesma organização por áreas e no mesmo formato das globais. Exemplos: método de autenticação, stack e bibliotecas escolhidas, integrações, particularidades de infra e deploy.

**Relação com o global:** complementa sem repetir. O global padroniza, e o projeto acrescenta o que é dele.

- Uma regra do projeto nunca reescreve uma regra global.
- **Contrariar uma regra global é uma exceção:** vira ADR, e a regra do projeto aponta para ele.
- **Trocar um default global** (ex.: outra biblioteca de UI) é uma decisão registrada em ADR.
- **Precedência:** `architecture/INDEX.md`, "O que mora aqui, o que mora em outro lugar".

### A área `domain`

A área `domain/` (global e do projeto) define como modelamos domínio no código: entidade, value object, caso de uso, agregado, invariantes, eventos, comunicação com outras camadas.

**Ela não lista entidades nem regras do projeto.** A fonte de cada coisa:

- o significado dos termos → `CONTEXT.md`;
- o modelo em si → schema e código;
- as regras de negócio planejadas → casos de uso nos arquivos de ticket (`.metri/tickets/`), que migram para testes e invariantes no código.

### Carregamento sob demanda (regras por caminho)

- A **fonte da verdade do escopo** de uma regra é o `applies_to` no frontmatter.
- Se a ferramenta de agente suportar regras nativas por caminho, os ponteiros nativos são gerados a partir do frontmatter, nunca escritos à mão.
- `rules-for`, `rules-index` e os `INDEX.md` gerados: `metri rules-for --help` e `metri rules-index --help`.
- **Orçamento:** um ticket deve precisar de no máximo ~5 regras. Se precisar de mais, atravessa áreas demais e deve ser dividido; a exceção esperada é o primeiro ticket depois de um pattern novo, e o `rules-for` diz isso.

### Fonte única por conceito

| Conceito                                       | Mora em                                   | Nunca em                                       |
| ---------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| Intenção e escopo                              | `PRODUCT.md`                              | ticket, regra                                  |
| Termos do domínio (PT ↔ EN)                    | `CONTEXT.md`                              | `PRODUCT.md`, código solto                     |
| Vocabulário da metodologia                     | `VOCABULARY.md` (global)      | projeto                                        |
| Padronização (como construímos)                | Architecture Source                       | projeto                                        |
| Escolha padrão de tecnologia                   | `architecture/defaults/` (global)         | projeto                                        |
| Regras só do projeto                           | `.metri/rules/<área>/`               | global, README                                 |
| Contrato de uma slice                          | Bloco `contract` na matriz até o aceite; construída, os cabeçalhos `SOURCE OF TRUTH` dos donos e o caminho linear do `.metri/ARCHITECTURE.md` (`metri sot`) | arquivo próprio em `docs/`                     |
| Decisão, trade-off, exceção                    | ADR                                       | comentário solto                               |
| Identidade visual e uso de componentes         | `DESIGN.md`                               | regras de código                               |
| Valores dos tokens de design                   | `DESIGN.md`; o tema segue ele (`metri design-tokens`) | valor solto no código |
| Contrato de API                                | DTOs do app-api; OpenAPI e client do app-web gerados deles (`api:drift`) | cópia à mão no frontend |
| Evidência de um critério `Tela:`               | `.metri/tickets/<id>/<n>-desktop.png` e `-mobile.png`, gravados com `METRI_EVIDENCE=<id>`, até a poda da slice (`metri prune`); depois, o git | chat, pasta fora do git |
| Regra que pode ser verificada                  | check, lint, tipo, teste                  | qualquer `.md`                                 |
| Problema, solução, casos de uso e decisões de implementação e de teste de uma feature | `.metri/specs/<F-id>.md` | chat, `PRODUCT.md`, `MATRIX.md`                |
| Slices, contratos e o plano ao redor dos tickets | `MATRIX.md` | chat, handoff                                  |
| Cada UC ou T: história e BRs ou "O que entrega", critérios, status | `.metri/tickets/<id>.md`, a fonte única do ticket | `MATRIX.md`, chat, handoff                     |
| Comportamento já construído                    | testes + código                           | matriz (a slice colapsa numa linha com os donos, `sot:`; o arquivo do ticket fica, com `status: done`) |
| Como um módulo funciona                        | código + cabeçalho inline                 | `docs/`                                        |
| Procedimentos do agente                        | `AGENTS.md` + skills                      | regras de arquitetura                          |

Escada de regras: `skills/guardrail/SKILL.md`, "The rules ladder".

### Interface e Design System

Não é uma etapa própria do fluxo; é uma camada que atravessa as etapas:

- **Moldar:** a triagem de design procura o DS já dado, pergunta só o que falta e propõe os princípios de experiência (`skills/shape/DESIGN-TRIAGE.md`); os tokens do `DESIGN.md` são a fonte do tema.
- **Look across:** critérios de UI por UC, e o que se julga na tela começa com `Tela:`; tela de tipo novo vira ticket `pattern` com 2–3 variantes, e a escolhida vira tela canônica; a slice 0 leva os tokens do `DESIGN.md` ao tema e ao shell do starter, com aprovação visual.
- **Construir:** `frontend/experience`, seed realista e screenshot desktop e mobile por critério `Tela:`, com autocrítica de até 2 rodadas; os textos da interface passam pela skill `humanizer`.
- **Aceitar:** o `reviewer-ux` julga a evidência contra o `DESIGN.md`, e o teste do consumidor usa o navegador; default de UI: `architecture/defaults/ui.md`, o shadcn/ui dentro do `@metri/ui`, com os arquivos da CLI em `components/ui/` e o primitivo importado pelo nome.

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
| 0 Rotear | `cli/templates/AGENTS.md`, "How to work here" |
| 1 Moldar | `skills/shape/SKILL.md` |
| 2 Look across | `skills/look-across/SKILL.md` |
| 3 Construir | `skills/build/SKILL.md` |
| 4 Verificar | `skills/build/SKILL.md`, passo 4, e o `verify` |
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

**Agentes** (`agents/`, ligados em `.claude/agents/` pelo `metri init`): funções, não personas. `builder` constrói um ticket pela skill `/build`; `reviewer-contract`, `reviewer-patterns` e `reviewer-ux` são os eixos do aceite; `consumer-tester` usa a slice como consumidor de fora. Cada arquivo é o dono do seu brief e diz quais entradas o agente recebe.

Coordenador, workers e paralelismo: `skills/build/COORDINATOR.md`; git: `skills/build/SKILL.md`, "Git"; revisores isolados e teste do consumidor: `skills/accept/SKILL.md`; crítico sem contexto e mapeamento: `skills/look-across/SKILL.md`; pesquisa externa: `skills/research/SKILL.md`.

### Portões humanos

1. **Direção:** `skills/shape/SKILL.md`, "5. Direction gate".
2. **Plano:** `skills/look-across/SKILL.md`, "9. Quiz the user".
3. **Padrões e partes sensíveis:** `skills/build/TICKET-TYPES.md`, "pattern", e `skills/accept/SKILL.md`, "5. Human gate".
4. **Aceite:** `skills/accept/SKILL.md`, "5. Human gate" e "6. Knowledge gate".
5. **Release:** `skills/build/TICKET-TYPES.md`, "release".

Cada portão mostra três blocos: o definido, com a fonte; o inferido, com o motivo; e as perguntas em aberto (`skills/grilling/SKILL.md`, "Defined, inferred, ask"). Todo o resto é trabalho do agente.

### Integração entre planejamento, arquitetura e execução

| Passagem                   | Risco                                                 | Como é fechado                                                                        |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Planejamento → arquitetura | A slice precisa de um padrão que não existe           | Cobertura arquitetural no look across + ticket `pattern` primeiro, com revisão humana |
| Planejamento → arquitetura | O contrato se perde quando o plano termina            | Contrato na matriz até o aceite; construído, nos cabeçalhos dos donos e no caminho linear, conferidos pelo `metri sot` |
| Planejamento → execução    | Regra de negócio discutida some entre sessões         | UCs e BRs gravados no arquivo do ticket desde o Moldar (`draft`); depois migram para testes |
| Planejamento → execução    | Agentes nomeiam o mesmo conceito de formas diferentes | `CONTEXT.md` com identificador EN; chaves da metodologia fixas e validadas            |
| Arquitetura → execução     | O agente lê regras demais ou de menos                 | `applies_to` + `rules-for` + orçamento de ~5 regras por ticket                        |
| Arquitetura → execução     | O builder altera padrões em silêncio                  | O builder não edita arquitetura; proposta de padrão                                   |
| Design → execução          | Componentes recriados ou estilos fixos                | Biblioteca base + tokens no tema + lint sem valores fixos                             |
| Execução → verificação     | Checks afrouxados por quem constrói                   | Checks imutáveis para o `/build`; revisor de contrato confere a cobertura             |
| Execução → execução        | Conflitos em paralelo                                 | `touches` + serialização de pontos centrais + worktrees, com uma `E2E_PORT` por worker |
| Execução → produção        | Tarefas humanas e deploy esquecidos                   | Tickets `task` e `release`                                                            |
| Produção → evolução        | Bug volta                                             | Diagnosticar com check vermelho + "por que o guardrail não pegou?"                    |

### Skills e scripts

Cada skill em `skills/<nome>/SKILL.md`; a `description` diz o que faz e quando. Chamadas pelo usuário: `/shape`, `/look-across`, `/build`, `/accept`, `/diagnose`. Chamadas pelo modelo: `grilling`, `domain-language`, `guardrail`, `tdd`, `research`, `writing-for-agents` e `humanizer`, que tira do texto lido por humano (a prosa de `docs/` e dos ADRs, a interface, os portões e os relatórios) os sinais de texto gerado. Como são escritas: `skills/writing-for-agents/SKILL.md` e `skills/writing-for-agents/SKILL-MECHANICS.md`.

**A CLI `metri`** (código, não skill; TypeScript rodando com `tsx`, sem build): `init` (com o starter num projeto novo), `verify`, `check` (fronteiras, acesso e datas, no `lint` do projeto), `rules-for`, `rules-index` (gera os INDEX; `--check` confere), `docs-lint` (lint estrutural + formato da matriz), `design-tokens` (o tema contra o `DESIGN.md`), `sot` (os cabeçalhos `SOURCE OF TRUTH` e o registro das slices construídas) e `prune` (tira a evidência da slice na poda do `/accept`). Cada comando explica o que faz em `--help`.

## Decisões do método

O porquê das decisões globais, para humano. A regra dona, entre parênteses, guarda só o que muda o comportamento do agente.

| Decisão (regra dona) | Por quê | Alternativa descartada |
| --- | --- | --- |
| shadcn/ui como kit de UI padrão, dentro do `@metri/ui`, estilizado pelos tokens do `DESIGN.md` (`defaults/ui`) | A CLI do shadcn atualiza o arquivo que gerou, e o visual vem de tokens, não de componente recriado | AlignUI como base (o kit global divergiria do default); os dois kits juntos (dois vocabulários de componente e de token na mesma tela) |
| Layout de monorepo do shadcn, com os arquivos da CLI em `components/ui/`, aliases pelo nome do pacote e primitivo importado pelo nome (`defaults/ui`, `frontend/components`) | Um arquivo por componente, o que a documentação do shadcn mostra, e o `cn` do kit, que conhece os níveis de texto do tema, no lugar do `cn` do npm que a CLI grava | Re-export em compound por primitivo (um arquivo a mais por componente e alias `#` que a CLI resolve mal); `#` no `imports` do pacote (a documentação do shadcn recomenda o nome do pacote para o que outro workspace importa) |
| O backend é a fonte do contrato de API: os DTOs Zod geram o OpenAPI, e o app-web gera o client dele (`backend/http-api`) | O contrato é o que o servidor valida e serializa de fato; o client desatualizado quebra o `verify`, não a produção, e o OpenAPI serve também a documentação | Pacote de contrato compartilhado (URL, método e resposta à mão, sem tipo que acuse a deriva); tRPC (sem adaptador oficial para o NestJS, chamada RPC e OpenAPI ainda alfa); ts-rest (contrato próprio no lugar dos DTOs do `nestjs-zod`, ignora o prefixo global do Nest e o estável pede Zod 3) |
| Transação no escopo do caso de uso: `UnitOfWork` genérico e `version` (lock otimista) como padrão (`backend/transactions`) | Decidir sobre o estado lido sob trava exige ler, decidir e gravar no mesmo escopo, e o contrato de transação por fluxo, invisível ao caso de uso, empurra a decisão para o SQL da infra. Teste às cegas, cinco cenários de concorrência, nota de 27: contrato por fluxo 18,2; o mesmo com correções pontuais 22,7; `UnitOfWork` com regras enxutas 22,4, adotado por empatar com 8% menos texto | Contrato de transação por fluxo (a regra de negócio vazou para a infra); o mesmo contrato com correções pontuais (cresce em texto e ainda deixou regra vazar para o caso de uso) |

## Referências e origem de cada peça

A metodologia fica próxima das duas referências. Cada peça tem origem rastreável:

| Peça                                                                                                                                                                                  | Origem                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Architectural guardrail: confiar em erros, não em contexto; o _block_ por onde toda requisição passa; registry como fonte da verdade; tipos derivados; `server-only` imposto por lint | WebProdigios                             |
| Cabeçalho `SOURCE OF TRUTH` (WHAT / WHY / WHERE) acima do export que o arquivo possui, caminho linear com `arquivo:símbolo`, busca por grep antes de ler, barrels como mapa           | WebProdigios (Flute)                     |
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
| Variantes radicalmente diferentes de uma tela nova na mesma rota (`?variant=`); a escolhida vira tela canônica | Matt Pocock (`prototype`) |
| Spec por feature: problema e solução do ponto de vista de quem usa, casos de uso, decisões de implementação e de teste | Matt Pocock (`to-spec`) |
| Forma das skills: pequenas, divididas entre invocadas pelo usuário e pelo modelo, ponteiros, critérios de conclusão, palavras-guia                                                    | Matt Pocock (`writing-for-agents`)       |
| Architecture Source global + Project Architecture por áreas + ADRs                                                                                                                    | Seu modelo                               |
| Caso de uso como unidade de definição, ligando planejamento e código                                                                                                                  | DDD                                      |
| `DESIGN.md` como referência de design para agentes                                                                                                                                    | Formato do getdesign.md (spec do Google) |
| Skill `humanizer`: os sinais de texto gerado por IA e como reescrever sem inventar fato                                                                                               | blader/humanizer (a partir do "Signs of AI writing" da Wikipedia) |
| Starter: o código da fundação que o `metri init` copia num projeto novo                                                                                                                  | Fundação aceita no `/accept` de um projeto |

Referências:

- Matt Pocock, repositório de skills: https://github.com/mattpocock/skills (em especial `to-tickets`, `wayfinder`, `code-review`, `domain-modeling`, `writing-for-agents`, `to-spec`); as skills adaptadas e a licença: `skills/THIRD-PARTY-LICENSES.md`.
- WebProdigios, curso _Advanced Claude Code for Web Developers_: https://www.youtube.com/watch?v=GCz83HTg2vI
- WebProdigios, vídeo de construção do Flute com Morphite (Vertical Slice Matrix).
- getdesign.md, coleção de arquivos `DESIGN.md` para agentes: https://getdesign.md/
- shadcn/ui (default global de componentes) e Coss UI (alternativa, design system do Cal.com): https://coss.com/ui/docs

## O que ficou de fora, e por quê

| Prática comum                       | Decisão            | Motivo                                                                                                                                                                |
| ----------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista longa de user stories         | Fora               | O UC abre com uma história (`Como <ator>, quero <ação>, para <benefício>.`); o resto, BRs e critérios, diz o mesmo de forma verificável, com menos tokens              |
| Plano por fases                     | Fora               | É planejamento horizontal: gera mini-apps isolados. A matriz substitui                                                                                                |
| Design técnico por feature, sempre  | Fora               | O agente planeja no próprio contexto; padrão novo vira ticket `pattern`; decisão difícil vira ADR. Technical design para features complexas fica para "Evolução futura" |
| Etapa própria de UI/UX              | Fora               | A camada de UI/UX atravessa as etapas ("Interface e Design System"): triagem, telas canônicas, `frontend/experience`, evidência por critério e `reviewer-ux` |
| Pasta de documentação livre         | Fora               | Desatualiza. Regras com escopo e enforcement + cabeçalhos inline                                                                                                      |
| Review por ticket                   | Fora               | O portão do ticket são os checks. Julgamento por slice; exceção: tickets sensíveis e de padrão                                                                        |
| Review humano linha a linha         | Trocado            | Pela leitura do caminho linear + QA + diff das partes sensíveis                                                                                                       |
| Etapa separada de aceite de feature | Fundida            | Acontece no aceite da última slice da feature                                                                                                                         |
| Triagem com máquina de estados      | Fora               | Uma regra de roteamento no `AGENTS.md` basta                                                                                                                          |
| Wayfinder como processo separado    | Fundido            | Vira a seção Fog da matriz                                                                                                                                            |
| Standup, relatório de status, retro | Fora               | A matriz é o status; o aprendizado é disparado por evento e passa por portão                                                                                          |
| Estimativas                         | Fora               | O tamanho já é limitado: um ticket cabe num contexto limpo e em ~5 regras                                                                                             |
| Times de agentes com papéis         | Fora               | Passar trabalho entre agentes perde contexto ("Evolução futura")                                                                                            |
| Documento de handoff                | Só se interrompido | O ticket já é autocontido                                                                                                                                             |
| Arquivo de lições aprendidas        | Fora               | A lição vira check, regra, ADR, contexto, design, ou nada                                                                                                             |

## Evolução futura

Itens fora do método, cada um com o ponto de extensão pronto (campo opcional ou convenção).

| Item | Ponto de extensão | Evolução |
| --- | --- | --- |
| **Plano incremental do produto** | `milestone` na spec; horizontes `now / planned / fog`; releases por marco | Visão de roadmap gerada da matriz; skill de planejamento de marcos |
| **Technical Design para features complexas** | Documento temporário: as decisões migram para ADRs, regras e contratos no aceite, e ele é removido | Casa, template, critério de quando é obrigatório, skill própria |
| **Board próprio** | MATRIX, specs e tickets em formato estrito, com ids estáveis, chaves em inglês e lint | Uma visão que lê e escreve neles, quando houver conflito na MATRIX com agentes em paralelo, necessidade de ver ou mostrar o andamento, ou mais de ~300 linhas ativas na MATRIX depois da poda |
| **Comunicação entre agentes** | Artefatos (status, `PP`, `GAP`, Notas), mediados pelo coordenador | Canais ou "rooms"; troca de informação entre workers, nunca repasse de trabalho |
| **Acompanhamento de consumo de tokens** | `metrics` no ticket, `{ rules, tokens }`, preenchido pelo `/build` no `done` | Painel de consumo, orçamentos por agente e por slice |
| **Times de agentes coordenados** | Coordenador e worker; `blocked_by` e `touches`; branches `slice/<id>` e `ticket/<id>`; worktrees | Orquestrador contínuo (no estilo Sandcastle ou Morphite), orçamentos, notificações |
