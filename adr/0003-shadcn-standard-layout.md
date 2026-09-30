# ADR-0003 Biblioteca de UI padrão no layout do shadcn

status: accepted
area: defaults
kind: decision

## Contexto

- O kit padrão da metodologia é o shadcn/ui (ADR-0001), instalado e estilizado por tokens de tema conforme o `DESIGN.md` (`architecture/defaults/ui.md`).
- Na versão 1.2, o `@metri/ui` guardava o arquivo da CLI em `src/shadcn/`, resolvia os imports internos pelo campo `imports` (`#`) e expunha cada primitivo em compound, por um arquivo de re-export, consumido com `import * as`.
- No piloto 2, a CLI gravou o `cn` do pacote npm homônimo no lugar do `cn` do kit, que conhece os níveis de texto do tema (PP-3): desde 03/09/2026 o registry do shadcn importa o `cn` desse pacote, com qualquer alias `utils`; o re-export dobrava o número de arquivos por componente e afastava o código do que a documentação do shadcn mostra.

## Decisão

- O shadcn/ui é instalado dentro do `@metri/ui`, pelo caminho manual de monorepo do shadcn, no layout dele com os arquivos da CLI numa pasta própria: `src/components/ui/` para os arquivos da CLI, que são código do projeto, `src/components/blocks/`, `src/components/providers/`, `src/hooks/`, `src/lib/utils.ts` e `src/styles/globals.css`.
- Os aliases do `components.json` usam o nome do pacote (`@metri/ui/components/ui`, `@metri/ui/lib/utils`), resolvidos pelo `paths` do `tsconfig.json` e pelos `exports` do pacote.
- O app importa o primitivo pelos exports nomeados, como na documentação do shadcn (`import { Tabs, TabsList } from '@metri/ui/components/ui/tabs'`). O compound fica só para o componente composto do próprio app.
- O default em detalhe: `architecture/defaults/ui.md`.

## Alternativas consideradas

- Manter o re-export em compound e o `import * as`: um formato só no app, ao preço de um arquivo a mais por primitivo e de aliases que a CLI resolve mal.
- Aliases `#` com o `imports` do pacote: a CLI os aceita desde a 4.7, mas a documentação do shadcn recomenda o nome do pacote para o que outro workspace importa.

## Consequências

- Saem o campo `imports`, os aliases `#`, a pasta `src/shadcn/` e os arquivos de re-export.
- No mesmo `add`, o import do `cn` do arquivo da CLI passa ao `cn` do kit; o ajuste que o token não resolve é feito nesse arquivo.
- O app tem dois formatos de import de componente: nomeado para o primitivo do pacote e `import * as` para o compound do app.
- Supera o ADR-0001, cuja escolha do shadcn/ui continua valendo aqui.

## Imposto por

`metri design-tokens` (a lista `theme.text` do `cn` contra os `--text-*` do tema); a verificação de `architecture/defaults/ui.md` tem o comando que confere o import do `cn`.
