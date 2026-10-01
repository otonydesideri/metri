# Slices com Guardrails

**Metodologia de desenvolvimento de software com IA**

> **Versão 1.5.0.** Este repositório é o Architecture Source da metodologia, instalado nos projetos como o pacote `metri`. O agente trabalha pelas skills (`skills/`), pelos agents (`agents/`), pelas regras (`architecture/`) e pelo `VOCABULARY.md`; este README é para humano.

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
| `.metri/MATRIX.md`       | Plano: features, slices e contratos, Fog, Gaps, Pattern proposals      |
| `.metri/tickets/<id>.md` | Um arquivo por ticket (UC ou T): frontmatter, critérios e notas; a evidência dos critérios `Tela:` ao lado, em `<id>/` |
| `node_modules/metri/`    | O pacote do método: regras globais, skills, agents e a CLI; somente leitura, só em desenvolvimento |
| Código                   | Padrões, o cabeçalho `SOURCE OF TRUTH` de cada dono (onde fica a slice construída), tokens e checks |

**O humano decide em poucos pontos:** direção, plano, padrões novos e diffs sensíveis, aceite, e passos de release que só ele pode fazer. O resto é trabalho do agente.

## Começar um projeto

Na raiz do repositório git do projeto, instale o pacote `metri` numa tag e rode o `metri init`:

```bash
printf 'allowBuilds:\n  esbuild: false\n' >> pnpm-workspace.yaml   # sem isso, o pnpm 11 para no build do esbuild
pnpm add -D github:otonydesideri/metri#v1.5.0                  # ou link:<caminho do source>, para evoluir o método
pnpm exec metri init
```

O `metri init` cria o que o método precisa no projeto (árvore em "Mapa do projeto e do source"). Num repositório sem código, entrega também o starter: o monorepo da fundação (app-api, app-web, `packages/core`, `db` e `ui`), com o nome do diretório no lugar de `__PROJECT__`, o `.env` criado do `.env.example` e instalado pelo `pnpm install`. Termina com `metri verify` verde, com o `design-tokens` pendente. Com o banco no ar, `pnpm dev` abre a tela inicial em http://localhost:5279, com o estado da API e do banco, os próximos passos e a documentação da API. Quando o `/shape` escreve um `docs/DESIGN.md` com a marca do projeto, o `design-tokens` passa a falhar até o ticket de design system, o primeiro da slice de fundação. Num projeto que já tem código, nada disso é copiado, e o `/look-across` começa pelo mapeamento. Depois, no Claude Code: `/reload-skills` quando `.claude/skills/` não existia ao abrir a sessão, e `/shape`. Trocar de versão: `node_modules/metri/CHANGELOG.md`.

A slice de fundação fica com o que o starter não tem como saber. Com banco de dados, o agente mostra o que já roda na máquina e pergunta se o projeto usa esse Postgres ou o do `compose.yaml` do starter. No Postgres que já roda, o `.env` aponta para ele, o `prisma migrate dev` cria o banco que falta, e o `compose.yaml` sai; no Docker, `pnpm db:up` sobe o Postgres e `pnpm db:down` o remove (`architecture/infrastructure/runtime.md`, "Banco de desenvolvimento"). Com interface, um ticket leva os tokens do `DESIGN.md` para o tema e ajusta o shell do starter.

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
- O `docs/` do projeto tem só `PRODUCT.md`, `CONTEXT.md`, `DESIGN.md` e `adr/`; o `.metri/`, só `ARCHITECTURE.md`, `rules/` (quando houver caso real), `MATRIX.md` e `tickets/`. O `docs-lint` barra o resto.
- Regra nunca é pré-carregada: cerca de 5 por ticket, pelo `rules-for`, e encolhe quando um check ou o código assume o que ela diz.
- O agente lê `AGENTS.md`, skills e regras; este README é para humano.
- Skill: adaptar do Matt; skill nova só para método nosso.

## Política de idioma

