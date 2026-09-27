# SETUP: Slices com Guardrails

Este repositório é o **Architecture Source** (global). O projeto piloto é outro repositório, criado na Fase 7.
Metodologia de referência: `methodology/METHODOLOGY.md` (v1.1.3).

## Como usar

- Toda sessão do Claude Code começa lendo este arquivo e **só** a seção da metodologia citada no passo.
- Um passo por vez. Ao final de cada passo, commit com o número do passo na mensagem (ex.: `setup(2.1): inventário das regras`).
- Marque `[x]` e, se houve decisão, anote em uma linha logo abaixo do passo. Nada de relatório.
- Arquivo temporário: é apagado quando o source chegar à v1.0.0 (passo 6.2).

## Estado final (alvo)

```text
source (montado em .metri/ no projeto)
  README.md  AGENTS.md  CLAUDE.md  CHANGELOG.md
  architecture/  adr/  skills/  template/

projeto
  AGENTS.md  CLAUDE.md  .metri/
  docs/  PRODUCT.md  CONTEXT.md  DESIGN.md  architecture/INDEX.md  adr/  plan/MATRIX.md
  código: o contrato de cada slice construída, no cabeçalho do entry
```

---

## ✅ Feito

- [x] Pesquisa das referências (Matt Pocock e WebProdigios)
- [x] Metodologia consolidada (v1.1)
- [x] Arquivos de arquitetura existentes colocados no repositório

## Fase 1: fundação do repositório

- [x] 1.1 Salvar a metodologia em `methodology/METHODOLOGY.md` e este arquivo em `SETUP.md` (manual)
  - Este arquivo estava em `methodology/SETUP.md`; movido para a raiz no commit do 1.2.
- [x] 1.2 `git init` (se ainda não houver) e primeiro commit do estado atual
  - O repo já existia com o commit `initial commit` (ede1f30), mantido; `git init` não foi rodado.
- [x] 1.3 Criar a estrutura de pastas do source (metodologia, seção 5.3), **sem mover as regras ainda**: `catalog/`, `defaults/`, `methodology/templates/`, `template/`, `adr/`, `skills/`, `CHANGELOG.md`
- [x] 1.4 `AGENTS.md` deste repositório (até ~15 linhas): o que é este repo, onde está a metodologia, que o progresso está em `SETUP.md`

## Fase 2: regras existentes → novo formato (seções 6.2, 6.3 e 7)

Fase 2 fechada: decisões P1 a P8 aplicadas, docs-lint sem erro e rules-index:check verde.

- [x] 2.1 Inventário: cada arquivo de regra com área, tema, seções que já tem e classificação **global** ou **específico de projeto**. Saída: tabela no chat para aprovação (não vira arquivo)
  - D1 Stack repetida vira default global (`architecture/defaults/stack.md` + ADR global): só a lista `## Stack` do `overview` vai para lá; as menções à stack no texto das regras ficam; sem seção "Stack padrão"; outra stack = ADR + regra de projeto.
  - D2 Regras do `overview` saem primeiro: layer-first → `backend/`; princípios 6 e 7 e colocação app × pacote → `general/`; Stack → `architecture/defaults/stack.md`; caminho da request → template do INDEX de projeto; as extrações movem o texto como ele está, sem reescrever.
  - D3 Capacidades condicionais são globais; a ativação fica no INDEX do projeto.
  - D4 Revogada: a posse de cada tema é definida pela `description` de cada arquivo (antes: Caso de uso, classe/registro de evento e erro de domínio → `domain/`; adaptador/DI, despacho/subscriber e tradução HTTP → `backend/`; variação de integração → `backend/` ou `infrastructure/`).
  - D5 O `design-system` do frontend vira exemplo de projeto; o global mantém "só token" e o contrato de tema.
  - D6 Regras existentes são refinadas, não reescritas (METHODOLOGY 7.2).
  - D7 Exemplos didáticos no global; só a implementação completa vai para `<tema>.examples.md` (METHODOLOGY 7.2, item 2); `examples` aponta para ele e, quando existir, para `template/`; nas regras de projeto, para código real.
  - D8 Revogada por D13 (antes: pontos em aberto viram ADR `proposed`; "o que a decisão não é" vira alternativas do ADR).
  - D9 Temas faltantes (migrações, CI/deploy, segurança HTTP, error boundary, acessibilidade) não são criados agora.
  - D10 Revogada: não há limite de linhas.
  - D11 `@metri/*` são pacotes do template (globais), não nomes de projeto.
  - D12 Escrita para agentes, só em texto novo (skills, templates, regras novas): imperativo, uma ideia por linha, sem introdução, narrativa nem explicação didática, sem repetir outro arquivo (`read_first`/`not_covered`), termos do vocabulário.
  - D13 ADR só com decisão tomada, difícil de reverter, surpreendente e com trade-off real; pergunta em aberto fica na regra, na seção "Em aberto".
  - D14 A pergunta de ativação de capacidade condicional é a chave `activation` da regra dona; o que fica para o projeto é `not_covered` → `project:`; `catalog/` sai.
  - D15 O contrato de slice é um bloco da slice na MATRIX enquanto ela é plano e, depois do primeiro ticket construído, o cabeçalho do `entry` no código.
  - D16 Regra e template não citam a METHODOLOGY; o `docs-lint` barra.
  - D17 Os templates vão para as skills donas na Fase 5.
