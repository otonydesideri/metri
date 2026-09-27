---
id: frontend/state
description: "o estado cliente do `app-web`, que vive só no navegador — a divisão entre estado servidor e estado cliente; a árvore que roteia cada dado para URL, `useState`, Context ou Zustand; a limpeza do estado na troca de dono; a persistência que sobrevive a refresh."
use_when:
  - "introduzir estado de tela que atravessa componentes"
  - "decidir se um estado do navegador mora na URL, em `useState`, em Context ou em Zustand"
  - "guardar paginação, filtro, tab, busca ou ordenação na URL"
  - "abrir um store ou um context novo"
  - "persistir estado do navegador entre refreshes"
applies_to:
  - "apps/app-web/src/shared/stores/**"
  - "apps/app-web/src/shared/contexts/**"
  - "apps/app-web/src/pages/**/use-*-params.ts"
keywords: [estado cliente, estado servidor, URL state, useSearchParams, search params, "use-<tela>-params.ts", useState, useBoolean, Context, createContext, Provider, Zustand, useShallow, selector, persist, localStorage, useLocalStorage, troca de dono, queryClient.clear, nuqs, Jotai, tema]
not_covered:
  - "o estado servidor, dado que vem ou vai para a API, que fica em React Query → frontend/data-fetching"
examples: [frontend/state.examples.md]
status: active
---
# Estado cliente no frontend

Como o `app-web` guarda estado que vive só no navegador: a divisão entre estado servidor e estado cliente, e a árvore que roteia cada dado pra URL, `useState`, Context ou Zustand.

Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## A divisão fundamental: servidor ou cliente

A primeira pergunta antes de escolher onde um dado mora é a origem dele.

**Estado servidor** é o dado que vem de uma API, vai pra uma API, ou os dois. Mora em React Query e em nenhum outro lugar. Nunca é copiado pra `useState`, Context ou Zustand: uma cópia manual desincroniza da fonte em silêncio no primeiro refetch. A regra prática: se o dado tem dono no backend, ele não vira estado cliente. Biblioteca externa que mantém a própria store reativa de um dado servidor (um client de sessão, por exemplo) é a exceção que confirma a regra — o dado continua sendo servidor e fica com a biblioteca; onde passa essa fronteira, e as ressalvas que devolvem a leitura ao React Query, estão em `frontend/data-fetching.md`, "Comando de biblioteca externa fica no handler".

**Estado cliente** é o dado que existe só no frontend, sem persistência no backend: estado de UI (modal aberto, tab ativa, item selecionado), estado de fluxo (passo atual de um wizard), preferência de sessão. É desse estado que o resto do documento trata.

## A árvore de decisão

Todo estado cliente passa por esta sequência antes de escolher ferramenta. A primeira resposta "sim" decide.

```mermaid
flowchart TD
    A[Estado cliente] --> B{Faz sentido<br/>na URL?<br/>paginação, filtros,<br/>tabs, busca}
    B -- Sim --> URL[URL state<br/>useSearchParams]
    B -- Não --> C{Local a um<br/>único componente?<br/>input, toggle interno}
    C -- Sim --> LOCAL[useState]
    C -- Não --> D{Compartilhado por<br/>uma árvore específica?<br/>wizard, form multi-step}
    D -- Sim --> CTX[Context em contexts/]
    D -- Não --> E{Transversal a várias telas<br/>ou precisa de<br/>subscrição granular?}
    E -- Sim --> STORE[Zustand em stores/]
    E -- Não --> F[Reconsidere:<br/>provavelmente cabe<br/>num passo anterior]
```

O peso da árvore é de cima pra baixo: só se sobe pra Zustand o que nenhum passo anterior cobre. Estado que poderia viver na URL ou num `useState` mas foi parar num store global é a forma mais comum de complexidade desnecessária.

## URL state: paginação, filtros, tabs, busca, ordenação

Estado que faz sentido num link compartilhável deve estar na URL. O ganho é concreto: o link carrega o estado, o refresh não perde nada, e voltar/avançar do navegador funciona sem código extra.

Casos:

- Paginação: `?page=3`.
- Filtros: `?status=ACTIVE&category=premium`.
- Tabs: `?tab=details`.
- Busca: `?q=customer+name`.
- Ordenação: `?sortBy=date&sortOrder=desc`.

No react-router isso não precisa de wrapper próprio: `useSearchParams` devolve o par leitura/escrita, e o updater funcional cobre merge e remoção de chave.

