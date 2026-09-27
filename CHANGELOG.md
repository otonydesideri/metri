# Changelog

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
