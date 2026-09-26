# Design system no frontend

Dono de: o consumo do design system pelo app — os tokens de UI, o tema (o contrato de classe do `@metri/ui` e o provider por framework) e o vocabulário visual que as telas falam: navegação, página, superfície, tabela, paginação, status, lista de propriedades, formulário, ação em voo e ação irreversível.

Consultar antes de: escolher cor, espaçamento ou tipografia; mexer em tema ou no provider de tema; montar header, superfície, tabela, paginação, status em `StatusBadge`, lista de propriedades, layout de formulário ou ação de uma tela.

Não cobre: o desenho do sistema de tokens e dos componentes, que é do `@metri/ui`; composição de página e componente e estados de leitura (`frontend/components.md`); comportamento de formulário e acessibilidade de campo (`frontend/forms.md`); rota, modal de tarefa e fallback de carregamento (`frontend/routing.md`); a casa da config de navegação e da constante (`frontend/structure.md`, `frontend/helpers.md`); a promoção de peça ao pacote (`overview.md`).

O `@metri/ui` é o dono do design system do monorepo; este documento fixa só como o `app-web` o consome, sem inventar valor nem vocabulário próprio. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Ferramentas

| Ferramenta | Status | Decisão |
| --- | --- | --- |
| `@metri/ui` (tokens na config do Tailwind, vocabulário AlignUI) | DECIDIDA | `overview.md`, "Stack" |

## Regras

### Tokens de UI vêm do design system

**Obrigatório.** Cor, espaçamento e tipografia vêm dos tokens do `@metri/ui` (config do Tailwind): `text-title-h6`, `bg-bg-white-0`, `text-text-strong-950`.

**Proibido.** Valor arbitrário cravado no componente (`text-[20px]`, `bg-[#fff]`, `p-[16px]`).

> **Por quê.** Valor arbitrário foge do design system e não acompanha token nem tema.

Quando falta um token: **Obrigatório.** Checar primeiro se ele já existe no `@metri/ui`; se for genuinamente novo, a adição é no `@metri/ui`, nunca um valor solto no app.

### Tema: contrato de classe no `@metri/ui`, provider por framework do app

**Obrigatório.** O claro/escuro é uma classe (`light`/`dark`) no `documentElement`, e os tokens do `@metri/ui` trocam por ela (`packages/ui/src/styles/globals.css`, `@custom-variant dark`); esse contrato de classe é do pacote.

**Obrigatório.** Quem alterna a classe é o provider de tema do framework do app consumidor; no Vite/SPA (o `app-web`), é o `ThemeProvider` hand-rolled do `@metri/ui` (`@metri/ui/components/providers/theme-provider`), montado em `app/index.tsx`.

**Proibido.** O `@metri/ui` depender de `next-themes`: o pacote é agnóstico de framework, e quem traz a lib é o app.

**Obrigatório.** No app Vite, o `index.html` aplica a classe antes do primeiro paint, num script inline com a mesma chave e o mesmo default do provider.

> **Por quê.** O `useEffect` do provider só roda depois do primeiro paint; sem o script, o primeiro frame sai no tema errado para quem escolheu o escuro.

**Obrigatório.** O tema tem dois valores; a preferência do sistema operacional não entra: sem `system`, e a `prefers-color-scheme` não é consultada nem no provider nem no script inline.

> **Por quê.** Sem `system`, `theme` é sempre o que está na tela, então todo controle lê o mesmo valor e não existe diferença entre o que o usuário pediu e o que está pintado. Trazer `system` de volta reabre essa diferença e exige um segundo valor no contrato do provider, porque um switch claro/escuro não tem como se desenhar a partir de uma escolha de três estados.

**Obrigatório.** O valor para quem nunca escolheu é `light`.

**Obrigatório.** O provider mora no `@metri/ui`, não no app: tema é UI compartilhável entre apps (`overview.md`, "Código pode nascer no pacote dono quando nada nele é do app").

**Proibido.** Componente do pacote chamar o `useTheme()`: quando precisa ramificar por tema, recebe `dark?` por prop, para valer seja qual for o provider do consumidor.

### Vocabulário visual

**Obrigatório.** As telas falam o vocabulário AlignUI que o `@metri/ui` herda por inteiro, em vez de um subconjunto, na forma canônica abaixo.

Forma canônica:

