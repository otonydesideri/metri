# ADR-0001 Biblioteca de UI padrão

status: accepted
area: defaults
kind: decision

## Contexto

- O kit padrão da metodologia é o shadcn/ui, instalado e estilizado por tokens de tema conforme o `DESIGN.md` (`architecture/defaults/ui.md`).
- O `@metri/ui`, kit que as regras de `frontend/` consomem, era feito em AlignUI: primitivos em compound (`Input.Root`, `Label.Asterisk`) e tokens próprios (`bg-bg-white-0`, `text-title-h6`).
- O shadcn/ui gera cada componente com exports nomeados (`Tabs`, `TabsList`), e a CLI atualiza o arquivo que gerou.

## Decisão

- O shadcn/ui é instalado dentro do `@metri/ui`, pelo setup de monorepo do shadcn, e estilizado pelos tokens do `DESIGN.md`.
- O `@metri/ui` expõe cada primitivo em compound (`Tabs.Root`, `Tabs.List`) por um arquivo de re-export por componente.
- O arquivo que a CLI gera não é editado, para a CLI continuar atualizando.
- O projeto tem um só formato de import de componente: compound com `import * as` (`frontend/components.md`, "Composição e o que sobe pro pacote"). O compound de `shared/components/` segue a mesma forma.
- O default em detalhe: `architecture/defaults/ui.md`.

## Alternativas consideradas

- AlignUI como base do `@metri/ui`: o kit global divergiria do default da metodologia.
- Os dois kits no `@metri/ui`: dois vocabulários de componente e de token para a mesma tela.
- O formato de import nativo do shadcn (`import { Tabs, TabsList }`): o app teria dois formatos, nomeado para o primitivo e `import * as` para o compound do app.

## Consequências

- O AlignUI sai do `@metri/ui` e das regras.
- Os primitivos são expostos em compound por re-export, sem editar o arquivo gerado.
- O app tem um só formato de import de componente.
- Os tokens do `DESIGN.md` viram as CSS variables de tema do `@metri/ui`.

## Imposto por

Não imposto. Check candidato: nenhum import nomeado de `@metri/ui/components/ui/*`.