- [x] 2.2 Formato das regras (metodologia, seção 7) e mapeamento do formato atual para ele
  - Mapeamento: METHODOLOGY 7.2
- [x] 2.3 Piloto de refinamento: http-api e components
  - use_when = Consultar antes de; chave vazia não é escrita; Caminhos do projeto no INDEX
- [x] 2.4 Refinar as demais regras, área por área (7.2), um commit por área, com conferência de citações (METHODOLOGY 7.2)
- [x] 2.5 Extrair as regras do `overview` (D2); destinos dos meta: `README.md` → `INDEX.md` gerado (4.1), `activation` → template de INDEX de projeto (3.4), `authoring` → absorvido pela metodologia (apagar no fim da fase)
  - overview → `backend/layers`, `general/{overview,code-placement,http-surface,principles}`, `defaults/stack` e o template de INDEX; activation → `methodology/templates/architecture-INDEX.md`; authoring → `methodology/authoring.md`; design-system → `methodology/templates/examples/`; destinos `project:` no frontmatter.
- [x] 2.6 Pontos em aberto → ADRs `proposed` (D8)
  - ADR-0001 a ADR-0019, um por ponto; na regra fica "Em aberto: <título> (ADR-NNNN)" e o id vai em `adr`. Revertido na Fase 3 (D13).
- [x] 2.7 Organizar pastas por área + `INDEX.md` raiz (decidir também o nome da pasta nos projetos, ex.: `.metri/`)
  - Source montado em `.metri/`; `defaults/` → `architecture/defaults/` (ids iguais); `general/overview` e `architecture/README` absorvidos pela parte à mão de `architecture/INDEX.md`; token e tema → `frontend/theming`; `INDEX.md` gerados (4.0 e 4.1 adiantados).

Lacunas conhecidas (D9), sem regra por enquanto: migrações de banco, CI/deploy, segurança HTTP, error boundary, acessibilidade.

## Fase 3: vocabulário, defaults, catálogo e templates (seções 4.3, 8 e Apêndice A)

Fase 3 fechada: decisões pendentes resolvidas, docs-lint sem erro e rules-index:check verde.

- [x] 3.1 `methodology/VOCABULARY.md`
  - Texto da 4.3 movido sem reescrever; a 4.3 virou ponteiro; modalidades ficam em `methodology/authoring.md`.
- [x] 3.2 ADR `default-ui-library` (shadcn/ui) + `architecture/defaults/ui.md` + `DESIGN.md` base neutro; ADR `stack` para `architecture/defaults/stack.md`, que já existe (os dois ADRs pegam os próximos números livres de `adr/`)
  - ADR-0020 (shadcn/ui dentro do `@metri/ui`, compound por re-export, um só formato de import; AlignUI sai) e ADR-0021 (depois o ADR-0020 virou ADR-0001, e o ADR-0021 saiu: o `stack.md` é o registro); o `DESIGN.md` base é o próprio `template/docs/DESIGN.md`, no formato da especificação do Google.
- [x] 3.3 `catalog/design-system.md` + apenas as capacidades que você já reconstrói nos projetos (sem inventar)
  - design-system, async-jobs, mail, storage, cache e observability; `catalog/INDEX.md` gerado; as linhas delas saíram da matriz de ativação. `catalog/` saiu depois (D14).
- [x] 3.4 Starter em `template/`
  - Cada arquivo no caminho que terá no projeto (`AGENTS.md`, `CLAUDE.md`, `docs/`); regra, slice e ADR voltam ao Apêndice A; a ativação vai para a METHODOLOGY 6.14; o exemplo de regra de design system sai.

