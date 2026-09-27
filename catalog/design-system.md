---
id: catalog/design-system
description: "o design system como capacidade: o kit de UI do `@metri/ui` estilizado pelos tokens do `DESIGN.md`, com tema claro e escuro; entra na slice 0 de todo projeto com interface."
use_when:
  - "o projeto tem interface"
  - "montar a slice 0 de um projeto com interface"
---
# Design system

## Entrega

- O `@metri/ui` com o kit shadcn/ui, os tokens do `DESIGN.md` como CSS variables de tema e o tema claro e escuro.
- Entra na slice 0 de todo projeto com interface (METHODOLOGY 8.5).

## Regras

- `defaults/ui`
- `frontend/theming`
- `frontend/components`

## Ativação

Pergunta: O projeto tem interface?

- Sim: triagem de design no `/shape` (METHODOLOGY 8.2) e a slice design-system na slice 0.

## O que fica para o projeto

- Decide: a identidade visual, em `docs/DESIGN.md`, a partir da base neutra `methodology/templates/DESIGN.md`.
- Decide: a regra de vocabulário visual das telas, em `docs/architecture/frontend/` (exemplo: `methodology/templates/examples/design-system.md`).
- Default: a base neutra e o kit shadcn/ui.
- Registro: `docs/DESIGN.md`.
- ADR quando: o projeto troca o kit de UI (METHODOLOGY 8.5).
