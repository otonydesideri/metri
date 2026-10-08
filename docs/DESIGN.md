---
version: alpha
name: Metri
description: Identidade visual do Metri, no padrão do coss ui (o estilo `@coss/style` com as cores `@coss/colors-neutral`), em claro e escuro, com Inter no texto e Geist Mono no código.

colors:
  accent: "--alpha(var(--color-black) / 4%)"
  accent-foreground: "var(--color-neutral-800)"
  background: "var(--color-white)"
  border: "--alpha(var(--color-black) / 8%)"
  card: "var(--color-white)"
  card-foreground: "var(--color-neutral-800)"
  destructive: "var(--color-red-500)"
  destructive-foreground: "var(--color-red-700)"
  foreground: "var(--color-neutral-800)"
  info: "var(--color-blue-500)"
  info-foreground: "var(--color-blue-700)"
  input: "--alpha(var(--color-black) / 10%)"
  muted: "--alpha(var(--color-black) / 4%)"
  muted-foreground: "color-mix(in srgb, var(--color-neutral-500) 90%, var(--color-black))"
  popover: "var(--color-white)"
  popover-foreground: "var(--color-neutral-800)"
  primary: "var(--color-neutral-800)"
  primary-foreground: "var(--color-neutral-50)"
  ring: "var(--color-neutral-400)"
  secondary: "--alpha(var(--color-black) / 4%)"
  secondary-foreground: "var(--color-neutral-800)"
  success: "var(--color-emerald-500)"
  success-foreground: "var(--color-emerald-700)"
  warning: "var(--color-amber-500)"
  warning-foreground: "var(--color-amber-700)"
  chart-1: "var(--color-orange-600)"
  chart-2: "var(--color-teal-600)"
  chart-3: "var(--color-cyan-900)"
  chart-4: "var(--color-amber-400)"
  chart-5: "var(--color-amber-500)"
  code: "var(--color-white)"
  code-foreground: "var(--foreground)"
  code-highlight: "--alpha(var(--color-black) / 4%)"
  sidebar: "var(--color-neutral-50)"
  sidebar-accent: "--alpha(var(--color-black) / 4%)"
  sidebar-accent-foreground: "var(--color-neutral-800)"
  sidebar-border: "--alpha(var(--color-black) / 6%)"
  sidebar-foreground: "color-mix(in srgb, var(--color-neutral-800) 64%, var(--sidebar))"
  sidebar-primary: "var(--color-neutral-800)"
  sidebar-primary-foreground: "var(--color-neutral-50)"
  sidebar-ring: "var(--color-neutral-400)"
  accent-dark: "--alpha(var(--color-white) / 4%)"
  accent-foreground-dark: "var(--color-neutral-100)"
  background-dark: "color-mix(in srgb, var(--color-neutral-950) 95%, var(--color-white))"
  border-dark: "--alpha(var(--color-white) / 6%)"
  card-dark: "color-mix(in srgb, var(--background) 98%, var(--color-white))"
  card-foreground-dark: "var(--color-neutral-100)"
  destructive-dark: "color-mix(in srgb, var(--color-red-500) 90%, var(--color-white))"
  destructive-foreground-dark: "var(--color-red-400)"
  foreground-dark: "var(--color-neutral-100)"
  info-dark: "var(--color-blue-500)"
  info-foreground-dark: "var(--color-blue-400)"
  input-dark: "--alpha(var(--color-white) / 8%)"
  muted-dark: "--alpha(var(--color-white) / 4%)"
  muted-foreground-dark: "color-mix(in srgb, var(--color-neutral-500) 90%, var(--color-white))"
  popover-dark: "color-mix(in srgb, var(--background) 98%, var(--color-white))"
  popover-foreground-dark: "var(--color-neutral-100)"
  primary-dark: "var(--color-neutral-100)"
  primary-foreground-dark: "var(--color-neutral-800)"
  ring-dark: "var(--color-neutral-500)"
  secondary-dark: "--alpha(var(--color-white) / 4%)"
  secondary-foreground-dark: "var(--color-neutral-100)"
  success-dark: "var(--color-emerald-500)"
  success-foreground-dark: "var(--color-emerald-400)"
  warning-dark: "var(--color-amber-500)"
  warning-foreground-dark: "var(--color-amber-400)"
  chart-1-dark: "var(--color-blue-700)"
  chart-2-dark: "var(--color-emerald-500)"
  chart-3-dark: "var(--color-amber-500)"
  chart-4-dark: "var(--color-purple-500)"
  chart-5-dark: "var(--color-rose-500)"
  code-dark: "color-mix(in srgb, var(--background) 98%, var(--color-white))"
  code-foreground-dark: "var(--foreground)"
  code-highlight-dark: "--alpha(var(--color-white) / 4%)"
  sidebar-dark: "color-mix(in srgb, var(--color-neutral-950) 97%, var(--color-white))"
  sidebar-accent-dark: "--alpha(var(--color-white) / 4%)"
  sidebar-accent-foreground-dark: "var(--color-neutral-100)"
  sidebar-border-dark: "--alpha(var(--color-white) / 5%)"
  sidebar-foreground-dark: "color-mix(in srgb, var(--color-neutral-100) 64%, var(--sidebar))"
  sidebar-primary-dark: "var(--color-neutral-100)"
  sidebar-primary-foreground-dark: "var(--color-neutral-800)"
  sidebar-ring-dark: "var(--color-neutral-400)"

