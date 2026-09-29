---
id: defaults/ui
description: "o kit de UI padrão — shadcn/ui dentro do `@metri/ui`, no layout padrão do shadcn em monorepo (`components/ui`, `components/blocks`, `components/providers`, `hooks`, `lib/utils.ts`, `styles/globals.css`), com o `components.json`, os `paths` e os `exports` do pacote; como um componente entra (CLI do shadcn no pacote) e como o app o importa (import nomeado); o ajuste visual pelo token e, quando o token não resolve, no próprio arquivo; os tokens como CSS variables de tema, em claro e escuro, com os dois `@source`, a tipografia, o `cn` que conhece os níveis de texto e o espaçamento; o que é do projeto."
use_when:
  - "adicionar ou atualizar um componente do shadcn no `@metri/ui`"
  - "ajustar o visual de um componente do `@metri/ui`"
  - "mexer nas CSS variables de tema, na tipografia ou no espaçamento do `@metri/ui`"
  - "mexer no `components.json`, nos `paths`, nos `exports` ou no `cn` do `@metri/ui`"
activation: "O projeto tem interface? O estilo visual (docs/DESIGN.md) é decidido no /shape."
applies_to:
  - "packages/ui/components.json"
  - "packages/ui/package.json"
  - "packages/ui/tsconfig.json"
  - "packages/ui/src/lib/utils.ts"
  - "packages/ui/src/styles/globals.css"
  - "packages/ui/src/components/**"
keywords: [shadcn/ui, shadcn, components.json, new-york, neutral, baseColor, aliases, exports, paths, "shadcn@latest add", CLI, "components/ui", "components/blocks", "components/providers", "@metri/ui", "@source", CSS variables, "@theme", "@theme inline", ":root", ".dark", globals.css, token, tema, next-themes, Sonner, toast, "--font-sans", "--font-mono", Geist, "--text-*", cn, tailwind-merge, extendTailwindMerge, espaçamento]
not_covered:
  - "o formato de import e a composição no app → frontend/components"
  - "o uso de token e tema no código, o provider e o script inline → frontend/theming"
  - "valores e vocabulário visual → project:DESIGN"
adr: [metri:ADR-0003]
enforced_by: [design-tokens]
status: active
---
# Biblioteca de UI padrão

## Kit

