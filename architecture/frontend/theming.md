---
id: frontend/theming
description: "o uso de token e tema no código do app — cor, espaçamento e tipografia vêm dos tokens do `@metri/ui`, sem valor arbitrário cravado no componente; o tema como contrato de classe (`light`/`dark`) no `documentElement`, do pacote, e o provider de tema do `@metri/ui` (next-themes); o script inline e o fundo do `index.html` (`html` e `html.dark`) antes do primeiro paint; dois valores, sem `system`, e `light` para quem nunca escolheu."
use_when:
  - "escolher cor, espaçamento ou tipografia"
  - "mexer em tema ou no provider de tema"
applies_to:
  - "apps/app-web/index.html"
  - "apps/app-web/src/app/index.tsx"
  - "packages/ui/src/styles/globals.css"
  - "packages/ui/src/components/providers/theme-provider.tsx"
keywords: [token, tokens de UI, design system, "@metri/ui", Tailwind, valor arbitrário, tema, light, dark, documentElement, "@custom-variant dark", ThemeProvider, theme-provider, next-themes, enableSystem, useTheme, script inline, primeiro paint, html.dark, "--background", prefers-color-scheme, system]
not_covered:
  - "o kit, a entrada de componente no pacote e as CSS variables de tema → defaults/ui"
  - "valores e vocabulário visual → project:DESIGN"
  - "preferência de tema fora da árvore de estado cliente → frontend/state"
enforced_by: [design-tokens]
examples: [starter/packages/ui/src/components/providers/theme-provider.tsx, starter/apps/app-web/index.html]
status: active
---
# Token e tema no frontend

## Regras

### Tokens de UI vêm do design system

**Obrigatório.** Cor, espaçamento e tipografia vêm dos tokens do `@metri/ui` (CSS variables de tema, `defaults/ui.md`): `bg-background`, `text-foreground`, `text-muted-foreground`; a tipografia pelos níveis `text-<nível>` e o espaçamento pela escala padrão do Tailwind (`defaults/ui.md`, "Tipografia e espaçamento").

**Proibido.** Valor arbitrário cravado no componente (`text-[20px]`, `bg-[#fff]`, `p-[16px]`).

> **Por quê.** Valor arbitrário foge do design system e não acompanha token nem tema.

Quando falta um token: **Obrigatório.** Checar primeiro se ele já existe no `@metri/ui`; se for genuinamente novo, ele entra primeiro no `docs/DESIGN.md` e, dele, no `@metri/ui` (`defaults/ui.md`, "Tema e dark mode do `app-web`"), nunca um valor solto no app.

### Tema: contrato de classe e provider no `@metri/ui`

**Obrigatório.** O claro/escuro é uma classe (`light`/`dark`) no `documentElement`, e os tokens do `@metri/ui` trocam por ela (`packages/ui/src/styles/globals.css`, `@custom-variant dark`); esse contrato de classe é do pacote.

**Obrigatório.** Quem alterna a classe é o next-themes, pelo `ThemeProvider` do `@metri/ui` (`@metri/ui/components/providers/theme-provider`), montado em `app/index.tsx` do `app-web`. O `ThemeProvider` configura o next-themes com `attribute="class"`, `themes={['light', 'dark']}` e `enableSystem={false}`.

**Obrigatório.** No app Vite, o `index.html` do `app-web` aplica a classe antes do primeiro paint, num script inline que lê a mesma chave de armazenamento que o `ThemeProvider` (next-themes) usa — a `theme` do `localStorage`, o `storageKey` padrão do next-themes — e cai no mesmo default, `light`.

Quando o `ThemeProvider` passa a usar outra chave: **Obrigatório.** O script inline troca de chave na mesma edição.

> **Por quê.** O next-themes aplica a classe num `useEffect`, depois do primeiro paint, e o script que ele renderiza só roda em HTML que vem do servidor: no app Vite, o React cria esse script sem executá-lo. Sem o script do `index.html`, o primeiro frame sai no tema errado para quem escolheu o escuro.

**Obrigatório.** O fundo que o `index.html` pinta antes de o React montar (`frontend/routing.md`) segue a classe que o script inline aplica: um `<style>` inline pinta `html` com o valor claro do token `--background` e `html.dark` com o valor escuro, os dois de `packages/ui/src/styles/globals.css` (`:root` e `.dark`).

Quando o `--background` muda no `globals.css`: **Obrigatório.** O `<style>` do `index.html` muda na mesma edição.

> **Por quê.** O `<style>` inline pinta antes de o CSS do `@metri/ui` carregar, então não lê a variável; com um valor só, quem escolheu o escuro vê o fundo claro até o tema entrar.

**Obrigatório.** O tema tem dois valores, sem `system` (`enableSystem={false}`); a `prefers-color-scheme` não decide o tema nem no provider nem no script inline.

> **Por quê.** Sem `system`, `theme` é sempre o que está na tela, então todo controle lê o mesmo valor e não existe diferença entre o que o usuário pediu e o que está pintado. Incluir `system` reabre essa diferença e exige um segundo valor no contrato do provider, porque um switch claro/escuro não tem como se desenhar a partir de uma escolha de três estados.

**Obrigatório.** O valor para quem nunca escolheu é `light`.

**Obrigatório.** O provider mora no `@metri/ui`, não no app: tema é UI compartilhável entre apps (`general/code-placement.md`, "Código pode nascer no pacote dono quando nada nele é do app").

**Proibido.** Componente do pacote chamar o `useTheme()`: quando precisa ramificar por tema, recebe `dark?` por prop.

> **Por quê.** Fora do `ThemeProvider`, o `useTheme()` do next-themes devolve `theme` indefinido, sem erro: o componente ramificaria para o lado errado, calado, em teste e em consumidor que não monta o provider. Com `dark?`, quem monta passa o valor.

- **Exceção.** Arquivo da CLI do shadcn que chama o `useTheme()` do next-themes, como o `sonner.tsx`: fica como a CLI o escreveu (`defaults/ui.md`, "Tema e dark mode do `app-web`").

## Aplicação

```tsx
// RIGHT
<div className="bg-background text-foreground p-4 rounded-md">

// AVOID
<div className="bg-[#ffffff] text-[#0a0a0a] p-[16px] rounded-[6px]">
```

- O arquivo do `ThemeProvider` reexporta o `useTheme()`, que expõe `theme` e `setTheme` para o toggle do app.

Exemplo completo: `starter/packages/ui/src/components/providers/theme-provider.tsx` e o `<head>` de `starter/apps/app-web/index.html`.

## Verificação

- As classes de UI usam token do `@metri/ui`, sem valor arbitrário (`bg-[#...]`, `p-[16px]`)?
- Tema: app Vite monta o `ThemeProvider` do `@metri/ui` (next-themes com `attribute="class"` e `enableSystem={false}`), com a classe aplicada pelo script inline antes do primeiro paint, dois valores e default `light`?
- O `<style>` inline do `index.html` pinta `html` e `html.dark` com o valor claro e o escuro do `--background` do `globals.css`? (check: design-tokens)
- Componente do pacote ramifica por `dark?`, não pelo `useTheme()` do pacote?

## Referências

- `frontend/state.md`: tema fora da árvore de estado cliente.
- `general/code-placement.md`: a promoção de peça ao pacote.
