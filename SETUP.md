# SETUP: Slices com Guardrails

Este repositório é o **Architecture Source** (global). O projeto piloto é outro repositório, criado na Fase 7.
Metodologia de referência: `methodology/METHODOLOGY.md` (v1.1.2).

## Como usar

- Toda sessão do Claude Code começa lendo este arquivo e **só** a seção da metodologia citada no passo.
- Um passo por vez. Ao final de cada passo, commit com o número do passo na mensagem (ex.: `setup(2.1): inventário das regras`).
- Marque `[x]` e, se houve decisão, anote em uma linha logo abaixo do passo. Nada de relatório.
- Arquivo temporário: é apagado quando o source chegar à v1.0.0 (passo 6.2).

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
  - D8 Pontos em aberto viram ADR `proposed`; "o que a decisão não é" vira alternativas do ADR.
  - D9 Temas faltantes (migrações, CI/deploy, segurança HTTP, error boundary, acessibilidade) não são criados agora.
  - D10 Revogada: não há limite de linhas.
  - D11 `@metri/*` são pacotes do template (globais), não nomes de projeto.
  - D12 Escrita para agentes, só em texto novo (skills, templates, regras novas): imperativo, uma ideia por linha, sem introdução, narrativa nem explicação didática, sem repetir outro arquivo (`read_first`/`not_covered`), termos do vocabulário.
- [x] 2.2 Formato das regras (metodologia, seção 7) e mapeamento do formato atual para ele
  - Mapeamento: METHODOLOGY 7.2
- [x] 2.3 Piloto de refinamento: http-api e components
  - use_when = Consultar antes de; chave vazia não é escrita; Caminhos do projeto no INDEX
- [x] 2.4 Refinar as demais regras, área por área (7.2), um commit por área, com conferência de citações (METHODOLOGY 7.2)
- [x] 2.5 Extrair as regras do `overview` (D2); destinos dos meta: `README.md` → `INDEX.md` gerado (4.1), `activation` → template de INDEX de projeto (3.4), `authoring` → absorvido pela metodologia (apagar no fim da fase)
  - overview → `backend/layers`, `general/{overview,code-placement,http-surface,principles}`, `defaults/stack` e o template de INDEX; activation → `methodology/templates/architecture-INDEX.md`; authoring → `methodology/authoring.md`; design-system → `methodology/templates/examples/`; destinos `project:` no frontmatter.
- [x] 2.6 Pontos em aberto → ADRs `proposed` (D8)
  - ADR-0001 a ADR-0019, um por ponto; na regra fica "Em aberto: <título> (ADR-NNNN)" e o id vai em `adr`.
- [x] 2.7 Organizar pastas por área + `INDEX.md` raiz (decidir também o nome da pasta nos projetos, ex.: `.metri/`)
  - Source montado em `.metri/`; `defaults/` → `architecture/defaults/` (ids iguais); `general/overview` e `architecture/README` absorvidos pela parte à mão de `architecture/INDEX.md`; token e tema → `frontend/theming`; `INDEX.md` gerados (4.0 e 4.1 adiantados).

Lacunas conhecidas (D9), sem regra por enquanto: migrações de banco, CI/deploy, segurança HTTP, error boundary, acessibilidade.

## ▶ Agora: Fase 3, vocabulário, defaults, catálogo e templates (seções 4.3, 8 e Apêndice A)

- [ ] 3.1 `methodology/VOCABULARY.md`
- [ ] 3.2 ADR `default-ui-library` (shadcn/ui) + `architecture/defaults/ui.md` + `DESIGN.md` base neutro; ADR `stack` para `architecture/defaults/stack.md`, que já existe (os dois ADRs pegam os próximos números livres de `adr/`)
- [ ] 3.3 `catalog/design-system.md` + apenas as capacidades que você já reconstrói nos projetos (sem inventar)
- [ ] 3.4 `methodology/templates/`: AGENTS, CONTEXT, PRODUCT, DESIGN, regra, slice, ADR, MATRIX (o de architecture INDEX, com "Caminhos do projeto", já existe desde o 2.5); aqui se decide o formato de `methodology/templates/examples/design-system.md`

## Fase 4: scripts (seções 6.11 e 6.13)

- [x] 4.0 Decidir a linguagem dos scripts (sugestão: TypeScript/Node)
  - TypeScript com tsx, sem build; `package.json` na raiz, com pnpm; scripts em `template/scripts/`.
- [x] 4.1 `rules-index`: gera os `INDEX.md` a partir do frontmatter
  - `pnpm rules-index` gera; `pnpm rules-index:check` sai com 1 se algum INDEX estiver desatualizado.
- [ ] 4.2 `rules-for`: devolve as regras aplicáveis a caminhos ou a um ticket; soma os "Caminhos do projeto" do INDEX ao `applies_to`
- [ ] 4.3 `docs-lint`: árvore permitida, frontmatter das regras, formato da matriz
  - Parte do source feita; faltam a árvore do projeto, o formato da matriz e o aviso de `applies_to` sem casamento.
- [ ] 4.4 `verify`: agrega os checks
- [ ] 4.5 Rodar tudo neste repositório até ficar verde

Checks candidatos (item de verificação sem check até o check existir; depois o id entra em `enforced_by`):

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
- frontend/components: `EmptyState` exige ação de saída no tipo das props
- frontend/components: nenhum import nomeado de `@metri/ui/components/ui/*`; só `import * as`

## Fase 5: skills (seção 16)

- [ ] 5.1 `writing-for-agents` primeiro (adaptada do Matt; é usada para escrever as outras)
- [ ] 5.2 Adaptar do Matt: `grilling`, `tdd`, `research`, `domain-language` (a partir de `domain-modeling`)
- [ ] 5.3 Escrever `guardrail`
- [ ] 5.4 Escrever `/shape`, `/look-across`, `/build`, `/accept`, `/diagnose`
- [ ] 5.5 Decidir como as skills e os scripts chegam aos projetos
- [ ] 5.6 Teste a seco de cada skill com um exemplo pequeno

## Fase 6: release do source

- [ ] 6.1 `CHANGELOG.md` + tag `v1.0.0`
- [ ] 6.2 Apagar este `SETUP.md`

## Fase 7: projeto piloto (outro repositório)

- [ ] 7.1 Criar o repositório e adicionar o source em `.metri/` (submódulo ou pacote, versão fixada)
- [ ] 7.2 Aplicar os templates e criar o `AGENTS.md`
- [ ] 7.3 `/shape` (com triagem de design) → `/look-across`
- [ ] 7.4 Slice 0 (fundação). Se ainda não existir um template de código (block, registry, regras de lint), ele nasce aqui
- [ ] 7.5 2–3 slices até o aceite e um release
- [ ] 7.6 Registrar as métricas do piloto (seção 19)

## Fase 8: melhoria

- [ ] 8.1 Metodologia v1.2 a partir das métricas
- [ ] 8.2 Promover ao source o que passou nos critérios (template de código, catálogo, regras)