| O quê                                                                                               | Idioma                            |
| --------------------------------------------------------------------------------------------------- | --------------------------------- |
| Código, comentários (o cabeçalho `SOURCE OF TRUTH` inclusive), identificadores, nomes de arquivos de código | Inglês (`architecture/defaults/stack.md`, "Stack") |
| Chaves de frontmatter, campos da matriz, ids, status, tipos                                         | Inglês, fixos, validados por lint |
| Skills e `AGENTS.md`                                                                                | Inglês (a `humanizer`, que trata texto em português, é em português) |
| `PRODUCT.md`, `CONTEXT.md` (definições), `DESIGN.md` (prosa), regras (prosa), ADRs, prosa da matriz, mensagens de erro | Português                         |
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
  MATRIX.md                   plano vivo: features, slices e contratos, Fog, Gaps, Pattern proposals
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
adr/                            decisões globais (inclusive as que sustentam os defaults)
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
| Plano                | `.metri/MATRIX.md`   | Features, slices e contratos, Fog, Gaps, Pattern proposals       | Moldar, Look across                     | Ao planejar                            |
| Ticket                | `.metri/tickets/<id>.md` | Um UC ou um T: frontmatter, BRs ou "O que entrega", critérios e notas | Moldar (draft), Look across, Construir (status) | Só o arquivo do ticket em trabalho |
| Procedimentos        | `AGENTS.md`             | Operação + ponteiros                                             | `metri init`, Aprender                  | Sempre (~20 linhas)                    |
| Código               | `apps/`, `packages/`    | Padrões, cabeçalhos `SOURCE OF TRUTH`, tokens, checks            | Construir                               | Grep do `SOURCE OF TRUTH`, caminho linear, exemplo canônico |

### Architecture Source (global)

**O que é:** regras de padronização de como construímos software. Não contém nada específico de um projeto nem de uma tecnologia que varia de projeto para projeto. A exceção são os `architecture/defaults/`: escolhas tecnológicas padrão, usadas quando o projeto não decide nada diferente; a de UI é sustentada por ADR global (metri:ADR-0003), e a stack tem o `architecture/defaults/stack.md` como registro.

**Stack padrão:** a stack que se repete entre projetos é um default, como a biblioteca de UI (`architecture/defaults/ui.md`): `architecture/defaults/stack.md`. As regras citam essa stack no próprio texto. Projeto com outra stack registra a troca em ADR e escreve uma regra de projeto para o que muda.

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
| Contrato de API                                | DTOs do app-api; OpenAPI e client do app-web gerados deles (`api:drift`) | cópia à mão no frontend (metri:ADR-0002) |
| Evidência de um critério `Tela:`               | `.metri/tickets/<id>/<n>-desktop.png` e `-mobile.png`, gravados com `METRI_EVIDENCE=<id>`, até a poda da slice (`metri prune`); depois, o git | chat, pasta fora do git |
| Regra que pode ser verificada                  | check, lint, tipo, teste                  | qualquer `.md`                                 |
| Features, slices e o plano ao redor dos tickets | `MATRIX.md`; um board próprio, no futuro, é uma visão que lê e escreve a MATRIX e os tickets pelo formato estrito deles | chat, handoff                                  |
| Cada UC ou T: BRs ou "O que entrega", critérios, status | `.metri/tickets/<id>.md`, a fonte única do ticket | `MATRIX.md`, chat, handoff                     |
| Comportamento já construído                    | testes + código                           | matriz (a slice colapsa numa linha com os donos, `sot:`; o arquivo do ticket fica, com `status: done`) |
| Como um módulo funciona                        | código + cabeçalho inline                 | `docs/`                                        |
| Procedimentos do agente                        | `AGENTS.md` + skills                      | regras de arquitetura                          |

Escada de regras: `skills/guardrail/SKILL.md`, "The rules ladder".

### Interface e Design System

Não é uma etapa própria do fluxo; é uma camada que atravessa as etapas:

- **Moldar:** a triagem de design procura o DS já dado, pergunta só o que falta e propõe os princípios de experiência (`skills/shape/DESIGN-TRIAGE.md`); os tokens do `DESIGN.md` são a fonte do tema.
- **Look across:** critérios de UI por UC, e o que se julga na tela começa com `Tela:`; tela de tipo novo vira ticket `pattern` com 2–3 variantes, e a escolhida vira tela canônica; a slice 0 leva os tokens do `DESIGN.md` ao tema e ao shell do starter, com aprovação visual.
- **Construir:** `frontend/experience`, seed realista e screenshot desktop e mobile por critério `Tela:`, com autocrítica de até 2 rodadas; os textos da interface passam pela skill `humanizer`.
- **Aceitar:** o `reviewer-ux` julga a evidência contra o `DESIGN.md`, e o teste do consumidor usa o navegador; default de UI: `architecture/defaults/ui.md`, o shadcn/ui dentro do `@metri/ui`, com os arquivos da CLI em `components/ui/` e o primitivo importado pelo nome (metri:ADR-0003).

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
2. **Plano:** `skills/look-across/SKILL.md`, "8. Quiz the user".
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
| Forma das skills: pequenas, divididas entre invocadas pelo usuário e pelo modelo, ponteiros, critérios de conclusão, palavras-guia                                                    | Matt Pocock (`writing-for-agents`)       |
| Architecture Source global + Project Architecture por áreas + ADRs                                                                                                                    | Seu modelo                               |
| Caso de uso como unidade de definição, ligando planejamento e código                                                                                                                  | DDD                                      |
| `DESIGN.md` como referência de design para agentes                                                                                                                                    | Formato do getdesign.md (spec do Google) |
| Skill `humanizer`: os sinais de texto gerado por IA e como reescrever sem inventar fato                                                                                               | blader/humanizer (a partir do "Signs of AI writing" da Wikipedia) |
| Starter: o código da fundação que o `metri init` copia num projeto novo                                                                                                                  | Piloto 2 (a agenda), fundação aceita no `/accept` |

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
| Design técnico por feature, sempre  | Fora na v1         | O agente planeja no próprio contexto; padrão novo vira ticket `pattern`; decisão difícil vira ADR. Technical design para features complexas fica para "Evolução futura" |
| Etapa própria de UI/UX              | Fora               | A camada de UI/UX atravessa as etapas ("Interface e Design System"): triagem, telas canônicas, `frontend/experience`, evidência por critério e `reviewer-ux` |
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

