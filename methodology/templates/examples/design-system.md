---
id: frontend/design-system
description: "o consumo do design system pelo app — o vocabulário visual que as telas falam: navegação, página, superfície, tabela, paginação, status, lista de propriedades, formulário, ação em voo e ação irreversível."
use_when:
  - "montar header, superfície, tabela, paginação, status, lista de propriedades, layout de formulário ou ação de uma tela"
not_covered:
  - "o desenho do sistema de tokens e dos componentes, que é do `@metri/ui` → defaults/ui"
  - "o uso de token e tema no código → frontend/theming"
  - "composição de página e componente e estados de leitura → frontend/components"
  - "comportamento de formulário e acessibilidade de campo → frontend/forms"
  - "rota, modal de tarefa e fallback de carregamento → frontend/routing"
  - "a casa da config de navegação → frontend/structure"
  - "a casa da constante → frontend/helpers"
  - "a promoção de peça ao pacote → general/code-placement"
status: active
---
# Design system no frontend

O `@metri/ui` é o dono do design system do monorepo; este documento fixa só como o `app-web` o consome, sem inventar valor nem vocabulário próprio. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Ferramentas

| Ferramenta | Status | Decisão |
| --- | --- | --- |
| `@metri/ui` (shadcn/ui, tokens na config do Tailwind) | DECIDIDA | `defaults/ui.md` |

## Regras

### Vocabulário visual

**Obrigatório.** As telas falam o vocabulário do shadcn/ui que o `@metri/ui` herda por inteiro, em vez de um subconjunto, na forma canônica abaixo.

Forma canônica:

- **Navegação.** O menu é dado, não JSX: uma config declarativa, que toda superfície de navegação consome — sidebar e topbar leem a mesma fonte e nunca chegam a menus diferentes. Link de destino já decidido mas tela ainda não construída é estado de primeira classe (`disabled`), anunciado sem deixar chegar: `aria-disabled` acompanhado de `tabIndex={-1}`, porque sem o segundo o Enter ainda navega. A casa física da config é `shared/config/` (`frontend/structure.md`).
- **Página.** O `PageHeader` (`shared/components/`, compound — `frontend/components.md`, "Composição e o que sobe pro pacote") carrega a anatomia inteira: ícone num círculo de 48px (`bg-background shadow-xs ring-1 ring-inset ring-border`), título `text-base font-medium lg:text-lg`, descrição `text-sm text-muted-foreground`, ações à direita (secundária `outline` antes da primária `default`) e o divider embutido — página sem header não herda divider órfão do shell. O corpo da página ancora no container canônico `flex flex-1 flex-col px-4 py-6 lg:px-8`; é essa cadeia de flex que permite `mt-auto` grudar a paginação no rodapé.
- **Superfície.** O canvas é o fundo do tema (`bg-background`), estruturado por divisores. Card — o `Card.Root` — é só para widget, navegação e opção selecionável; tabela, formulário e header nunca ficam dentro de card.
- **Tabela.** Coluna com `min-w-*` para não quebrar; coluna numérica alinha à direita no head e na célula; o primitivo de divisor de linha do `@metri/ui` entre linhas, nunca depois da última; densidade `h-12` na célula. A responsividade é do contêiner `overflow-x-auto` que o `Table.Root` monta em volta da tabela (o `className` vai para a `<table>`), e a sangria mobile é `-mx-4 w-auto px-4 lg:mx-0 lg:w-full lg:px-0`. Linha clicável é atalho de mouse; o caminho acessível é o link da coluna de ações, com o nome acessível que nomeia o alvo ("Ver detalhes do pedido de Ana", `frontend/forms.md`, "Rótulo, descrição e o nome acessível do controle"). Uma ação por linha é link direto; `DropdownMenu` entra a partir da segunda.
- **Paginação.** Zonas: o resumo "Página X de Y" à esquerda, números (`Pagination.Link` com `isActive`) entre `Pagination.Previous` e `Pagination.Next` no desktop; no mobile, Anterior/Próxima com o resumo entre eles.
- **Status.** Estado de ciclo de vida usa o primitivo de status do `@metri/ui`: a variante de contorno com ponto em linha de tabela, a variante clara em destaque de detalhe. `Badge` fica para tag e contador. O `Record<Status, { label, status }>` de apresentação é a semântica visual do status; a casa física dele segue a regra de constante de `frontend/helpers.md`, "Constantes", e a ausência de spec próprio segue `frontend/testing.md`, "O que não tem spec próprio" — sem um componente wrapper só para carregar o mapa (`frontend/components.md`, "Um arquivo, um componente").
- **Lista de propriedades.** Chave `text-xs font-medium uppercase text-muted-foreground` sobre valor `text-sm font-medium text-foreground`; seções separadas pelo primitivo de divisor com texto do `@metri/ui`; o valor-herói do registro em `text-3xl font-medium`.
- **Formulário.** Seções com título `text-base font-medium` + descrição `text-sm text-muted-foreground` seguidos de `Separator.Root`; campo em `flex flex-col gap-1` (rótulo, controle, hint). O fecho é o par Cancelar (`outline`, link para o caminho de saída) e submissão (`default`) num `grid grid-cols-2 gap-3` depois de um divider — formulário sempre tem como desistir.
- **Ação em voo e ação irreversível.** Botão com escrita em andamento antepõe o `Spinner.Root` e troca o rótulo para o gerúndio ("Cancelando..."), sem mudar de largura por troca de texto seco. Ação irreversível intercepta com `AlertDialog` de confirmação — peça da pasta do dono da tela (`frontend/structure.md`), que recebe `open`/`onConfirm` prontos — com a consequência descrita e o par "Manter"/destrutivo (`variant="destructive"`); os rótulos fogem do duplo "Cancelar" ambíguo.

## Aplicação

- O `AppSplash` e o `index.html` pintam o fundo com o token do canvas (`frontend/routing.md`, "Página carregada com lazy").

## Verificação

- A tela fala o vocabulário visual inteiro: header com ícone e divider, corpo no container canônico, tabela com numérico à direita e link acessível por linha, status no primitivo de status do `@metri/ui`, formulário com par Cancelar/submissão?
- Ação irreversível intercepta com modal de confirmação, e escrita em andamento mostra spinner + gerúndio no próprio botão?
- O menu vem da config declarativa de `shared/config/`, com link desabilitado usando `aria-disabled` + `tabIndex={-1}`?

## Referências

- `frontend/components.md`: composição, compound do app e um arquivo por componente.
- `frontend/forms.md`: comportamento e acessibilidade do formulário.
- `frontend/routing.md`: o fallback de carregamento que usa o token do canvas.
- `frontend/structure.md`: a casa de `shared/config/` e `shared/components/`.
- `frontend/helpers.md`: a casa da constante.
- `general/code-placement.md`: a promoção de peça ao pacote.