rounded:
  lg: 0.625rem

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
---

# Design: Metri

## Overview

O Metri usa o visual do coss ui como ele é, sem marca própria por enquanto. Os tokens, as fontes e as cores vêm do registry do coss, e este arquivo registra esses valores e os desvios do Metri. Hoje não há desvio.

- Biblioteca: coss ui no `@metri/ui`, instalado pelo CLI do shadcn a partir do registry do coss, no lugar do shadcn/ui (ADR-0006).
- Código do tema: `packages/ui/src/styles/globals.css`, que segue os tokens deste arquivo.
- Aparelhos: computador primeiro. Toda tela também funciona no celular, como exige a regra `frontend/experience`.
- Densidade: a do coss e do cal.com, de mouse e teclado.
- Tema: escuro por padrão, claro por escolha (ADR-0007).
- Referências:
  - Linear: atalhos de teclado e status sem ruído.
  - Morphite: a conversa com o Coordinator, o mapa de Runs e o Conhecimento.
  - cal.com com coss ui: o visual dos componentes.
  - Orca (https://www.onorca.dev): a ordem por atenção (o que precisa de você primeiro), o aviso com o estado e a prévia da última mensagem, a conversa que resume um lote de ferramentas numa frase e o diff de cada turno, e os estados "sem atualização" e "interrompido" separados de "falhou".
- A evitar: gradiente decorativo; avatar, persona e os Departments e Teams do Morphite; spinner de tela cheia; toast que some para erro de operação; status só por cor; arrastar entre colunas; o terminal cru do harness.

Princípios de experiência:

1. O que espera você está sempre a um clique: a Inbox e o contador ficam visíveis em toda tela, e a Visão geral mostra um próximo passo só.
2. Estado é texto: todo status tem rótulo em português, com o identificador no tooltip; nenhum estado é só cor, e nenhum muda por arrastar.
3. Eficiente no teclado: atalho para cada ação principal e listas que mostram muito sem rolar. A densidade e o visual seguem o padrão do coss e do cal.com, não o do Linear.
4. O erro fica onde aconteceu: operação recusada mostra o erro inteiro junto do controle que a disparou. O toast serve para confirmar ações e nunca para mostrar erro.
5. Agente é função: papel com ícone e nome de função, sem avatar nem persona; a conversa é montada dos eventos, nunca o terminal cru.

Um princípio pode ser contrariado numa tela quando o desvio vem justificado no portão de padrão daquela tela e o humano o aprova.

## Colors

Os tokens são as CSS variables de tema do coss, com o mesmo nome. O token sem sufixo é o valor claro (`:root`); o sufixo `-dark` é o valor escuro (`.dark`).

Os valores são os do coss, copiados como estão: referências à paleta do Tailwind (`var(--color-neutral-800)`), a função `--alpha()` do Tailwind e `color-mix()`. O `metri design-tokens` compara esses valores com o tema pelo texto exato.

Pares de superfície e texto: o token base é a cor da superfície, e o `-foreground` é a cor do texto e do ícone sobre ela.

- Background e Foreground: fundo da página e texto principal.
- Card e Popover: superfície do cartão e superfície flutuante (popover, menu, lista).
- Primary: a ação principal. Secondary: a ação secundária.
- Muted: superfície apagada; `muted-foreground` é o texto de apoio.
- Accent: hover e item focado em menu e lista.
- Destructive, Success, Warning e Info: erro e ação destrutiva, sucesso, atenção e informação. Pelo princípio 2, essas cores sempre acompanham um rótulo.
- Border, Input e Ring: borda, borda de campo e anel de foco.
- Code, `code-foreground` e `code-highlight`: bloco de código e linha destacada.
- Chart 1 a 5: séries de gráfico.
- Sidebar: os mesmos papéis, na barra lateral.

Em relação ao shadcn/ui, o coss acrescenta Success, Warning, Info, `destructive-foreground` e os tokens de código.

## Typography

Inter no texto e nos títulos (`--font-sans` e `--font-heading`) e Geist Mono no código (`--font-mono`), as fontes do `@coss/fonts`, servidas pelo projeto. Os componentes do coss usam a escala padrão de tamanhos do Tailwind. Os níveis de texto deste arquivo, que viram `--text-<nível>` no tema, se definem no ticket do design system.

## Layout

A escala `spacing` é a padrão do Tailwind, em múltiplos de 4px: `xxs` = `1`, `xs` = `2`, `sm` = `3`, `md` = `4`, `lg` = `6`, `xl` = `8`, `2xl` = `10`, `3xl` = `12` e `4xl` = `16`. A densidade é a dos componentes do coss.

## Elevation & Depth

A hierarquia vem da borda translúcida (`border`, com `--alpha()`) e das sombras dos componentes do coss. A borda translúcida depende dos valores do coss: com tokens de outro estilo, bordas e sombras ficam inconsistentes.

## Shapes

O raio base é o `--radius` do coss, 0.625rem (`rounded.lg`). Os demais raios são os que o estilo do coss deriva dele.

## Components

Os primitivos são os do coss ui, feitos sobre Base UI e expostos pelo `@metri/ui`.

- Ações: Button, Toggle e Toggle Group.
- Campos: Field, Fieldset, Input, Textarea, Select, Combobox, Autocomplete, Checkbox, Switch e Radio Group; o formulário usa react-hook-form com Zod.
- Camadas: Dialog, Alert Dialog, Sheet, Drawer, Popover, Menu e Tooltip.
- Estrutura: Tabs, Table, Sidebar, Card e Separator. Tabela de dados é `Table` com TanStack Table.
- Busca e comando: Command, a paleta de comandos, e Kbd, que mostra o atalho de teclado.
- Estados: Skeleton, Spinner, Empty e Badge.
- Notificação: o Toast do Base UI, só para confirmar ações (princípio 4).

## Do's and Don'ts

- Faça: cada superfície com o `-foreground` do par (`bg-primary` com `text-primary-foreground`).
- Faça: `primary` na ação principal da tela; `destructive` só em ação destrutiva e erro.
- Faça: cor de estado (Success, Warning, Info, Destructive) sempre com rótulo.
- Faça: texto que só afirma o que tem evidência; "concluído" só depois que a verificação confirmou.
- Faça: contraste AA em texto e controles, nos dois temas, conferido pelo axe-core nos testes de Playwright de cada tela.
- Faça: todo texto da interface sai de um arquivo plano por idioma, `locales/pt-BR/common.json`, com chaves em snake_case e em inglês, lido pelo hook `useLocale()`, como no cal.com (`calcom/cal.com@54343aa`, `packages/i18n/locales/` e `packages/lib/hooks/useLocale.ts`); a interface é só em pt-BR.
- Faça: cor nova com valor claro e escuro e, se for superfície, com o par `-foreground`; um desvio do coss entra aqui, na seção Overview.
- Não faça: cor sem valor escuro.
- Não faça: toast para erro de operação.

## Telas canônicas

## Fonte

Acesso em 04/10/2026.

- Formato: especificação DESIGN.md do Google, versão `alpha`: https://github.com/google-labs-code/design.md/blob/main/docs/spec.md
- Cores, raio e fontes: https://coss.com/ui/r/style.json e https://coss.com/ui/r/colors-neutral.json, iguais ao commit `dd49ec9` de https://github.com/cosscom/coss (`apps/ui`, MIT).
- Estilo, tokens extras e Base UI: https://coss.com/ui/docs/styling
- Fontes: Inter e Geist Mono, SIL OFL 1.1.