Decisões da fase (aplicadas):

- Notificação: o re-export do Sonner expõe o `toast` (`Sonner.toast.error(title, { description })`); `NotificationProvider` e `notification()` saem.
- Tema: o next-themes é o provider de tema do `@metri/ui` (`attribute="class"`, `light` e `dark`, `enableSystem={false}`); o Sonner gerado funciona sem wrapper.
- Style: `new-york` e `baseColor` `neutral` no `components.json`; os `exports` expõem de componente só `components/ui/*`; o app não importa o arquivo gerado.
- Tipografia e espaçamento: `--font-sans`, `--font-mono` e os níveis de texto do `DESIGN.md` no `@theme`; espaçamento na escala padrão do Tailwind.
- Ajuste que o token não resolve: wrapper no arquivo de re-export, com o gerado intocado e os mesmos nomes de parte.
- `EmptyState` sai: as telas usam o `Empty` do `@metri/ui`, e o `LoadErrorState` é composto sobre ele; o qualificador de rótulo é texto dentro do `Field.Label`.
- INDEX do projeto: guarda o estado vigente (ativação, delegações, desvios) e aponta para o ADR; `methodology/authoring.md` alinhado.
- Vocabulário visual das telas: no `DESIGN.md` (`not_covered` de `defaults/ui`); o catálogo, que o punha em regra de projeto, saiu.
- Script inline do tema: fica no `index.html` do `app-web` e lê a mesma chave de armazenamento que o `ThemeProvider` (next-themes) usa (`defaults/ui.md`, `frontend/theming.md`).
- `exports` × arquivos gerados: os imports internos do `@metri/ui` usam o campo `imports` com aliases `#`, e os aliases do `components.json` apontam para eles; os `#` resolvem no shadcn, no TypeScript e no Vite, e os `exports` ficam só com `components/ui/*` (`defaults/ui.md`).
- `cn`: `extendTailwindMerge`, com os níveis de texto do `DESIGN.md` como tamanho de fonte (`defaults/ui.md`).
- Cabeçalho de contrato de slice: os rótulos seguem o idioma dos comentários de `defaults/stack.md` (A.7).
- Caminho de uma request: o diagrama e os bullets saíram do template do INDEX para `backend/layers.md`, "O caminho de uma request"; o INDEX do projeto guarda só os desvios, com ADR.

## ▶ Agora: Fase 4, scripts (seções 6.11 e 6.13)

- [x] 4.0 Decidir a linguagem dos scripts (sugestão: TypeScript/Node)
  - TypeScript com tsx, sem build; `package.json` na raiz, com pnpm; scripts em `template/scripts/`.
- [x] 4.1 `rules-index`: gera os `INDEX.md` a partir do frontmatter
  - `pnpm rules-index` gera; `pnpm rules-index:check` sai com 1 se algum INDEX estiver desatualizado.
- [x] 4.2 `rules-for`: `applies_to` e "Caminhos do projeto" do INDEX; cerca de 5 regras por ticket
  - Testes em Vitest com a fixture `template/scripts/__fixtures__/project/`, cujo `.metri/architecture` é symlink para o `architecture/` deste repositório; substituição de regra global: linha em "Exceções e defaults trocados" com o id, "substitu" e o ADR.
- [x] 4.3 `docs-lint` no projeto: árvore fechada do `docs/` e formato da matriz
  - A parte do source está feita; o aviso de `applies_to` sem casamento (METHODOLOGY 6.13) entra aqui.
  - Modo pela presença de `.metri/`; a lista de checagens saiu da 6.13 para o `--help`. O aviso de `applies_to` sem casamento vale para as regras do projeto e para "Caminhos do projeto"; `docs/plan/tech/` fica fora da árvore até ser usada; slice em construção (`horizon` com `entry`, sem `contract`) é válida (A.7).
- [x] 4.4 `verify`: roda os checks do projeto
  - docs-lint e rules-index:check pelos scripts irmãos (não dependem do `package.json`); typecheck, lint e test por `pnpm run`, se existirem; a saída do check que falha vem abaixo da linha dele.

Os demais checks candidatos ficam para a Fase 8, depois do piloto.

## Fase 5: skills (seção 16)

