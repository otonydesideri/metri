---
id: defaults/ui
description: "o kit de UI padrão — shadcn/ui dentro do `@metri/ui`; como um componente entra (CLI do shadcn no pacote) e como ganha a forma compound (re-export, sem editar o arquivo gerado); o ajuste visual pelo token; os tokens como CSS variables de tema, em claro e escuro; o que é do projeto."
use_when:
  - "adicionar ou atualizar um componente do shadcn no `@metri/ui`"
  - "expor um primitivo do `@metri/ui` em compound"
  - "ajustar o visual de um componente do `@metri/ui`"
  - "mexer nas CSS variables de tema do `@metri/ui`"
applies_to:
  - "packages/ui/components.json"
  - "packages/ui/src/shadcn/**"
  - "packages/ui/src/components/ui/**"
keywords: [shadcn/ui, shadcn, components.json, "shadcn@latest add", CLI, re-export, compound, Root, "@metri/ui", CSS variables, "@theme inline", ":root", ".dark", globals.css, token, tema]
not_covered:
  - "o formato de import e a composição no app → frontend/components"
  - "o uso de token e tema no código, o provider e o script inline → frontend/theming"
  - "valores e vocabulário visual → project:DESIGN"
adr: [ADR-0020]
status: active
---
# Biblioteca de UI padrão

## Kit

- shadcn/ui, instalado dentro do `@metri/ui` pelo setup de monorepo do shadcn (ADR-0020).
- Os componentes do shadcn são a base; nenhum componente é recriado do zero (METHODOLOGY 8.1).
- O visual vem dos tokens do `DESIGN.md` do projeto.
- Kit diferente num projeto: ADR do projeto + regra em `docs/architecture/frontend/` (METHODOLOGY 8.5).

## Componente novo

- Entra pela CLI do shadcn (`shadcn@latest add <componente>`), rodada no `@metri/ui`, nunca copiado à mão.
- O alias `ui` do `components.json` do `@metri/ui` aponta para `packages/ui/src/shadcn/`: é lá que a CLI grava o arquivo gerado.
- O arquivo gerado não é editado: a CLI continua dona dele e o atualiza.
- A forma compound vem de um arquivo de re-export por componente, em `packages/ui/src/components/ui/`, com o nome do arquivo gerado.
- Nome da parte: o export com o nome do componente vira `Root`; os demais perdem o prefixo do componente (`TabsList` → `List`).

```ts
// packages/ui/src/components/ui/tabs.ts
export {
  Tabs as Root,
  TabsList as List,
  TabsTrigger as Trigger,
  TabsContent as Content,
} from '../../shadcn/tabs';
```

- O consumo por `import * as`: `frontend/components.md`, "Composição e o que sobe pro pacote".

## Ajuste visual

**Obrigatório.** O ajuste visual começa pelo token: a CSS variable de tema em `packages/ui/src/styles/globals.css`, antes de qualquer mudança em componente.

**Proibido.** Editar o arquivo gerado pela CLI.

## Tema e dark mode do `app-web`

- Os tokens são as CSS variables de tema do shadcn (`--background`, `--foreground`, `--primary`, `--radius`...), em `packages/ui/src/styles/globals.css`.
- Valor claro em `:root`, valor escuro em `.dark`; o `@theme inline` expõe cada variável ao Tailwind (`bg-background`, `text-foreground`).
- Cor nova entra como variável em `:root` e em `.dark` e é exposta no `@theme inline`.
- Os valores de partida são os do `DESIGN.md`; a base neutra é `methodology/templates/DESIGN.md`.
- O escuro liga pela classe no `documentElement`. O `ThemeProvider` do `@metri/ui` parte do provider da doc do shadcn para Vite (ui.shadcn.com/docs/dark-mode/vite) e segue o contrato de `frontend/theming.md`, "Tema: contrato de classe e provider no `@metri/ui`".

## O que é do projeto

- `docs/DESIGN.md`: identidade visual, valores dos tokens, princípios e uso dos componentes.
- Depois da slice de design system, os valores moram no `globals.css` do `@metri/ui`, e o `DESIGN.md` aponta para ele (METHODOLOGY 8.3).

## Verificação

- Componente novo entrou pela CLI, no `@metri/ui`, com o arquivo gerado sem edição?
- Todo primitivo tem o arquivo de re-export em `packages/ui/src/components/ui/`, com `Root` e as partes sem o prefixo?
- O ajuste visual começou pelo token, e cor nova tem valor em `:root` e em `.dark`?