Exemplo completo: state.examples.md#orderdetailstabs

Filtro e paginação seguem o mesmo mecanismo, e o valor lido da URL vira parâmetro do hook de React Query. Trocar filtro reescreve a URL, a chave da query muda, e o React Query refetcha com a chave nova (`frontend/data-fetching.md`, "A key factory" e "Paginação: a página anterior fica na tela, a próxima já chega"). A URL é a fonte única do filtro; o componente não guarda uma segunda cópia em `useState`.

```tsx
import { useSearchParams } from 'react-router';
import { useOrders } from '@/hooks/order/use-orders';

export function OrderListPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1');
  const search = searchParams.get('q') ?? undefined;

  const orders = useOrders({ status, page, search });
  // ...
}
```

O `useSearchParams` do react-router entrega tudo como `string`: a conversão pra número, boolean ou enum fica no ponto de leitura. Quando um filtro cresce em número de chaves tipadas e essa conversão vira repetição, a biblioteca `nuqs` entra como próximo degrau, ver Pontos em aberto.

### O hook de params da tela

Enquanto a tela lê um ou dois valores, o `useSearchParams` direto no corpo basta. Quando o conjunto cresce — filtro, busca, página, tamanho de página, ordenação —, leitura e escrita saem pra um `use-<tela>-params.ts` na pasta da tela. Ele é peça do dono (`frontend/structure.md`, "A pasta do dono"), não um hook de `hooks/<módulo>/`: é acoplado àquela listagem, não ao domínio.

O hook concentra três regras que, espalhadas pelos handlers da página, viram cópia:

- **Query string é entrada do usuário.** Todo valor cru passa por validação antes de virar filtro: `safeParse` da união do contrato pra enum, checagem contra a lista fechada de opções pra número com opções fixas. Valor inválido cai no default — e aqui o fallback é legítimo, porque ausência na URL é o caso default real, não ausência mascarada.
- **Mudou o recorte, a página sai da URL.** Filtro, busca, ordenação e tamanho de página redefinem o recorte da lista, então `page` deixa de fazer sentido e é removida na mesma escrita. A invariante é um updater privado que todo setter de recorte atravessa; só o `setPage` escapa dele.
- **A busca escreve na URL depois do debounce.** O input é não controlado (`defaultValue` com o valor da URL): o que o usuário digita não reescreve a URL a cada tecla — só o valor estabilizado pelo debounce vira search param, e o input não remonta nem perde o cursor no meio da digitação.

Exemplo completo: state.examples.md#uselistparams

Os valores que o hook devolve viram o filtro do hook de React Query da listagem, e os nomes dos search params são os da query string da API (`backend/http-api.md`, "União fechada e limite do contrato").

## useState: estado de um único componente

Estado que só um componente lê e escreve fica em `useState`. Modal de confirmação, toggle interno, valor de hover: nada disso precisa sair do componente.

```tsx
function OrderActions() {
  const confirmOpen = useBoolean();

  return (
    <>
      <Button onClick={confirmOpen.onTrue}>Cancelar pedido</Button>
      <ConfirmModal open={confirmOpen.value} onClose={confirmOpen.onFalse} />
    </>
  );
}
```

Envolver isso num Context ou num store global é o anti-padrão inverso: adiciona uma casa de estado compartilhado pra um dado que ninguém compartilha. Boolean de UI usa o `useBoolean` do `@metri/ui` como objeto único, sem desestruturar valor e setter em duas variáveis.

## Context: estado de uma árvore de componentes

Use Context quando o estado é lido por vários componentes de uma árvore específica, mas não sai dela: um wizard onde os passos compartilham o mesmo fluxo, um form complexo com seções coordenadas, um compound component com estado interno.

O arquivo do context mora na casa `shared/contexts/`, por módulo, como as outras casas do `app-web` (`frontend/structure.md`, "Estrutura de pastas"). O nome segue `frontend/structure.md`, "Nomeação de arquivo" (`contexts/<módulo>.tsx`). A casa não vira depósito de estado global: cada context é local a uma árvore, e a separação por módulo é o que evita um Context único inchado.

Exemplo completo: state.examples.md#orderwizardprovider