- [ ] 5.1 Adaptar do Matt: `grilling`, `tdd`, `research`, `writing-for-agents` (recebe o `methodology/authoring.md`) e `domain-language` (a partir de `domain-modeling`, com o formato do `CONTEXT.md`)
- [ ] 5.2 Escrever as nossas: `guardrail`, `/setup`, `/shape`, `/look-across`, `/build`, `/accept` (portão de conhecimento e ADR) e `/diagnose`; cada skill leva o formato do que escreve, e os formatos saem de `template/` e do Apêndice A:
  - `/setup`: `template/AGENTS.md`, `template/CLAUDE.md` e `template/docs/architecture/INDEX.md`, com as classes de ativação e as delegações (hoje na METHODOLOGY 6.14);
  - `/shape`: `template/docs/PRODUCT.md` e `template/docs/DESIGN.md`;
  - `/look-across`: `template/docs/plan/MATRIX.md` e o contrato de slice (A.7);
  - `domain-language` (5.1): `template/docs/CONTEXT.md`;
  - `template/` fica com o código do starter e os scripts.
- [ ] 5.3 Teste a seco de cada skill
- [ ] 5.4 Decidir se o `methodology/VOCABULARY.md` fica ou é absorvido pelos formatos das skills
- [ ] 5.5 A METHODOLOGY vira `README.md` (porquê, princípios, limiares, mapa e referências), e `methodology/` é apagada
- [ ] 5.6 Decidir como skills e scripts chegam aos projetos

## Fase 6: release do source

- [ ] 6.1 `CHANGELOG.md` + tag `v1.0.0`
- [ ] 6.2 Apagar este `SETUP.md`

## Fase 7: projeto piloto (outro repositório)

- [ ] 7.1 Criar o repositório e adicionar o source em `.metri/` (submódulo ou pacote, versão fixada)
- [ ] 7.2 Rodar `/setup`
- [ ] 7.3 `/shape` (com triagem de design) → `/look-across`
- [ ] 7.4 Slice 0 (fundação). Se ainda não existir um template de código (block, registry, regras de lint), ele nasce aqui; os exemplos canônicos passam para o código do starter e os `.examples.md` viram ponteiro
- [ ] 7.5 2–3 slices até o aceite e um release
- [ ] 7.6 Registrar as métricas do piloto (seção 19)

## Fase 8: melhoria

- [ ] 8.1 Metodologia v1.2 a partir das métricas
- [ ] 8.2 Promover ao source o que passou nos critérios (template de código, capacidades condicionais, regras)
- [ ] 8.3 Checks candidatos (item de verificação sem check até o check existir; depois o id entra em `enforced_by`):
  - backend/http-api: cada `*.controller.ts` em `controllers/<módulo>/` tem uma classe com um único handler de rota
  - backend/http-api: nenhum `@Param('<campo>')`; só `@Param()` tipado por DTO
  - backend/http-api: todo `z.string()` de schema de request tem `.max()`
  - backend/http-api: nenhum `z.uuidv4()`
  - backend/http-api: retorno do controller não é entidade de domínio (tipo) e passa por `<agregado>.presenter.ts`
  - backend/http-api: corpo de resposta sem chave `data` no topo, fora de `PaginatedResult` (teste e2e)
  - backend/http-api: erro de validação, rota inexistente e throttler saem no envelope com `type` em `ApiErrorType` (teste e2e)
  - backend/http-api: nenhum pacote `@metri/contracts` no workspace
  - backend/http-api: o app não declara constante de limite (`*_MIN_LENGTH`, `*_MAX_LENGTH`) que o contrato exporta
  - frontend/components: todo hook antes do primeiro retorno (Biome `useHookAtTopLevel`)
  - frontend/components: um componente por `.tsx`, salvo compound com bloco `export { X as Root, ... }` (spec de estrutura)
  - frontend/components: nenhum `cond ? null : <X />`
  - frontend/components: handler local `handle*` e prop de callback `on*`
  - frontend/components: booleanos com prefixo `is`, `has`, `can` ou `should`
  - frontend/components: `LoadErrorState` exige `onRetry` no tipo das props
  - frontend/components: nenhum import nomeado de `@metri/ui/components/ui/*`; só `import * as`
  - frontend/components: nenhum import de `packages/ui/src/shadcn/` no app, por caminho relativo ou pelo pacote
  - contrato de slice: o arquivo de entrada de uma slice construída tem o cabeçalho de contrato
  - matriz: todo `GAP-n` do código existe na seção Gaps da matriz, e vice-versa
  - opcional: sinônimos proibidos do `CONTEXT.md` ausentes dos identificadores
  - opcional: nenhum valor fixo de cor ou espaçamento fora do tema
