# SETUP: Slices com Guardrails

Este repositório é o **Architecture Source** (global). O projeto piloto é outro repositório, criado na Fase 7.
Metodologia de referência: `methodology/METHODOLOGY.md` (v1.1).

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
- [ ] 1.4 `AGENTS.md` deste repositório (até ~15 linhas): o que é este repo, onde está a metodologia, que o progresso está em `SETUP.md`

## Fase 2: regras existentes → novo formato (seções 6.2, 6.3 e 7)

- [ ] 2.1 Inventário: cada arquivo de regra com área, tema, seções que já tem e classificação **global** ou **específico de projeto**. Saída: tabela no chat para aprovação (não vira arquivo)
- [ ] 2.2 Mapeamento: como as seções do formato atual encaixam no esqueleto da seção 7 (decisão em uma linha aqui)
- [ ] 2.3 Piloto de formato: converter 2 regras (uma de backend, uma de frontend) e revisar
- [ ] 2.4 Converter as demais regras, área por área (um commit por área)
- [ ] 2.5 Tirar do global o que for específico de projeto (guardar como exemplo para os templates de projeto)
- [ ] 2.6 Pastas por área + `INDEX.md` raiz

## Fase 3: vocabulário, defaults, catálogo e templates (seções 4.3, 8 e Apêndice A)

- [ ] 3.1 `methodology/VOCABULARY.md`
- [ ] 3.2 `adr/0001-default-ui-library.md` (shadcn/ui) + `defaults/ui.md` + `DESIGN.md` base neutro
- [ ] 3.3 `catalog/design-system.md` + apenas as capacidades que você já reconstrói nos projetos (sem inventar)
- [ ] 3.4 `methodology/templates/`: AGENTS, CONTEXT, PRODUCT, DESIGN, architecture INDEX, regra, slice, ADR, MATRIX

## Fase 4: scripts (seções 6.11 e 6.13)

- [ ] 4.0 Decidir a linguagem dos scripts (sugestão: TypeScript/Node)
- [ ] 4.1 `rules-index`: gera os `INDEX.md` a partir do frontmatter
- [ ] 4.2 `rules-for`: devolve as regras aplicáveis a caminhos ou a um ticket
- [ ] 4.3 `docs-lint`: árvore permitida, frontmatter, seções obrigatórias, formato da matriz
- [ ] 4.4 `verify`: agrega os checks
- [ ] 4.5 Rodar tudo neste repositório até ficar verde

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