Estes itens ainda estão fora do método e são a direção declarada dele. O modelo atual foi desenhado para não bloqueá-los: cada um tem um ponto de extensão preparado (campo opcional ou convenção), e nada do que existe muda de forma quando eles chegarem.

| Item                                            | Já preparado na v1                                                                                                                                                                                         | Evolução                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Plano incremental do produto (V1 → Vn)**      | Campo `milestone` nas features; horizontes `now / planned / fog / out`; releases por milestone                                                                                                             | Visão de roadmap gerada a partir da matriz; skill de planejamento de versões                       |
| **Technical Design para features complexas**    | Ciclo de vida definido: **documento temporário**, cujas decisões migram para ADRs, regras e contratos no aceite, e então ele é removido | Casa, template, critério de quando é obrigatório, skill própria |
| **Board próprio**                               | Formato estrito, legível por máquina, com ids estáveis e chaves em inglês, validado por lint; a MATRIX e os tickets são a fonte única | Um board próprio, sem ferramenta externa: uma visão que lê e escreve a MATRIX e os tickets pelo formato estrito deles |
| **Comunicação entre agentes**                   | Comunicação por artefatos (status, `PP`, `GAP`, `notes`), mediada pelo coordenador                                                                                                                         | Canais ou "rooms"; troca de informação entre workers (nunca repasse de trabalho)                   |
| **Acompanhamento de consumo de tokens**         | Campo `metrics` no ticket, `{ rules, tokens }`, preenchido pelo `/build` no `done`: as regras sempre, os tokens quando a ferramenta expõe o dado | Painel de consumo, orçamentos por agente e por slice                                               |
| **Times de agentes coordenados**                | Papéis de coordenador e worker; matriz como grafo de dependências (`blocked_by`, `touches`); convenção de branches `slice/<id>` e `ticket/<id>`; worktrees                                                 | Orquestrador contínuo (no estilo Sandcastle ou Morphite), orçamentos, notificações                 |

### Validação e melhoria (piloto)

O piloto é interativo: o usuário responde às perguntas dos portões, numa iniciativa real de 2–3 slices, num repositório novo:

1. "Começar um projeto" e `metri init`.
2. `/shape`, com a triagem de design, e `/look-across`.
3. Slice 0: o que falta depois do starter, o banco de desenvolvimento e, com interface, o tema e o shell.
4. 2–3 slices até o `/accept` e um release.

Anotar:

- regras por ticket, pelo `pnpm rules-for --ticket <id>` (meta ≤ 5);
- tokens por ticket, quando a ferramenta mostrar (`metrics` do ticket);
- retrabalho no `/accept`: achados que reabrem UC ou viram T, e os de padrão que um lint teria pego;
- propostas de padrão na construção, contexto buscado fora da cadeia de ponteiros e lições aprovadas por slice;
- os três gatilhos do board próprio: conflito na MATRIX com agentes em paralelo, necessidade de ver ou mostrar o andamento, e linhas ativas da MATRIX depois da poda (o board começa acima de ~300);
- nas perguntas: pergunta sobre algo já definido, inferência errada e pergunta que faltou;
- na interface: a distância entre a tela e o DS.

Os resultados alimentam a próxima versão desta metodologia; o que passar no portão de conhecimento vai ao source (template de código, capacidades condicionais, agents, regras e checks, estes a partir dos itens de "Verificação" sem `(check: <id>)`).
