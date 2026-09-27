---
id: frontend/experience
description: "a experiência de uma tela do `app-web` — hierarquia, fluxo, interação, composição, conteúdo, desktop e mobile — e a evidência em screenshot de cada critério de UI."
use_when:
  - "construir ou mudar uma página ou uma rota do `app-web`"
  - "escrever os critérios de UI de um UC"
  - "julgar uma tela pela evidência"
applies_to:
  - "apps/app-web/src/pages/**/*.tsx"
  - "apps/app-web/src/app/router/**"
keywords: [experiência, UX, hierarquia, ação principal, fluxo, próximo passo, retorno, desfazer, teclado, foco visível, tela canônica, referência, rótulo, dado de desenvolvimento, desktop, mobile, screenshot, evidência]
read_first: [frontend/components]
not_covered:
  - "o formulário e a mensagem de campo → frontend/forms"
  - "tokens, cores e o tema → frontend/theming"
  - "o e2e que salva a evidência (\"E2e de critério de UI\") → frontend/testing"
  - "a identidade visual, os princípios e as telas canônicas do projeto → project:DESIGN"
enforced_by: [docs-lint]
status: active
---
# Experiência de tela

Uma tela do `app-web` cumpre o UC com o menor esforço de quem a usa; a forma visual vem do `docs/DESIGN.md`, e os estados de leitura, de `frontend/components.md`.

## Hierarquia

**Obrigatório.** A tela tem uma ação principal, com o maior peso visual dela.

**Obrigatório.** O que o usuário procura primeiro aparece primeiro, e tamanho, peso e contraste seguem a ordem de importância.

## Fluxo

**Obrigatório.** O UC se cumpre no menor número de passos.

**Obrigatório.** Depois de cada ação, o resultado aparece e o próximo passo é óbvio; toda tela tem saída.

## Interação

**Obrigatório.** Toda ação tem retorno imediato: em andamento, sucesso, e erro com o que fazer.

Quando a ação é destrutiva: **Padrão.** Desfazer; confirmar só quando desfazer não é possível.

**Obrigatório.** Tudo funciona por teclado, com o foco visível.

## Composição

**Obrigatório.** A tela parte de uma tela canônica ou de uma referência do `docs/DESIGN.md`.

**Padrão.** Agrupar por proximidade e alinhamento antes de recorrer a borda e card, com o espaçamento e a densidade dos tokens e do `docs/DESIGN.md`.

## Conteúdo

**Obrigatório.** O texto usa os termos do `docs/CONTEXT.md`, e o rótulo de uma ação diz o resultado dela ("Confirmar pedido").

**Obrigatório.** O dado de desenvolvimento é realista, na língua do produto: zero, um e muitos itens, e textos longos.

## Desktop, mobile e evidência

**Obrigatório.** A tela funciona em desktop e em mobile.

**Obrigatório.** Cada critério de UI de um UC tem screenshot em desktop e em mobile na pasta do ticket: `.metri/tickets/<id>/<n>-desktop.png` e `<n>-mobile.png`, com `<n>` a ordem do critério.

## Verificação

- A tela tem uma ação principal, com o maior peso, e o que se procura primeiro vem primeiro?
- O UC se cumpre no menor número de passos, com o resultado e o próximo passo visíveis depois de cada ação, e toda tela tem saída?
- Toda ação tem retorno imediato, a destrutiva desfaz (ou confirma, quando não dá para desfazer), e o teclado alcança tudo com foco visível?
- A tela parte de uma tela canônica ou de uma referência, agrupada por proximidade e alinhamento?
- Os textos usam os termos do `docs/CONTEXT.md`, os rótulos dizem o resultado e os dados são realistas?
- A tela funciona em desktop e em mobile?
- Todo critério de UI de um ticket `done` tem os dois screenshots na pasta do ticket? (check: docs-lint)
