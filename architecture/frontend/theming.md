---
id: frontend/theming
description: "o uso de token e tema no código do app — cor, espaçamento e tipografia vêm dos tokens do `@metri/ui`, sem valor arbitrário cravado no componente; o tema como contrato de classe (`light`/`dark`) no `documentElement`, do pacote, e o provider de tema do `@metri/ui` (next-themes); o script inline antes do primeiro paint; dois valores, sem `system`, e `light` para quem nunca escolheu."
use_when:
  - "escolher cor, espaçamento ou tipografia"
  - "mexer em tema ou no provider de tema"
applies_to:
  - "apps/app-web/index.html"
  - "apps/app-web/src/app/index.tsx"
  - "packages/ui/src/styles/globals.css"
  - "packages/ui/src/components/providers/theme-provider.tsx"
keywords: [token, tokens de UI, design system, "@metri/ui", Tailwind, valor arbitrário, tema, light, dark, documentElement, "@custom-variant dark", ThemeProvider, theme-provider, next-themes, enableSystem, useTheme, script inline, primeiro paint, prefers-color-scheme, system]
not_covered:
  - "o kit, a entrada de componente no pacote e as CSS variables de tema → defaults/ui"
  - "valores e vocabulário visual → project:DESIGN"
  - "preferência de tema fora da árvore de estado cliente → frontend/state"
status: active
---
# Token e tema no frontend

## Regras

### Tokens de UI vêm do design system

**Obrigatório.** Cor, espaçamento e tipografia vêm dos tokens do `@metri/ui` (CSS variables de tema, `defaults/ui.md`): `bg-background`, `text-foreground`, `text-muted-foreground`.

**Proibido.** Valor arbitrário cravado no componente (`text-[20px]`, `bg-[#fff]`, `p-[16px]`).

> **Por quê.** Valor arbitrário foge do design system e não acompanha token nem tema.

Quando falta um token: **Obrigatório.** Checar primeiro se ele já existe no `@metri/ui`; se for genuinamente novo, a adição é no `@metri/ui`, nunca um valor solto no app.

### Tema: contrato de classe e provider no `@metri/ui`

**Obrigatório.** O claro/escuro é uma classe (`light`/`dark`) no `documentElement`, e os tokens do `@metri/ui` trocam por ela (`packages/ui/src/styles/globals.css`, `@custom-variant dark`); esse contrato de classe é do pacote.

**Obrigatório.** Quem alterna a classe é o next-themes, pelo `ThemeProvider` do `@metri/ui` (`@metri/ui/components/providers/theme-provider`), montado em `app/index.tsx` do `app-web`. O `ThemeProvider` configura o next-themes com `attribute="class"`, `themes={['light', 'dark']}` e `enableSystem={false}`.

**Obrigatório.** No app Vite, o `index.html` aplica a classe antes do primeiro paint, num script inline com a mesma chave e o mesmo default do provider (a chave `theme` e o `light` do next-themes).

> **Por quê.** O next-themes aplica a classe num `useEffect`, depois do primeiro paint, e o script que ele renderiza só roda em HTML que vem do servidor: no app Vite, o React cria esse script sem executá-lo. Sem o script do `index.html`, o primeiro frame sai no tema errado para quem escolheu o escuro.

**Obrigatório.** O tema tem dois valores; a preferência do sistema operacional não entra: sem `system` (`enableSystem={false}`), e a `prefers-color-scheme` não decide o tema nem no provider nem no script inline.

> **Por quê.** Sem `system`, `theme` é sempre o que está na tela, então todo controle lê o mesmo valor e não existe diferença entre o que o usuário pediu e o que está pintado. Trazer `system` de volta reabre essa diferença e exige um segundo valor no contrato do provider, porque um switch claro/escuro não tem como se desenhar a partir de uma escolha de três estados.

**Obrigatório.** O valor para quem nunca escolheu é `light`.

**Obrigatório.** O provider mora no `@metri/ui`, não no app: tema é UI compartilhável entre apps (`general/code-placement.md`, "Código pode nascer no pacote dono quando nada nele é do app").

**Proibido.** Componente do pacote chamar o `useTheme()`: quando precisa ramificar por tema, recebe `dark?` por prop.

> **Por quê.** Fora do `ThemeProvider`, o `useTheme()` do next-themes devolve `theme` indefinido, sem erro: o componente ramificaria para o lado errado, calado, em teste e em consumidor que não monta o provider. Com `dark?`, quem monta passa o valor.

- **Exceção.** Arquivo gerado pela CLI do shadcn, como o `sonner.tsx`: ele chama o `useTheme()` do next-themes e não é editado (`defaults/ui.md`, "Componente novo").

## Aplicação

```tsx
// CORRETO
<div className="bg-background text-foreground p-4 rounded-md">

// EVITAR
<div className="bg-[#ffffff] text-[#0a0a0a] p-[16px] rounded-[6px]">
```

- O `ThemeProvider` do `@metri/ui` é o do next-themes, configurado; o arquivo reexporta o `useTheme()`, que expõe `theme` e `setTheme` para o toggle do app.

```tsx
// packages/ui/src/components/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" themes={['light', 'dark']} enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from 'next-themes';
```

```html
<!-- apps/app-web/index.html, no <head> -->
<script>
  document.documentElement.classList.add(localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
</script>
```

- Preferência de tema não é estado de store (`frontend/state.md`, "Tema não é estado de store"): é este provider, montado em `app/`.

## Verificação

- As classes de UI usam token do `@metri/ui`, sem valor arbitrário (`bg-[#...]`, `p-[16px]`)?
- Tema: app Vite monta o `ThemeProvider` do `@metri/ui` (next-themes com `attribute="class"` e `enableSystem={false}`), com a classe aplicada pelo script inline antes do primeiro paint, dois valores e default `light`?
- Componente do pacote ramifica por `dark?`, não pelo `useTheme()` do pacote?

## Referências

- `frontend/state.md`: tema fora da árvore de estado cliente.
- `general/code-placement.md`: a promoção de peça ao pacote.
