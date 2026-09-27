# Changelog

## v1.1.0 (2026-09-27)

Correções do piloto: idioma da conversa, um arquivo por ticket, a primeira visão do board próprio e limpeza de
nomes fictícios.

### O que muda

- **Idioma.** `AGENTS-TEMPLATE.md` fixa pt-BR como língua padrão da conversa (`skills/setup/AGENTS-TEMPLATE.md`);
  as skills que perguntam ou reportam ao usuário (`setup`, `shape`, `look-across`, `build`, `accept`, `diagnose`,
  `grilling`, `domain-language`) passam a dizer "Ask and report in the user's language set in AGENTS.md (pt-BR by
  default)". `/setup` usa pt-BR desde a primeira pergunta, antes de o `AGENTS.md` existir. `/setup` termina
  apontando para `/shape` (produto, termos e, com interface, `docs/DESIGN.md`); a pergunta de ativação de
  `defaults/ui` diz o mesmo.
- **Source somente leitura.** `AGENTS.md` do source abre avisando que, montado como `.metri/` num projeto, é
  referência somente leitura: o agente segue o `AGENTS.md` do projeto. README, "Evolução futura", ganha a linha
  de distribuição enxuta (só skills, regras e scripts, sem o resto do source).
- **Um arquivo por ticket.** Cada UC ou T agora é `docs/plan/tickets/<id>.md`, com frontmatter YAML (`id`,
  `title`, `feature`/`actor` no UC, `slice`, `type` no T, `status`, `mode`, `blocked_by`, `areas`, `touches`,
  `sensitive`, `checks`, `subtasks`, `metrics`) e corpo em português ("Regras de negócio" ou "O que entrega",
  "Critérios", "Notas"). `docs/plan/MATRIX.md` fica só com o plano: features (com a lista `ucs`), slices, Fog,
  Gaps e Pattern proposals. Um ticket concluído fica no arquivo dele, `status: done`; só a slice concluída
  colapsa na MATRIX. Formato: `skills/look-across/MATRIX-FORMAT.md`, "Ticket files". `shape`, `look-across`,
  `build`, `accept` e `diagnose` leem e escrevem o arquivo do ticket; `rules-for --ticket` lê o frontmatter dele;
  `docs-lint` valida a árvore, o nome do arquivo, o frontmatter e as referências cruzadas com a MATRIX.
- **Visão da matriz.** `matrix-view` gera, no topo da MATRIX, entre `<!-- matrix-view -->` e
  `<!-- /matrix-view -->`, a tabela features × slices (ids dos tickets e um marcador de status por célula) e um
  grafo Mermaid de `blocked_by`; `matrix-view:check` entra no `verify`. É a primeira versão do board próprio
  (README, "Evolução futura").
- **Nomes negados.** Removida toda menção ao pacote fictício `@metri/contracts`; onde fazia falta falar dele, o
  texto diz "o pacote do contrato de API, escolhido pelo projeto" (ou o equivalente em inglês nas skills). Outros
  nomes concretos inexistentes negados no texto ganharam a forma positiva.
- **`.gitignore`.** `/setup` cria um, quando o projeto ainda não tem: `node_modules/`, `.env*` (com
  `!.env.example`), `dist/`, `.turbo/` e `coverage/`.

### Migrar de v1.0.0

Ticket `pattern`: checkout de `v1.1.0` em `.metri/`, depois, em `docs/plan/MATRIX.md`:

1. Para cada bloco `#### UC<f>.<n>` ou `#### T<s>.<n>`, criar `docs/plan/tickets/<id>.md`: as chaves da linha
   viram frontmatter YAML (um comando com `` ` `` vira string entre aspas, ex.: `["`pnpm verify`"]`); o `what` do
   T vira a seção "O que entrega"; os itens `- BR<n>: ...` (UC) e `- [ ] ...` viram "Regras de negócio" e
   "Critérios"; `notes`, quando houver, vira "Notas". Um UC concluído e podado (`status: done → <arquivo>`) vira
   `status: done`, sem a seta.
2. Em cada feature, trocar o bloco de UCs pela chave `ucs: [<ids>]` com os ids de todos os UCs dela.
3. Rodar `pnpm matrix-view` para gerar a visão no topo da MATRIX, e `pnpm verify` até ficar verde.

## v1.0.0 (2026-09-27)

Primeira versão do Architecture Source da metodologia Slices com Guardrails.

### O que traz

- **Regras** (`architecture/`, 42 regras, cada uma com frontmatter e `INDEX.md` de área gerado): `general/` (3), `backend/` (14), `domain/` (7), `frontend/` (9) e `infrastructure/` (7). As capacidades condicionais (`backend/async-jobs`, `infrastructure/cache`, `infrastructure/mail`, `infrastructure/observability`, `infrastructure/storage` e `defaults/ui`) levam a pergunta de ativação na chave `activation`, listada em `architecture/INDEX.md`, "Capacidades condicionais".
- **Defaults** (`architecture/defaults/`): `stack.md`, a stack padrão, e `ui.md`, shadcn/ui dentro do `@metri/ui`.
- **ADR global**: `adr/0001-default-ui-library.md`, que sustenta o default de UI.
- **Skills** (`skills/`, 12): chamadas pelo usuário, `/setup`, `/shape`, `/look-across`, `/build`, `/accept` e `/diagnose`; chamadas pelo modelo, `grilling`, `domain-language`, `guardrail`, `tdd`, `research` e `writing-for-agents`. Cada skill leva o formato do que escreve; `VOCABULARY.md` fixa as chaves canônicas.
- **Scripts** (`template/scripts/`, TypeScript com `tsx`, sem build): `verify`, `rules-for`, `rules-index` (com `--check`) e `docs-lint`, no modo source e no modo projeto, com a árvore fechada de `docs/` e o formato da MATRIX. Cada script explica o que faz em `--help`.
- **Testes**: Vitest sobre uma fixture de projeto (`template/scripts/__fixtures__/project/`), com `pnpm test`; `pnpm verify` roda docs-lint, rules-index:check e os testes.

### Fixar a versão num projeto

O source entra como submódulo em `.metri/`, numa tag, somente leitura:

```bash
git submodule add <url-do-source> .metri
git -C .metri checkout v1.0.0
git add .metri
```

O `/setup` registra a tag em `docs/architecture/INDEX.md` (`source: .metri@v1.0.0`) e liga as skills e os scripts; os passos completos estão no `README.md`, "Começar um projeto". Trocar de versão é um ticket `pattern`: checkout da tag nova em `.metri/`, a partir das entradas deste arquivo entre as duas versões.

### Atribuição

Onze skills são adaptadas de [mattpocock/skills](https://github.com/mattpocock/skills), de Matt Pocock, no commit `c55ee46073ed923f86ce59a5eb3b6d895095d1b7`, sob licença MIT: `grilling`, `domain-language`, `tdd`, `research`, `writing-for-agents`, `setup`, `shape`, `look-across`, `build`, `accept` e `diagnose`. Cada uma abre com a linha "Adapted from mattpocock/skills@c55ee46… (MIT)"; a licença está em `skills/THIRD-PARTY-LICENSES.md`.