O Provider é montado local à árvore que o usa, não em `app/`: a página que renderiza o wizard (uma tela de `pages/order/`, por exemplo) envolve só a subárvore do fluxo. Quando essa árvore desmonta, o estado do wizard morre com ela. `app/` fica reservado aos providers globais da aplicação, ver a seção de Zustand e tema abaixo.

Um cuidado com Context: quando o valor do Provider muda, todo componente que chama `useContext` re-renderiza. Numa árvore pequena isso é aceitável. Quando a árvore cresce e o re-render pesa, o caminho é dividir em contexts menores ou, se o estado já não é mais local a uma árvore, subir pra Zustand.

## Zustand: estado transversal a várias telas

Use Zustand quando o estado é compartilhado entre telas diferentes (um carrinho que aparece no header e na página de checkout, um filtro global aplicado em várias listas) ou quando o custo de re-render do Context seria alto e você precisa de subscrição granular. Zustand é a biblioteca de estado global cliente deste projeto; a decisão e o gatilho de revisão estão em Pontos em aberto.

O store mora na casa `shared/stores/`, por módulo (`shared/stores/cart.ts`), com `create<T>()` tipado. Não há Provider: o store é um hook global, e é essa a diferença prática pro Context. Estado e ações moram no mesmo `create`.

A ausência de Provider também decide casos que a árvore acima empurraria pro Context. Um estado cujo gatilho mora num componente de `shared/components/` fica em store mesmo quando só uma árvore o lê: com Provider, aquele componente passa a quebrar em qualquer tela montada fora dela, e `shared/components/` existe justamente pra ser usada de qualquer área. Vale pra abertura de um menu de busca disparada tanto pelo layout quanto pelo cabeçalho de cada tela.

Exemplo completo: state.examples.md#usecartstore

**Selector sempre, nunca o store inteiro.** Um componente subscreve a fatia que usa, não o objeto todo; consumir `useCartStore()` sem selector re-renderiza o componente a cada mudança de qualquer campo. Pra selecionar um valor único, passe o selector direto. Pra selecionar um objeto ou lista derivada, use `useShallow`, senão o novo objeto a cada render dispara re-render por identidade.

```tsx
import { useShallow } from 'zustand/react/shallow';
import { useCartStore } from '@/shared/stores/cart';

export function CartBadge() {
  // fatia primitiva: re-renderiza só quando o tamanho muda
  const count = useCartStore((state) => state.items.length);
  return <Badge count={count}>Carrinho</Badge>;
}

export function CartActions() {
  // seleção de várias fatias: useShallow evita re-render por identidade de objeto
  const { addItem, clear } = useCartStore(
    useShallow((state) => ({ addItem: state.addItem, clear: state.clear })),
  );
  // ...
}
```

**Persistência é decisão por store, não default.** Um store que precisa sobreviver a refresh (um carrinho, por exemplo) usa o middleware `persist` sobre `localStorage`. Store que não precisa não persiste. Dado de um dono específico num store persistido vaza para o próximo usuário do mesmo navegador se ninguém o limpar, e a limpeza segue a seção "Troca de dono: o estado que depende do dono é limpo", adiante.

Um store nasce coeso num arquivo. Quando ele cresce a ponto de misturar fatias sem relação, o padrão de slices do Zustand (compor vários slice creators num `create`) divide sem quebrar o hook; isso é resposta a um store grande demais, não estrutura antecipada. Ver Pontos em aberto.

## Troca de dono: o estado que depende do dono é limpo

Todo evento que troca o dono do dado limpa o estado cuja validade depende do dono: os stores persistidos e o cache de servidor. Sem isso, dado do usuário anterior sobrevive — em disco no store persistido, em memória no cache até o `gcTime` expirar — e vaza em máquina compartilhada. No React Query, a limpeza é o `queryClient.clear()` na instância do `QueryClientProvider` (`frontend/data-fetching.md`, "Provider e configuração").

Nada do cache de servidor vai pra disco: este app não usa `persistQueryClient`.

Enquanto a troca de dono acontecer por navegação top-level, que recria a aplicação, o cache do React Query já nasce vazio e a query key continua sendo só o recurso. Se essa troca puder acontecer dentro da mesma instância da SPA, sem recarregar a página, é a limpeza acima que esvazia o cache antes do próximo dono.

## Tema não é estado de store

Preferência de tema (claro/escuro) não passa pela árvore acima: não é `useState`, não é Context ad-hoc, não é Zustand. É o provider de tema de `docs/DESIGN.md`, montado em `app/`, que persiste a escolha e aplica a classe na raiz do documento.

