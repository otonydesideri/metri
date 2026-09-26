# SETUP: Slices com Guardrails

Este repositório é o **Architecture Source** (global). O projeto piloto é outro repositório, criado na Fase 7.
Metodologia de referência: `methodology/METHODOLOGY.md` (v1.1.1).

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
  - D1 Stack repetida vira default global (`defaults/stack.md` + ADR global); cada tema num arquivo: regra sem biblioteca + seção opcional "Stack padrão"; outra stack = ADR + regra de projeto.
  - D2 Regras do `overview.md` saem primeiro: layer-first → `backend/`; princípios 6 e 7 e colocação app × pacote → `general/`; Stack → `defaults/stack.md`; caminho da request → template do INDEX de projeto.
  - D3 Capacidades condicionais são globais; a ativação fica no INDEX do projeto.
  - D4 Caso de uso, classe/registro de evento e erro de domínio → `domain/`; adaptador/DI, despacho/subscriber e tradução HTTP → `backend/`; variação de integração → `backend/` ou `infrastructure/`.
  - D5 `frontend/design-system.md` vira exemplo de projeto; o global mantém "só token" e o contrato de tema.
  - D6 Formato final enxuto: cabeçalho Dono de / Consultar antes de / Não cobre vira frontmatter; sem seção de checklist nem de anti-padrões.
  - D7 Exemplos didáticos no global; `examples` aponta para `<tema>.examples.md` e, quando existir, para `template/`; nas regras de projeto, para código real.
  - D8 Pontos em aberto viram ADR `proposed`; "o que a decisão não é" vira alternativas do ADR.
  - D9 Temas faltantes (migrações, CI/deploy, segurança HTTP, error boundary, acessibilidade) não são criados agora.
  - D10 Arquivo principal: meta ~100 linhas; lint (seção 6.13): no máximo 170 linhas, sem contar a `## Árvore de decisão`; código além da forma essencial (~15 linhas) → `<tema>.examples.md`; dividir só partes independentes.
  - D11 `@metri/*` são pacotes do template (globais), não nomes de projeto.
  - D12 Escrita para agentes: imperativo, uma ideia por linha, sem introdução, narrativa nem explicação didática, sem repetir outro arquivo (`read_first`/`not_covered`), termos do vocabulário.
- [x] 2.2 Formato final enxuto (metodologia v1.1.1, seção 7) e mapeamento do formato atual para ele
  - Mapeamento abaixo: uma linha por linha da tabela "Formato atual" do 2.1. Só vale para a migração.

| Formato atual | Destino |
| --- | --- |
| Frontmatter YAML | frontmatter com todas as chaves do esqueleto, criado na conversão; `enforced_by` vazio até o check existir |
| Formato N | esqueleto final, seção a seção pelas linhas abaixo; modalidades mantidas |
| Formato A | esqueleto final: cada H2 temática é desmontada; norma → `## Regras` com modalidade, resto pelas linhas abaixo |
| `Dono de:` | frontmatter `description` (uma linha, começa pelo tema) |
| `Consultar antes de:` | frontmatter `read_first` (ids que a regra pressupõe); as situações do texto → `applies_to` + `keywords` |
| `Não cobre:` | frontmatter `not_covered` (`"<tema> → <id>"`) |
| Introdução não normativa | removido (narrativa, não muda comportamento); frase normativa → `## Regras` |
| Cópia da regra de escape na introdução | removido (pattern proposal já cobre) |
| `## Stack` | `defaults/stack.md` (D1, D2) |
| `## Ferramentas` (status da ferramenta) | DECIDIDA da stack repetida → `defaults/stack.md`; biblioteca de um projeto só → template de projeto; a seção some |
| Árvore de decisão como H2 própria | `## Árvore de decisão` em bullets e setas (Mermaid convertido); a embutida em outra seção sobe para ela |
| `## Regras` com modalidade (`**Obrigatório.**` etc.) | `## Regras`: um bullet por regra, modalidade mantida, condição depois dela, marca `check: <id>` ou `manual` |
| `> **Por quê.**` | linha `Por quê:` sob a regra, só se o motivo não for óbvio; senão removido (óbvio, não muda comportamento) |
| `**Exceção.**` logo abaixo da regra | linha `Exceção:` sob a regra; `(ADR-NNNN)` quando vier de ADR |
| Lista "Regras absolutas" numerada, sem modalidade | `## Regras`, com modalidade e marca em cada item |
| Exemplo de código TS/TSX no domínio didático de pedidos | `<tema>.examples.md` (D7); forma essencial até ~15 linhas → `## Padrão` |
| Exemplo apontando código real | frontmatter `examples`, só em regra de projeto |
| "Pontos-chave:" depois do exemplo | norma → `## Regras`; nota do código → `<tema>.examples.md`; explicação → removido (didático, não muda comportamento) |
| `## Aplicação` | por conteúdo: código e cenário → `<tema>.examples.md`; caso que escolhe ramo → `## Árvore de decisão`; frase normativa sem modalidade → `## Regras`; montagem na stack (Nest, react-router, provider de tema) → `## Stack padrão`; "decisão de projeto" → template de projeto; repetição de outro owner ou explicação → removido (já no owner; didático) |
| `## Anti-padrões` | `## Regras`: `**Proibido.** X; em vez disso, Y.` |
| Checklist de procedimento | removido (passos repetem regras dos owners); passo só da stack → `## Stack padrão` |
| Seção de testes do tema (`## Testes` ou `### Spec`) | norma de teste do tema → `## Regras`; formato de spec → `read_first` da regra de testing; receita → `<tema>.examples.md` |
| `## Verificação` (perguntas ou comandos) | pergunta → marca `manual` na regra que ela confere; comando → candidato a check (Fase 4), `manual` até existir, depois `check:` + `enforced_by`; a seção some |
| `## Verificação rápida` | igual a `## Verificação` |
| Pontos em aberto | ADR `proposed` (D8): pergunta → Contexto, "vale até fechar" → Decisão; a regra cita em `adr` |
| `## Referências` | frontmatter `read_first` ou `not_covered`; menção só informativa → removido (ponteiro sem efeito) |
| Navegação (Como ler, Índice, Onde cada arquivo mora) | removido: Como ler e Índice (INDEX gerado do frontmatter); Onde cada arquivo mora (duplica caminhos dos owners) |

- [ ] 2.3 Piloto: converter `backend/http-api.md` (formato N) e `frontend/components.md` (formato A); revisão humana com contagem de linhas antes e depois
- [ ] 2.4 Converter as demais regras área por área, aplicando D4, D10 e D12 (um commit por área)
- [ ] 2.5 Extrair as regras do `overview.md` (D2); destinos dos meta: `README.md` → `INDEX.md` gerado (4.1), `activation.md` → template de INDEX de projeto (3.4), `authoring.md` → absorvido pela metodologia (apagar no fim da fase)
- [ ] 2.6 Pontos em aberto → ADRs `proposed` (D8)
- [ ] 2.7 Organizar pastas por área + `INDEX.md` raiz (decidir também o nome da pasta nos projetos, ex.: `.metri/`)

Lacunas conhecidas (D9), sem regra por enquanto: migrações de banco, CI/deploy, segurança HTTP, error boundary, acessibilidade.

## Fase 3: vocabulário, defaults, catálogo e templates (seções 4.3, 8 e Apêndice A)

- [ ] 3.1 `methodology/VOCABULARY.md`
- [ ] 3.2 `adr/0001-default-ui-library.md` (shadcn/ui) + `defaults/ui.md` + `DESIGN.md` base neutro; `defaults/stack.md` + ADR da stack padrão
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