- shadcn/ui, instalado dentro do `@metri/ui` pelo setup de monorepo do shadcn, no layout padrão dele (metri:ADR-0003): `shadcn init --monorepo` no monorepo que nasce dele.
- Monorepo que não nasceu do shadcn segue o caminho manual da documentação (https://ui.shadcn.com/docs/monorepo):
  - `packages/ui/components.json` com o `style`, o `baseColor` e os aliases de "O pacote", e `"tailwind": { "config": "", "css": "src/styles/globals.css" }` (Tailwind v4);
  - o `app-web` depende do `@metri/ui` (`workspace:*`) e importa `@metri/ui/styles/globals.css` na entrada.
- O `globals.css` abre com `@import "tailwindcss"` e dois `@source`, relativos a ele: um para os arquivos de `apps/` e outro para os do próprio pacote.

```css
/* packages/ui/src/styles/globals.css */
@import "tailwindcss";
@source "../../../../apps/**/*.{ts,tsx}";
@source "../**/*.{ts,tsx}";
```

> **Por quê.** O Tailwind procura classes a partir da pasta de quem processa o CSS, o app. Sem o segundo `@source`, as classes dos componentes do pacote (`bg-primary`, `rounded-md`) somem do CSS final, sem erro.

- O `components.json` do `@metri/ui` fixa `"style": "new-york"` e `"tailwind": { "baseColor": "neutral" }`.
- Os componentes do shadcn são a base; nenhum componente é recriado do zero.
- O visual vem dos tokens do `DESIGN.md` do projeto.
- Kit diferente num projeto: ADR do projeto + regra em `.metri/rules/frontend/`.

## O pacote

O `@metri/ui` segue o layout padrão do shadcn em monorepo:

| Pasta | O quê |
| --- | --- |
| `src/components/ui/` | os arquivos da CLI do shadcn, código do projeto |
| `src/components/blocks/` | blocos: composições de primitivos que mais de um app usa, da CLI ou do projeto |
| `src/components/providers/` | os providers do kit, como o `ThemeProvider` (`frontend/theming.md`) |
| `src/hooks/` | os hooks do kit |
| `src/lib/utils.ts` | o `cn`, com o `extendTailwindMerge` do kit ("Tipografia e espaçamento") |
| `src/styles/globals.css` | o tema |

- Os aliases do `components.json` usam o nome do pacote, com o `@`; o `tsconfig.json` do pacote tem o `paths` que os resolve, e os `exports` expõem as mesmas pastas.

```json
"aliases": {
  "components": "@metri/ui/components/blocks",
  "ui": "@metri/ui/components/ui",
  "lib": "@metri/ui/lib",
  "hooks": "@metri/ui/hooks",
  "utils": "@metri/ui/lib/utils"
}
```

```json
// packages/ui/tsconfig.json, in compilerOptions
"paths": { "@metri/ui/*": ["./src/*"] }
```

```json
// packages/ui/package.json
"exports": {
  "./components/*": "./src/components/*.tsx",
  "./lib/*": "./src/lib/*.ts",
  "./hooks/*": "./src/hooks/*.ts",
  "./styles/globals.css": "./src/styles/globals.css"
}
```

- Com o alias `utils` no nome do pacote, o arquivo que a CLI grava importa o `cn` do kit (`@metri/ui/lib/utils`), com os níveis de texto do tema.

## Componente novo

- Entra pela CLI do shadcn (`shadcn@latest add <componente>`), rodada no `@metri/ui`, nunca copiado à mão; a CLI o grava em `src/components/ui/`.
- O arquivo é código do projeto, com os exports nomeados que a CLI escreveu (`Tabs`, `TabsList`); o app o importa por eles (`frontend/components.md`, "Composição e o que sobe pro pacote").
- O `toast` vem da lib `sonner`, como na documentação do shadcn: o `app-web` depende do `sonner` na mesma versão do `@metri/ui`, porque duas cópias da lib não se falam e o toast não chega ao `Toaster`.

## Ajuste visual

**Obrigatório.** O ajuste visual começa pelo token: a CSS variable de tema em `packages/ui/src/styles/globals.css`, antes de qualquer mudança em componente.

Quando o token não resolve: **Padrão.** O ajuste é feito no próprio arquivo de `src/components/ui/`, que é código do projeto.

> **Por quê.** A CLI não sobrescreve um arquivo que já existe sem `--overwrite`; atualizar um componente ajustado é uma mesclagem à mão com a versão nova.

## Tema e dark mode do `app-web`

- Os tokens são as CSS variables de tema do shadcn (`--background`, `--foreground`, `--primary`, `--radius`...), em `packages/ui/src/styles/globals.css`.
- Valor claro em `:root`, valor escuro em `.dark`; o `@theme inline` expõe cada variável ao Tailwind (`bg-background`, `text-foreground`).
- Cor nova entra como variável em `:root` e em `.dark` e é exposta no `@theme inline`.
- Os valores são os do `DESIGN.md`, a fonte deles, e o `metri design-tokens` confere o tema contra ele; a base neutra é `skills/shape/DESIGN-TEMPLATE.md`.
- O escuro liga pela classe no `documentElement`. O provider de tema do `@metri/ui` é o next-themes: o `ThemeProvider` do pacote o configura com `attribute="class"`, `themes={['light', 'dark']}` e `enableSystem={false}`, pelo contrato de `frontend/theming.md`, "Tema: contrato de classe e provider no `@metri/ui`".
- O script inline do `index.html` do `app-web` aplica a classe antes do primeiro paint e lê a mesma chave de armazenamento que o `ThemeProvider` usa (a `theme` do next-themes): `frontend/theming.md`, "Tema: contrato de classe e provider no `@metri/ui`".
- O `sonner.tsx` da CLI lê o tema pelo `useTheme()` do next-themes e funciona como a CLI o escreveu, montado dentro do `ThemeProvider`.

## Tipografia e espaçamento

- `--font-sans` e `--font-mono` entram no `@theme` do `globals.css`, com as famílias do `DESIGN.md` (Geist e Geist Mono).
- Cada nível de `typography` do `DESIGN.md` vira `--text-<nível>` no `@theme`, com `--line-height`, `--letter-spacing` e `--font-weight` do nível; a classe é `text-<nível>` (`text-body-sm`, `text-display-lg`).
- A família não entra no nível: nível em Geist Mono (`code`, `caption-mono`) leva `font-mono` junto (`text-code font-mono`).
- O `cn` do `@metri/ui` (`packages/ui/src/lib/utils.ts`) monta o tailwind-merge com `extendTailwindMerge`, com cada nível de `typography` do `DESIGN.md` como tamanho de fonte (`theme.text`). Sem isso, o tailwind-merge lê `text-<nível>` como cor e o descarta ao lado de `text-muted-foreground`.
- Nível novo no `@theme` entra na lista do `cn` na mesma edição; o `metri design-tokens` confere a lista contra os `--text-*` do `@theme`.

```ts
// packages/ui/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display-xl',
        'display-lg',
        'display-md',
        'display-sm',
        'body-lg',
        'body-md',
        'body-md-strong',
        'body-sm',
        'body-sm-strong',
        'caption',
        'caption-mono',
        'code',
        'button-md',
        'button-lg',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```css
/* packages/ui/src/styles/globals.css (excerpt) */
@theme {
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;

  --text-display-lg: 32px;
  --text-display-lg--line-height: 40px;
  --text-display-lg--letter-spacing: -1.28px;
  --text-display-lg--font-weight: 600;
}
```

- Espaçamento: a escala padrão do Tailwind, sem variável própria no `@theme`. Ela coincide com a `spacing` do `DESIGN.md` (`xxs` 4px = `1`, `md` 16px = `4`, `4xl` 64px = `16`).

## O que é do projeto

- `docs/DESIGN.md`, com os valores dos tokens que o `globals.css` do `@metri/ui` segue.

## Verificação

- Componente novo entrou pela CLI, no `@metri/ui`, em `src/components/ui/`?
- O `components.json` tem `style` `new-york`, `baseColor` `neutral` e os aliases no nome do pacote, com o `paths` do `tsconfig.json` e os `exports` para as mesmas pastas?
- O `globals.css` tem os dois `@source`, o de `apps/` e o do pacote?
- Os arquivos da CLI importam o `cn` do kit? `grep -rn "import { cn }" packages/ui/src/components | grep -v "@metri/ui/lib/utils"` devolve vazio.
- O ajuste visual começou pelo token, e cor nova tem valor em `:root` e em `.dark`?
- O `@theme` tem `--font-sans`, `--font-mono` e um `--text-<nível>` por nível de `typography` do `DESIGN.md`? (check: design-tokens)
- O `cn` usa `extendTailwindMerge`, com cada `--text-<nível>` do `@theme` em `theme.text`? (check: design-tokens)