- **Navegação.** O menu é dado, não JSX: uma config declarativa, que toda superfície de navegação consome — sidebar e topbar leem a mesma fonte e nunca chegam a menus diferentes. Link de destino já decidido mas tela ainda não construída é estado de primeira classe (`disabled`), anunciado sem deixar chegar: `aria-disabled` acompanhado de `tabIndex={-1}`, porque sem o segundo o Enter ainda navega. A casa física da config é `shared/config/` (`frontend/structure.md`).
- **Página.** O `PageHeader` (`shared/components/`, compound — `frontend/components.md`, "Composição e o que sobe pro pacote") carrega a anatomia inteira: ícone num círculo de 48px (`bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200`), título `text-label-md lg:text-label-lg`, descrição `text-paragraph-sm text-text-sub-600`, ações à direita (secundária stroke antes da primária filled) e o divider embutido — página sem header não herda divider órfão do shell. O corpo da página ancora no container canônico `flex flex-1 flex-col px-4 py-6 lg:px-8`; é essa cadeia de flex que permite `mt-auto` grudar a paginação no rodapé.
- **Superfície.** O canvas é branco (`bg-bg-white-0`), estruturado por divisores. Card — a tripla `rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200` — é só para widget, navegação e opção selecionável; tabela, formulário e header nunca ficam dentro de card.
- **Tabela.** Coluna com `min-w-*` para não quebrar; coluna numérica alinha à direita no head e na célula; `Table.RowDivider` entre linhas, nunca depois da última; densidade `h-12` na célula. A responsividade é do wrapper: o `className` do `Table.Root` cai no `overflow-x-auto`, e a sangria mobile é `-mx-4 w-auto px-4 lg:mx-0 lg:w-full lg:px-0`. Linha clicável é atalho de mouse; o caminho acessível é o link da coluna de ações, com o nome acessível que nomeia o alvo ("Ver detalhes do pedido de Ana", `frontend/forms.md`, "Rótulo, descrição e o nome acessível do controle"). Uma ação por linha é link direto; `Dropdown` entra a partir da segunda.
- **Paginação.** Zonas: o resumo "Página X de Y" à esquerda, números (`Pagination.Item current`) com `NavButton` de ícone no desktop; no mobile, Anterior/Próxima com o resumo entre eles.
- **Status.** Estado de ciclo de vida usa `StatusBadge`: `stroke` + `Dot` em linha de tabela, `light` em destaque de detalhe. `Badge` fica para tag e contador. O `Record<Status, { label, status }>` de apresentação é a semântica visual do status; a casa física dele segue a regra de constante de `frontend/helpers.md`, "Constantes", e a ausência de spec próprio segue `frontend/testing.md`, "O que não tem spec próprio" — sem um componente wrapper só para carregar o mapa (`frontend/components.md`, "Um arquivo, um componente").
- **Lista de propriedades.** Chave `text-subheading-xs uppercase text-text-soft-400` sobre valor `text-label-sm text-text-strong-950`; seções separadas por `Divider variant="solid-text"`; o valor-herói do registro em `text-title-h4`.
- **Formulário.** Seções com título `text-label-md` + descrição `text-paragraph-sm text-text-sub-600` seguidos de `Divider variant="line-spacing"`; campo em `flex flex-col gap-1` (rótulo, controle, hint). O fecho é o par Cancelar (neutral/stroke, link para o caminho de saída) e submissão (primary/filled) num `grid grid-cols-2 gap-3` depois de um divider — formulário sempre tem como desistir.
- **Ação em voo e ação irreversível.** Botão com escrita em andamento antepõe o spinner (`RiLoader4Line` girando) e troca o rótulo para o gerúndio ("Cancelando..."), sem mudar de largura por troca de texto seco. Ação irreversível intercepta com `Modal` de confirmação — peça da pasta do dono da tela (`frontend/structure.md`), que recebe `open`/`onConfirm` prontos — com a consequência descrita e o par "Manter"/destrutivo (`variant="error"`); os rótulos fogem do duplo "Cancelar" ambíguo.

## Aplicação

```tsx
// CORRETO
<div className="bg-bg-white-0 text-text-strong-950 p-4 rounded-md">

// EVITAR
<div className="bg-[#ffffff] text-[#0a0a0a] p-[16px] rounded-[6px]">
```

- Um app Next usaria o `next-themes` com `attribute="class"`, que escreve a mesma classe; é esse o motivo de o pacote não depender dele.
- O `ThemeProvider` do `@metri/ui` inicializa do `localStorage`, e um `useEffect` remove `light`/`dark` do `documentElement` e adiciona a classe do tema; `useTheme()` expõe `theme` e `setTheme` para o toggle.
- Preferência de tema não é estado de store (`frontend/state.md`, "Tema não é estado de store"): é este provider, montado em `app/`.
- O `AppSplash` e o `index.html` pintam o fundo com o token do canvas (`frontend/routing.md`, "Página carregada com lazy").

## Verificação

- As classes de UI usam token do `@metri/ui`, sem valor arbitrário (`bg-[#...]`, `p-[16px]`)?
- Tema: app Vite monta o `ThemeProvider` do `@metri/ui` (app Next usaria `next-themes`), com a classe aplicada pelo script inline antes do primeiro paint, dois valores e default `light`?
- Componente do pacote ramifica por `dark?`, não pelo `useTheme()` do pacote?
- A tela fala o vocabulário visual inteiro: header com ícone e divider, corpo no container canônico, tabela com numérico à direita e link acessível por linha, status em `StatusBadge`, formulário com par Cancelar/submissão?
- Ação irreversível intercepta com modal de confirmação, e escrita em andamento mostra spinner + gerúndio no próprio botão?
- O menu vem da config declarativa de `shared/config/`, com link desabilitado usando `aria-disabled` + `tabIndex={-1}`?

## Referências

- `frontend/components.md`: composição, compound do app e um arquivo por componente.
- `frontend/forms.md`: comportamento e acessibilidade do formulário.
- `frontend/routing.md`: o fallback de carregamento que usa o token do canvas.
- `frontend/state.md`: tema fora da árvore de estado cliente.
- `frontend/structure.md`: a casa de `shared/config/` e `shared/components/`.
- `frontend/helpers.md`: a casa da constante.
- `overview.md`: a promoção de peça ao pacote.
