---
id: defaults/ui
description: "o kit de UI padrão — shadcn/ui dentro do `@metri/ui`, com o `components.json` e os `exports` do pacote; como um componente entra (CLI do shadcn no pacote) e como ganha a forma compound (re-export, sem editar o arquivo gerado); o ajuste visual pelo token e o wrapper quando o token não resolve; os tokens como CSS variables de tema, em claro e escuro, com a tipografia e o espaçamento; o que é do projeto."
use_when:
  - "adicionar ou atualizar um componente do shadcn no `@metri/ui`"
  - "expor um primitivo do `@metri/ui` em compound"
  - "ajustar o visual de um componente do `@metri/ui`"
  - "mexer nas CSS variables de tema, na tipografia ou no espaçamento do `@metri/ui`"
  - "mexer no `components.json` ou nos `exports` do `@metri/ui`"
applies_to:
  - "packages/ui/components.json"
  - "packages/ui/package.json"
  - "packages/ui/src/styles/globals.css"
  - "packages/ui/src/shadcn/**"
  - "packages/ui/src/components/ui/**"
keywords: [shadcn/ui, shadcn, components.json, new-york, neutral, baseColor, exports, "shadcn@latest add", CLI, re-export, compound, Root, wrapper, "@metri/ui", CSS variables, "@theme", "@theme inline", ":root", ".dark", globals.css, token, tema, next-themes, Sonner, toast, "--font-sans", "--font-mono", Geist, "--text-*", espaçamento]
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
- O `components.json` do `@metri/ui` fixa `"style": "new-york"` e `"tailwind": { "baseColor": "neutral" }`.
- Os componentes do shadcn são a base; nenhum componente é recriado do zero (METHODOLOGY 8.1).
- O visual vem dos tokens do `DESIGN.md` do projeto.
- Kit diferente num projeto: ADR do projeto + regra em `docs/architecture/frontend/` (METHODOLOGY 8.5).

## Componente novo

- Entra pela CLI do shadcn (`shadcn@latest add <componente>`), rodada no `@metri/ui`, nunca copiado à mão.
- O alias `ui` do `components.json` do `@metri/ui` aponta para `packages/ui/src/shadcn/`: é lá que a CLI grava o arquivo gerado.
- O arquivo gerado não é editado: a CLI continua dona dele e o atualiza.
- A forma compound vem de um arquivo de re-export por componente, em `packages/ui/src/components/ui/`, com o nome do arquivo gerado.
- Nome da parte: o export com o nome do componente vira `Root`; os demais perdem o prefixo do componente (`TabsList` → `List`); export sem o prefixo mantém o nome (`Toaster` → `Sonner.Toaster`).

```ts
// packages/ui/src/components/ui/tabs.tsx
export {
  Tabs as Root,
  TabsList as List,
  TabsTrigger as Trigger,
  TabsContent as Content,
} from '../../shadcn/tabs';
```

- O re-export do Sonner expõe também o `toast` da lib `sonner`: `Sonner.toast.success(title, { description })` e `Sonner.toast.error(title, { description })`.

```ts
// packages/ui/src/components/ui/sonner.tsx
export { Toaster } from '../../shadcn/sonner';
export { toast } from 'sonner';
```

- Os `exports` do `package.json` do `@metri/ui` expõem, de componente, só `components/ui/*`; `src/shadcn/` não é ponto de entrada do pacote.

```json
"exports": {
  "./components/ui/*": "./src/components/ui/*.tsx",
  "./components/providers/*": "./src/components/providers/*.tsx",
  "./hooks/*": "./src/hooks/*.ts",
  "./styles/globals.css": "./src/styles/globals.css"
}
```

- O consumo por `import * as`, sem o caminho do arquivo gerado: `frontend/components.md`, "Composição e o que sobe pro pacote".

## Ajuste visual

**Obrigatório.** O ajuste visual começa pelo token: a CSS variable de tema em `packages/ui/src/styles/globals.css`, antes de qualquer mudança em componente.

**Proibido.** Editar o arquivo gerado pela CLI.

- **Exceção.** Ajuste que o token não resolve: um wrapper no arquivo de re-export daquele componente, com o arquivo gerado intocado e os mesmos nomes de parte.

```tsx
// packages/ui/src/components/ui/card.tsx
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../../shadcn/card';

function Root({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card className={cn('py-5', className)} {...props} />;
}

export { Root };
export {
  CardHeader as Header,
  CardTitle as Title,
  CardDescription as Description,
  CardAction as Action,
  CardContent as Content,
  CardFooter as Footer,
} from '../../shadcn/card';
```

## Tema e dark mode do `app-web`

- Os tokens são as CSS variables de tema do shadcn (`--background`, `--foreground`, `--primary`, `--radius`...), em `packages/ui/src/styles/globals.css`.
- Valor claro em `:root`, valor escuro em `.dark`; o `@theme inline` expõe cada variável ao Tailwind (`bg-background`, `text-foreground`).
- Cor nova entra como variável em `:root` e em `.dark` e é exposta no `@theme inline`.
- Os valores de partida são os do `DESIGN.md`; a base neutra é `template/docs/DESIGN.md`.
- O escuro liga pela classe no `documentElement`. O provider de tema do `@metri/ui` é o next-themes: o `ThemeProvider` do pacote o configura com `attribute="class"`, `themes={['light', 'dark']}` e `enableSystem={false}`, pelo contrato de `frontend/theming.md`, "Tema: contrato de classe e provider no `@metri/ui`".
- O `sonner.tsx` gerado lê o tema pelo `useTheme()` do next-themes e funciona sem wrapper, montado dentro do `ThemeProvider`.

## Tipografia e espaçamento

- `--font-sans` e `--font-mono` entram no `@theme` do `globals.css`, com as famílias do `DESIGN.md` (Geist e Geist Mono).
- Cada nível de `typography` do `DESIGN.md` vira `--text-<nível>` no `@theme`, com `--line-height`, `--letter-spacing` e `--font-weight` do nível; a classe é `text-<nível>` (`text-body-sm`, `text-display-lg`).
- A família não entra no nível: nível em Geist Mono (`code`, `caption-mono`) leva `font-mono` junto (`text-code font-mono`).

```css
/* packages/ui/src/styles/globals.css (trecho) */
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

- `docs/DESIGN.md` (METHODOLOGY 8.5); os valores dos tokens migram para o `globals.css` do `@metri/ui` com a slice de design system (METHODOLOGY 8.3).

## Verificação

- Componente novo entrou pela CLI, no `@metri/ui`, com o arquivo gerado sem edição?
- O `components.json` tem `style` `new-york` e `baseColor` `neutral`, e os `exports` não expõem `src/shadcn/`?
- Todo primitivo tem o arquivo de re-export em `packages/ui/src/components/ui/`, com `Root` e as partes sem o prefixo?
- O ajuste visual começou pelo token, e cor nova tem valor em `:root` e em `.dark`?
- Ajuste que o token não resolve é wrapper no arquivo de re-export, com os mesmos nomes de parte?
- O `@theme` tem `--font-sans`, `--font-mono` e um `--text-<nível>` por nível de `typography` do `DESIGN.md`?
