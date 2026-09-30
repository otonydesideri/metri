---
id: frontend/routing
description: "a estrutura conceitual das rotas do `app-web` — o grupo de rota como par guard + layout, o acesso que a página exige, o guard, a rota de não-encontrado, a decisão entre rota e modal de tarefa, o carregamento lazy da página com o `Suspense` do layout e o fallback dele, e a nomeação do segmento de rota."
use_when:
  - "criar página ou rota"
  - "criar ou mudar o guard ou o layout de um grupo"
  - "decidir se uma tarefa vira rota ou modal"
  - "nomear segmento ou parâmetro de rota"
applies_to:
  - "apps/app-web/src/app/router/**"
  - "apps/app-web/src/app/layouts/**"
  - "apps/app-web/index.html"
keywords: [rota, grupo de rota, guard, layout, routes.tsx, react-router, "<Route path=\"*\">", não-encontrado, modal de tarefa, isDirty, onEscapeKeyDown, onInteractOutside, React.lazy, lazy, Suspense, Outlet, AppSplash, code splitting, segmento de rota, kebab-case, orderId]
not_covered:
  - "o corpo da página e do modal como componente → frontend/components"
  - "o formulário dentro do modal → frontend/forms"
  - "estado guardado na URL → frontend/state"
  - "o que o cache descarta quando um guard lê um dado pra decidir rota → frontend/data-fetching"
  - "a pasta e o nome de arquivo de guard, layout e página → frontend/structure"
  - "uso de token e tema no código → frontend/theming"
  - "valores e vocabulário visual → project:DESIGN"
  - "o spec de rota e guard → frontend/testing"
examples: [starter/apps/app-web/src/app/router/routes.tsx, starter/apps/app-web/src/app/layouts/app/app-layout.tsx, starter/apps/app-web/src/shared/components/app-splash/app-splash.tsx]
status: active
---
# Rotas do frontend

Num SPA tudo é client: o eixo que organiza uma tela é o acesso que ela exige, não o ambiente de render, e é isso que a decisão "Server vs. Client Component" do modelo Next.js não cobre aqui. Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## Ferramentas

| Ferramenta | Status | Decisão |
| --- | --- | --- |
| react-router | DECIDIDA | `defaults/stack.md`, "Stack" |

## Regras

### Grupo de rota e acesso

**Obrigatório.** Ao criar uma página, a primeira decisão é o acesso que ela exige, e a resposta decide o grupo de rota.

**Obrigatório.** O grupo mora em `app/router/routes.tsx` e é um par guard + layout: o guard decide quem entra, o layout decide o que fica em volta.

Enquanto o produto não tiver controle de acesso: **Obrigatório.** Existe um grupo só, com layout e sem guard, e toda página entra nele.

Quando o primeiro eixo de acesso aparece: **Obrigatório.** Ele nasce como grupo novo, com o par próprio.

**Obrigatório.** O guard é um wrapper de rota, e a isenção é estrutural: página que o guard não deve cobrir fica fora do wrapper.

**Proibido.** Constante de "paths isentos" consultada pelo guard.

> **Por quê.** Seria a mesma regra escrita duas vezes, e a segunda cópia é a que desatualiza.

**Obrigatório.** A página dentro do grupo conta com o que o guard garantiu, sem re-checar.

Quando a página precisa ramificar pelos dois casos: **Obrigatório.** Ela pertence a um grupo sem aquele guard, não a um grupo com guard mais um `if` por dentro.

**Obrigatório.** O guard existe para entrada direta por URL, recarregamento e mudança de estado no meio do caminho, não para navegação interna: cada tela nomeia a própria sucessora.

**Obrigatório.** Rota sem match nenhum cai num `<Route path="*">` com estado vazio.

> **Por quê.** Sem ele o `<Routes>` renderiza vazio, sem erro no console, e um endereço truncado por cliente de e-mail vira tela em branco silenciosa.

### Rota é lugar; tarefa curta é modal

**Obrigatório.** Rota nova nasce para um lugar onde o usuário fica — uma listagem, um detalhe —, não para toda ação.

Quando a tarefa é curta e cancelável, como a criação de um registro simples: **Obrigatório.** Ela é modal por estado sobre a tela que a dispara: abrir não navega, concluir leva ao recurso criado, desistir devolve a tela intacta, com filtro e página onde estavam.

Quando o fluxo é longo, com passos ou estado que mereça link compartilhável: **Obrigatório.** Ele continua sendo rota.

Quando a tarefa edita um item de uma lista curta e o editor não cabe num modal no celular: **Permitido.** Drill-down por estado, a terceira forma: a página troca a lista pelo editor em tela cheia com `useState`, fora da URL, com a ação "Voltar" para a lista, e o editor montado condicionalmente como o modal.

> **Por quê.** O editor ganha a tela inteira sem virar lugar. O custo é que o Voltar do navegador sai da página em vez de voltar à lista, então vale só quando cada item grava ao salvar e fechar o editor não perde trabalho salvo.

**Obrigatório.** O modal de tarefa é montado condicionalmente, nunca por `open` persistente: cada abertura monta o componente do zero e o formulário nasce zerado, sem `useEffect` de limpeza nem `reset` por reflexo.

