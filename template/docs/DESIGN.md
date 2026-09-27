---
version: alpha
name: Base neutra
description: Base visual neutra do Architecture Source — o tema neutral do shadcn/ui em claro e escuro, sem marca, com a tipografia Geist e a escala de raio do shadcn.

colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.97 0 0)"
  accent-foreground: "oklch(0.205 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  chart-1: "oklch(0.646 0.222 41.116)"
  chart-2: "oklch(0.6 0.118 184.704)"
  chart-3: "oklch(0.398 0.07 227.392)"
  chart-4: "oklch(0.828 0.189 84.429)"
  chart-5: "oklch(0.769 0.188 70.08)"
  sidebar: "oklch(0.985 0 0)"
  sidebar-foreground: "oklch(0.145 0 0)"
  sidebar-primary: "oklch(0.205 0 0)"
  sidebar-primary-foreground: "oklch(0.985 0 0)"
  sidebar-accent: "oklch(0.97 0 0)"
  sidebar-accent-foreground: "oklch(0.205 0 0)"
  sidebar-border: "oklch(0.922 0 0)"
  sidebar-ring: "oklch(0.708 0 0)"
  background-dark: "oklch(0.145 0 0)"
  foreground-dark: "oklch(0.985 0 0)"
  card-dark: "oklch(0.205 0 0)"
  card-foreground-dark: "oklch(0.985 0 0)"
  popover-dark: "oklch(0.205 0 0)"
  popover-foreground-dark: "oklch(0.985 0 0)"
  primary-dark: "oklch(0.922 0 0)"
  primary-foreground-dark: "oklch(0.205 0 0)"
  secondary-dark: "oklch(0.269 0 0)"
  secondary-foreground-dark: "oklch(0.985 0 0)"
  muted-dark: "oklch(0.269 0 0)"
  muted-foreground-dark: "oklch(0.708 0 0)"
  accent-dark: "oklch(0.269 0 0)"
  accent-foreground-dark: "oklch(0.985 0 0)"
  destructive-dark: "oklch(0.704 0.191 22.216)"
  border-dark: "oklch(1 0 0 / 10%)"
  input-dark: "oklch(1 0 0 / 15%)"
  ring-dark: "oklch(0.556 0 0)"
  chart-1-dark: "oklch(0.488 0.243 264.376)"
  chart-2-dark: "oklch(0.696 0.17 162.48)"
  chart-3-dark: "oklch(0.769 0.188 70.08)"
  chart-4-dark: "oklch(0.627 0.265 303.9)"
  chart-5-dark: "oklch(0.645 0.246 16.439)"
  sidebar-dark: "oklch(0.205 0 0)"
  sidebar-foreground-dark: "oklch(0.985 0 0)"
  sidebar-primary-dark: "oklch(0.488 0.243 264.376)"
  sidebar-primary-foreground-dark: "oklch(0.985 0 0)"
  sidebar-accent-dark: "oklch(0.269 0 0)"
  sidebar-accent-foreground-dark: "oklch(0.985 0 0)"
  sidebar-border-dark: "oklch(1 0 0 / 10%)"
  sidebar-ring-dark: "oklch(0.556 0 0)"

typography:
  display-xl:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 48px
    fontWeight: 600
    lineHeight: 48px
    letterSpacing: -2.4px
  display-lg:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -1.28px
  display-md:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
    letterSpacing: -0.96px
  display-sm:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.6px
  body-lg:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0px
  body-md:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md-strong:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  body-sm:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: -0.28px
  body-sm-strong:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: -0.28px
  caption:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  caption-mono:
    fontFamily: Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  code:
    fontFamily: Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
  button-md:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  button-lg:
    fontFamily: Geist, Inter, system-ui, -apple-system, sans-serif
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px

rounded:
  sm: 0.375rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.875rem
  2xl: 1.125rem
  3xl: 1.375rem
  4xl: 1.625rem
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 48px
  4xl: 64px

components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 8px 16px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 8px 16px
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 8px 16px
  button-ghost:
    textColor: "{colors.foreground}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 8px 16px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 8px 16px
  button-link:
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
  button-sm:
    height: 32px
    padding: 0px 12px
  button-lg:
    height: 40px
    padding: 0px 24px
  button-icon:
    size: 36px
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  badge-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: 2px 8px
  badge-outline:
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: 2px 8px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
  input:
    backgroundColor: transparent
    rounded: "{rounded.md}"
    height: 36px
    padding: 4px 12px
  dialog:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
    padding: 24px
  popover:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.md}"
    padding: 16px
  tooltip:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: 6px 12px
---

# Design: base neutra

## Overview

Base neutra do Architecture Source: o tema neutral do shadcn/ui, sem marca, em claro e escuro. É o default da triagem de design: o projeto copia este arquivo para `docs/DESIGN.md` e troca nome, valores e prosa pela identidade dele.

- Referência: o tema neutral do shadcn/ui, com tipografia e espaçamento da análise da Vercel no getdesign.md (seção "Fonte").
- Biblioteca: shadcn/ui, default global (`.metri/architecture/defaults/ui.md`) | outra → ADR-NNNN.
- Tokens: `packages/ui/src/styles/globals.css`. Depois da slice design-system, os valores moram lá, e o frontmatter deste arquivo dá lugar a um ponteiro para ele.

O tom é neutro: cinzas sem matiz (croma 0), com cor só em `destructive`, nos gráficos e no `sidebar-primary` do escuro.

## Colors

Os tokens são as CSS variables de tema do shadcn/ui, com o mesmo nome. O token sem sufixo é o valor claro (`:root`); o sufixo `-dark` é o valor escuro (`.dark`), e no escuro cada componente usa o token `-dark` do mesmo papel.