## Persistência: o que sobrevive a refresh

Persistência é ortogonal à árvore de decisão, não um tier novo: é o `useState` local ou o store global que ganham durabilidade, cada um pelo caminho da própria camada.

- Estado global que sobrevive a refresh: Zustand com `persist` (ver acima), com limpeza no evento que troca o dono do dado.
- Preferência de tema: o provider de tema (ver acima).
- Preferência local a um componente que sobrevive a refresh (banner dispensado, "não mostrar de novo", seção recolhida lembrada localmente): o hook `useLocalStorage` do `@metri/ui`, o tier `useState` com durabilidade, serializado em JSON e seguro em SSR.
- Dado servidor nunca vai pra `localStorage`: o cache é do React Query, e nada dele é persistido (seção "Troca de dono: o estado que depende do dono é limpo").
- **Contexto de navegação nunca é guardado.** Onde o usuário está (o recurso aberto, a seção) sai da URL, e de mais nada: sem `localStorage`, sem "último item acessado". Guardar isso faz a mesma URL produzir telas diferentes conforme o que o navegador lembra, e o link deixa de descrever o que abre. A distinção contra o item acima é o que o dado é: preferência local é como a tela se apresenta, contexto é onde o usuário está.

```tsx
import { useLocalStorage } from '@metri/ui/hooks/use-local-storage';

function OrderWelcomeBanner() {
  const dismissed = useLocalStorage('order:banner-dismissed', false);

  if (dismissed.state) {
    return null;
  }

  return <Banner onClose={() => dismissed.setState(true)} />;
}
```

## Anti-padrões

- **Duplicar estado servidor em estado cliente.** Dado da API mora em React Query. Copiá-lo pra `useState`, Context ou Zustand cria uma segunda fonte que desincroniza sozinha.
- **Context (ou Zustand) pro que é local.** Se um só componente lê o estado, `useState` basta. Casa de estado compartilhado pra dado não compartilhado é complexidade sem contrapartida.
- **Zustand pro que é de uma árvore.** Estado que vive e morre com uma subárvore é Context. Zustand é pro que atravessa telas.
- **Mais de uma fonte de verdade.** Não duplicar o mesmo estado entre URL e `useState`, nem entre Context e Zustand. Uma fonte por dado.
- **Persistir o mesmo dado por dois caminhos.** Um store com `persist` e um `useLocalStorage` manual na mesma chave criam duas fontes de verdade. Dado persistido tem um caminho só.

## Verificação rápida

- O dado vem ou vai pra API? Se sim, está em React Query, e não copiado pra estado cliente?
- O dado faz sentido num link compartilhável (paginação, filtro, tab, busca)? Se sim, está na URL via `useSearchParams`, sem segunda cópia em `useState`?
- Tela com mais de dois search params concentrou leitura validada e escrita num `use-<tela>-params.ts` da pasta do dono, com o reset de página embutido em todo setter de recorte?
- O dado é local a um componente? Se sim, está em `useState`?
- O dado é compartilhado por uma árvore específica? Se sim, está num Context de `contexts/`, com o Provider montado local à árvore?
- O dado atravessa telas ou precisa de subscrição granular? Se sim, está num store de `stores/`, consumido por selector (`useShallow` pra objeto/lista)?
- O evento que troca de dono limpa os stores persistidos e o cache de servidor, sem nada do cache persistido em storage?
- Não há duplicação entre fontes (URL + local, Context + Zustand)?

**Pontos em aberto:** a biblioteca de estado global é Zustand, escolhida por ser o default de menor atrito da comunidade para um app que já tem o estado servidor em React Query, com revisão em aberto: se o formato do estado pedir muitos valores independentes e derivados, com reatividade fina átomo a átomo, reavaliar Jotai (modelo de átomos) contra Zustand (store central) antes de multiplicar stores. A leitura de search params usa `useSearchParams` do react-router enquanto for pontual; `nuqs` (adapter de react-router, parsers tipados) entra quando a conversão manual de número, boolean ou enum virar repetição, ou quando um filtro composto precisar de atualização em lote da URL. Slices e o middleware `persist` do Zustand nascem com a necessidade real: o primeiro store persistido define o formato de limpeza; o primeiro store grande demais define o corte em slices. Quando fecharem, viram seção deste documento, editadas no lugar, e saem desta lista.