Quando o formulário do modal está sujo (`isDirty`): **Obrigatório.** Esc e clique fora não descartam o trabalho: `onEscapeKeyDown`/`onInteractOutside` fazem `preventDefault`, e descartar é ação explícita do Cancelar ou do X.

### Página carregada com lazy

**Obrigatório.** Toda página entra no router via `React.lazy`, para que o bundle de cada rota carregue sob demanda desde o começo (code splitting por rota).

**Obrigatório.** Guard e layout ficam eager.

> **Por quê.** São pequenos e sempre necessários.

**Obrigatório.** O `<Suspense>` fica em cada elemento de grupo que renderiza o `<Outlet />`, ao redor dele: o layout e também o guard de um grupo sem layout. A rota `*` leva o próprio `<Suspense>` em volta da página. Nunca em volta do `<Routes>` inteiro.

> **Por quê.** Assim o layout (o header e a navegação lateral, por exemplo) continua montado quando o usuário navega entre páginas irmãs do mesmo grupo, e só a área da página troca pelo fallback.

**Obrigatório.** O fallback é o `AppSplash` (`shared/components/`): overlay fixo com a marca sobre o fundo da app, o mesmo que um guard renderiza enquanto resolve o que precisa resolver.

**Obrigatório.** Antes de o React montar, o `index.html` pinta só o fundo, com o valor do token do canvas inline.

> **Por quê.** O splash entra por cima sem trocar de cor, então as janelas do carregamento inicial (fundo estático, guards, chunk da página) não piscam entre si.

**Obrigatório.** A marca dentro do splash aparece com atraso (`delay-300 fill-mode-backwards`), não junto com o fundo.

> **Por quê.** Espera que termina antes disso mostra só o fundo, que já estava pintado, e nada pisca; a marca é feedback para a espera que o usuário chega a perceber.

### Segmento de rota

**Obrigatório.** Todo segmento de rota é em inglês e kebab-case, como o resto do código.

> **Por quê.** O espaço de URL inteiro fala uma língua só, e pasta, componente, parâmetro e segmento param de exigir tradução entre si. O português fica onde o usuário lê: rótulo, título, texto de botão, mensagem de erro.

**Obrigatório.** Recurso na rota é identificado por id, não por slug (`/orders/:orderId`).

> **Por quê.** Slug muda quando alguém renomeia, e todo link já compartilhado passa a apontar para lugar nenhum.

- **Exceção.** Endereço público escolhido pelo usuário, na raiz (`/<slug>`, `general/http-surface.md`): o slug é o identificador que ele divulga, e o value object dele recusa as palavras reservadas (`domain/model.md`, "Aplicação").

## Aplicação

A página no router, com o import mapeado para o default que o `lazy` espera, e o `Suspense` no layout: `starter/apps/app-web/src/app/router/routes.tsx` e `starter/apps/app-web/src/app/layouts/app/app-layout.tsx`.

O modal de tarefa montado por estado na página que o dispara:

```tsx
{creating.value && <CreateOrderModal onClose={creating.onFalse} />}
```

- No modelo Next.js isso é `next/dynamic`; aqui é `React.lazy` + `Suspense`, porque o roteamento é do react-router.
- Navegação entre páginas irmãs nunca mostra o fallback: o react-router envolve a navegação em `startTransition`, e o React segura a tela anterior até o chunk novo resolver.
- O token do canvas pintado no `index.html` é o `bg-background` (`docs/DESIGN.md`).
- O modal de tarefa é peça da pasta do dono (`frontend/structure.md`, "A pasta do dono"); o formulário dentro dele é o caso "a UX é o componente" de `frontend/forms.md`, e o corpo dele segue `frontend/components.md`, "O corpo do modal".

## Verificação

- Página nova entrou no grupo de rota certo, e conta com o que o guard daquele grupo garantiu, sem re-checar por dentro?
- A isenção do guard é estrutural, sem lista de paths isentos, e rota sem match cai no `<Route path="*">`?
- Rota nova nasceu para um lugar, e tarefa curta e cancelável virou modal por estado, montado condicionalmente, com Esc e clique fora bloqueados quando o form está sujo?
- Página entra no router via `React.lazy`, com o `Suspense` em cada layout ou guard de grupo ao redor do `<Outlet />`, e o da rota `*`?
- Drill-down por estado só onde cada item grava ao salvar, com a ação "Voltar" para a lista?
- Segmento de rota está em inglês e kebab-case, com recurso identificado por id?

## Em aberto

- **Error boundary.** A Source não tem regra de error boundary: onde fica o limite que pega erro de render ou de carregamento de página, fora dos estados de leitura (`frontend/components.md`, "Estados de leitura: loading, vazio e erro"), e o que ele mostra.

## Referências

- `frontend/components.md`: o corpo da página e do modal.
- `frontend/forms.md`: o formulário dentro do modal.
- `frontend/structure.md`: a casa de `app/router/`, de guard, layout e página.
- `frontend/state.md`: estado guardado na URL.
- `frontend/data-fetching.md`: o cache que um guard lê.
- `docs/DESIGN.md`: o token do canvas.
- `frontend/testing.md`: spec de rota e guard e spec de fluxo.