Pares de superfície e texto: o token base é a cor da superfície, e o `-foreground` é a cor do texto e do ícone sobre ela (`primary` com `primary-foreground`).

- **Background / Foreground:** fundo da página e texto principal.
- **Card:** superfície do cartão.
- **Popover:** superfície flutuante: popover, menu e lista do select.
- **Primary:** a ação principal.
- **Secondary:** a ação secundária.
- **Muted:** superfície apagada; `muted-foreground` é o texto de apoio (descrição, legenda).
- **Accent:** hover e item focado em menu e lista.
- **Destructive:** ação destrutiva e erro.
- **Border, Input, Ring:** borda, borda de campo e anel de foco.
- **Chart 1–5:** séries de gráfico.
- **Sidebar:** os mesmos papéis, na barra lateral.

## Typography

Geist no texto e Geist Mono no código, da análise da Vercel. A documentação do shadcn/ui não define escala tipográfica.

- **Display (`xl`, `lg`, `md`, `sm`):** títulos, peso 600, tracking negativo.
- **Body (`lg`, `md`, `sm`):** texto corrido, peso 400; a variante `-strong` tem peso 500.
- **Caption:** legenda e metadado, 12px.
- **Code, caption-mono:** código e rótulo técnico, em Geist Mono.
- **Button (`md`, `lg`):** rótulo de botão, peso 500; `button-md` (14px) é o do botão padrão.

## Layout

A escala `spacing` vai de 4px a 64px, da análise da Vercel. Ela coincide com a escala padrão do Tailwind, em múltiplos de 4px: `xxs` = `1`, `xs` = `2`, `sm` = `3`, `md` = `4`, `lg` = `6`, `xl` = `8`, `2xl` = `10`, `3xl` = `12` e `4xl` = `16` (`p-4` = 16px). O `@metri/ui` não declara espaçamento próprio (`.metri/architecture/defaults/ui.md`, "Tipografia e espaçamento").

A densidade é a dos componentes do shadcn/ui: botão e campo com 36px de altura, cartão e dialog com 24px de padding.

## Elevation & Depth

A hierarquia vem da borda (`border`) e de sombras curtas, as do Tailwind que os componentes do shadcn/ui usam:

- `shadow-xs` no campo, no checkbox, no switch e no botão `outline`;
- `shadow-sm` no cartão;
- `shadow-md` no popover, no menu e na lista do select;
- `shadow-lg` no dialog, sobre overlay preto a 50%.

## Shapes

O raio base é o `--radius` do shadcn/ui, 0.625rem (`rounded.lg`). Os demais são múltiplos dele: `sm` 0,6×, `md` 0,8×, `xl` 1,4×, `2xl` 1,8×, `3xl` 2,2× e `4xl` 2,6×.

- `md`: botão, campo, popover, menu e tooltip.
- `lg`: dialog.
- `xl`: cartão.
- `full`: badge e switch.

## Components

Os primitivos são os do shadcn/ui, no estilo new-york, expostos pelo `@metri/ui` (`.metri/architecture/defaults/ui.md`).

- **Button:** `variant` `default`, `secondary`, `outline`, `ghost`, `destructive` e `link`; `size` `default` (36px), `xs` (24px), `sm` (32px), `lg` (40px), `icon`, `icon-xs`, `icon-sm` e `icon-lg`.
- **Badge:** `variant` `default`, `secondary`, `destructive`, `outline`, `ghost` e `link`; 12px, peso 500, raio `full`.
- **Card:** partes `Header`, `Title`, `Description`, `Action`, `Content` e `Footer`.
- **Campos:** Input, Textarea, Input Group, Select, Checkbox, Switch e Label; Field agrupa rótulo, controle, descrição e erro.
- **Camadas:** Dialog, Alert Dialog, Popover, Dropdown Menu e Tooltip.
- **Estrutura:** Tabs, Table, Pagination e Separator.
- **Estados:** Skeleton (carregamento), Spinner (ação em voo), Empty (vazio, mídia `default` ou `icon`) e Sonner (notificação).

## Do's and Don'ts

- Faça: cada superfície com o `-foreground` do par (`bg-primary` com `text-primary-foreground`).
- Faça: `primary` na ação principal da tela; `destructive` só em ação destrutiva e erro.
- Faça: cor nova com valor claro e escuro e, se for superfície, com o par `-foreground`.
- Não faça: cor sem valor escuro.
- Não faça: raio fora da escala `rounded`.

## Fonte

Acesso em 26/09/2026.

- Formato: especificação DESIGN.md do Google, versão `alpha`: https://github.com/google-labs-code/design.md/blob/main/docs/spec.md
- getdesign.md: https://getdesign.md/ não tem DESIGN.md do shadcn/ui (a busca por "shadcn" volta vazia).
- Ponto de partida: o DESIGN.md da Vercel no getdesign.md, https://getdesign.md/vercel/design-md (arquivo: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/vercel/DESIGN.md). Dele vêm a tipografia, a escala de espaçamento e o raio `full`.
- Cores da base neutral, em claro e escuro, e escala de raio: https://ui.shadcn.com/docs/theming
- Dark mode no Vite: https://ui.shadcn.com/docs/dark-mode/vite
- Componentes, variantes, tamanhos e classes (estilo new-york, Tailwind v4): https://ui.shadcn.com/docs/components e https://ui.shadcn.com/r/styles/new-york-v4/<componente>.json
- Onde a análise da Vercel diverge da documentação do shadcn/ui (cores, raio), vale a documentação do shadcn/ui.
