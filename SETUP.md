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

## ▶ Agora: Fase 1, fundação do repositório

- [x] 1.1 Salvar a metodologia em `methodology/METHODOLOGY.md` e este arquivo em `SETUP.md` (manual)
  - Este arquivo estava em `methodology/SETUP.md`; movido para a raiz no commit do 1.2.
- [x] 1.2 `git init` (se ainda não houver) e primeiro commit do estado atual
  - O repo já existia com o commit `initial commit` (ede1f30), mantido; `git init` não foi rodado.
- [x] 1.3 Criar a estrutura de pastas do source (metodologia, seção 5.3), **sem mover as regras ainda**: `catalog/`, `defaults/`, `methodology/templates/`, `template/`, `adr/`, `skills/`, `CHANGELOG.md`
- [x] 1.4 `AGENTS.md` deste repositório (até ~15 linhas): o que é este repo, onde está a metodologia, que o progresso está em `SETUP.md`

## Fase 2: regras existentes → novo formato (seções 6.2, 6.3 e 7)

- [x] 2.1 Inventário: cada arquivo de regra com área, tema, seções que já tem e classificação **global** ou **específico de projeto**. Saída: tabela no chat para aprovação (não vira arquivo)
  - D1 Stack repetida vira default global (`defaults/stack.md` + ADR global): só a lista `## Stack` do `overview.md` vai para lá; as menções à stack no texto das regras ficam; sem seção "Stack padrão"; outra stack = ADR + regra de projeto.
  - D2 Regras do `overview.md` saem primeiro: layer-first → `backend/`; princípios 6 e 7 e colocação app × pacote → `general/`; Stack → `defaults/stack.md`; caminho da request → template do INDEX de projeto; as extrações movem o texto como ele está, sem reescrever.
  - D3 Capacidades condicionais são globais; a ativação fica no INDEX do projeto.
  - D4 Caso de uso, classe/registro de evento e erro de domínio → `domain/`; adaptador/DI, despacho/subscriber e tradução HTTP → `backend/`; variação de integração → `backend/` ou `infrastructure/`.
  - D5 `frontend/design-system.md` vira exemplo de projeto; o global mantém "só token" e o contrato de tema.
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
- [ ] 2.4 Refinar as demais regras, área por área (7.2), um commit por área, com conferência de citações (METHODOLOGY 7.2)
- [ ] 2.5 Extrair as regras do `overview.md` (D2); destinos dos meta: `README.md` → `INDEX.md` gerado (4.1), `activation.md` → template de INDEX de projeto (3.4), `authoring.md` → absorvido pela metodologia (apagar no fim da fase)
- [ ] 2.6 Pontos em aberto → ADRs `proposed` (D8)
- [ ] 2.7 Organizar pastas por área + `INDEX.md` raiz (decidir também o nome da pasta nos projetos, ex.: `.metri/`)

Lacunas conhecidas (D9), sem regra por enquanto: migrações de banco, CI/deploy, segurança HTTP, error boundary, acessibilidade.

## Fase 3: vocabulário, defaults, catálogo e templates (seções 4.3, 8 e Apêndice A)

- [ ] 3.1 `methodology/VOCABULARY.md`
- [ ] 3.2 `adr/0001-default-ui-library.md` (shadcn/ui) + `defaults/ui.md` + `DESIGN.md` base neutro; `defaults/stack.md` + ADR da stack padrão
- [ ] 3.3 `catalog/design-system.md` + apenas as capacidades que você já reconstrói nos projetos (sem inventar)
- [ ] 3.4 `methodology/templates/`: AGENTS, CONTEXT, PRODUCT, DESIGN, architecture INDEX (com "Caminhos do projeto"), regra, slice, ADR, MATRIX

## Fase 4: scripts (seções 6.11 e 6.13)

- [ ] 4.0 Decidir a linguagem dos scripts (sugestão: TypeScript/Node)
- [ ] 4.1 `rules-index`: gera os `INDEX.md` a partir do frontmatter
- [ ] 4.2 `rules-for`: devolve as regras aplicáveis a caminhos ou a um ticket; soma os "Caminhos do projeto" do INDEX ao `applies_to`
- [ ] 4.3 `docs-lint`: árvore permitida, frontmatter das regras, formato da matriz
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

## Fase 5: skills (seção 16)

- [ ] 5.1 `writing-for-agents` primeiro (adaptada do Matt; é usada para escrever as outras)
- [ ] 5.2 Adaptar do Matt: `grilling`, `tdd`, `research`, `domain-language` (a partir de `domain-modeling`)
- [ ] 5.3 Escrever `guardrail`
- [ ] 5.4 Escrever `/shape`, `/look-across`, `/build`, `/accept`, `/diagnose`
- [ ] 5.5 Decidir como as skills chegam aos projetos (copiar ou vincular de `.architecture-source/skills/`)
- [ ] 5.6 Teste a seco de cada skill com um exemplo pequeno

## Fase 6: release do source

- [ ] 6.1 `CHANGELOG.md` + tag `v1.0.0`
- [ ] 6.2 Apagar este `SETUP.md`

## Fase 7: projeto piloto (outro repositório)

- [ ] 7.1 Criar o repositório e adicionar o source em `.architecture-source/` (submódulo ou pacote, versão fixada)
- [ ] 7.2 Aplicar os templates e criar o `AGENTS.md`
- [ ] 7.3 `/shape` (com triagem de design) → `/look-across`
- [ ] 7.4 Slice 0 (fundação). Se ainda não existir um template de código (block, registry, regras de lint), ele nasce aqui
- [ ] 7.5 2–3 slices até o aceite e um release
- [ ] 7.6 Registrar as métricas do piloto (seção 19)

## Fase 8: melhoria

- [ ] 8.1 Metodologia v1.2 a partir das métricas
- [ ] 8.2 Promover ao source o que passou nos critérios (template de código, catálogo, regras)
