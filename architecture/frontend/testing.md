---
id: frontend/testing
description: "a pirâmide de testes do frontend — spec de função pura (rule, schema), de hook, de página e componente, de rota e guard, e de fluxo entre telas; o dublê de rede único, o MSW no nível do fetch; os builders de payload; o spec de estrutura e o de config do dev server."
use_when:
  - "escrever spec de rule de UI ou de schema Zod do `app-web`"
  - "escrever spec de hook do `app-web`, com a rede pelo MSW"
  - "escrever spec de página ou componente, com a interação do usuário e o corpo da requisição enviada"
  - "escrever spec de rota, guard ou fluxo entre telas"
  - "criar builder de payload ou decidir se um comportamento do frontend precisa de dublê novo"
applies_to:
  - "apps/app-web/src/**/*.spec.ts"
  - "apps/app-web/src/**/*.spec.tsx"
  - "apps/app-web/test/**"
  - "apps/app-web/dev-server-proxy.spec.ts"
  - "apps/app-web/vite.config.ts"
keywords: [pirâmide, spec, Vitest, jsdom, MSW, setupServer, server.use, onUnhandledRequest, renderHook, "@testing-library/react", user-event, fireEvent, data-testid, MemoryRouter, initialEntries, rota-sonda, AppRoutes, spec de fluxo, structure.spec.ts, dev-server-proxy.spec.ts, builder, "make<Recurso>", "@faker-js/faker", renderWithProviders, vi.mock, "test:unit"]
not_covered:
  - "o teste do backend, que tem documento próprio, com pirâmide e convenções diferentes: nada daqui vale lá → backend/testing"
examples: [frontend/testing.examples.md]
status: active
---
# Testes do frontend

Como o frontend do produto prova comportamento: os cinco níveis da pirâmide, o que cada um prova e onde mora, o spec de estrutura que fica fora dela, o dublê de rede único e os builders de payload compartilhados.

Os exemplos usam o domínio didático de pedidos (`order`, `customer`) dos demais documentos. Regra que já tem casa num documento de área (cliente HTTP e sincronização de cache em `frontend/data-fetching.md`, rule de UI em `frontend/helpers.md`, estado de leitura em `frontend/components.md`, casa de pasta em `frontend/structure.md`, rota e guard em `frontend/routing.md`, formulário em `frontend/forms.md`, estado cliente em `frontend/state.md`, contrato com o backend em `backend/http-api.md`) é referenciada aqui, nunca duplicada.

## A pirâmide

Cinco níveis, do mais barato ao mais caro:

1. **Spec de função pura**: rule, schema Zod, tradutor de erro. Sem React, sem DOM, sem rede. Prova a tabela de decisão completa e o formato aceito ou recusado. Não prova que alguém chama a função.
2. **Spec de hook**: `renderHook` com os providers montados no próprio arquivo, rede pelo MSW. Prova orquestração de cache, debounce, estado derivado e estado em voo. Não prova nenhum ramo de JSX.
3. **Spec de página e componente**: `render` com `@testing-library/react`, interação com `user-event`, rede pelo MSW. Prova o que o usuário vê em cada estado e o que o clique dispara, incluindo o corpo da requisição enviada. Não prova navegação entre telas.
4. **Spec de rota e guard**: `MemoryRouter` com `initialEntries` sobre a árvore real de guards, com rotas-sonda no lugar das páginas. Prova uma transição de cada vez: redirecionamento, bloqueio e liberação. Não prova o que a página faz ao chegar.
5. **Spec de fluxo**: `MemoryRouter` sobre a árvore real de rotas (`AppRoutes`), com as páginas de verdade. Prova a sequência entre telas, que é onde a spec de negócio descreve o comportamento como jornada. Não prova a derivação do estado, que é do servidor.

Cada nível prova uma camada diferente da mesma operação, sem repetir a mesma variação em dois lugares. Os níveis acima do dono de uma regra provam só o resíduo que ele não alcança.

O nível 5 existe porque quase tudo que quebra num fluxo de várias telas é invisível nos outros quatro: o contexto que se perde numa navegação, o guard que dispara junto com o `navigate` da página e vence a corrida, o passo que se repete depois de um recarregamento. Cada tela isolada passa, e a jornada não funciona.

O limite da pirâmide inteira: **o teste de frontend prova a reação da interface ao contrato, nunca a regra do servidor.** Todo caso se lê como "dado que o contrato responde X, a interface faz Y". Regra derivada de fato persistido (se o estado foi recomputado, se a expiração foi calculada, se a flag não existe) é provada no backend, e afirmá-la aqui produz um teste que passa sem provar nada.

### O volume é outro: fluxo e exceção, não a tabela inteira

A pirâmide diz onde cada prova mora, não que toda variação mereça prova. O backend é o dono das regras e por isso prova as tabelas de decisão por inteiro; o frontend prova **a jornada e a exceção**. O que mais quebra numa interface — e o que os specs cobrem primeiro — é a sequência entre telas (nível 5) e os cenários em que algo sai do trilho: falha de leitura, falha de escrita, estado em voo, vazio com e sem filtro.

O caminho feliz de cada tela isolada é o que o fluxo já atravessa; repeti-lo variação a variação em spec de página é custo sem prova nova. Spec de página entra pelo resíduo que o fluxo não alcança: o corpo da requisição enviada, o ramo de exceção específico da tela, a interação que não é passo de jornada. Na dúvida entre cobrir mais uma variação do caminho feliz e cobrir um cenário de exceção ainda sem prova, a exceção vence sempre.

| Artefato | Caminho |
| --- | --- |
| Spec de rule | `src/shared/rules/<módulo>.rule.spec.ts` |
| Spec de schema | `src/shared/schemas/<módulo>.schema.spec.ts` |
| Spec de função de `lib/` com ramificação própria | `src/lib/<integração>/<nome>.spec.ts`, ao lado do arquivo que prova |
| Spec de hook | `src/hooks/<módulo>/<nome>.spec.tsx` |
| Spec de página | `src/pages/<módulo>/<tela>/<tela>-page.spec.tsx` |
| Spec de guard | `src/app/router/guards/<nome>-guard.spec.tsx` |
| Spec de fluxo | `src/app/router/<módulo>-flow.spec.tsx`, ao lado de `routes.tsx` |
| Spec de transição entre fluxos | `src/app/router/<módulo>-transitions.spec.tsx` |
| Spec de estrutura | `src/structure.spec.ts` |
| Spec de config do dev server | `dev-server-proxy.spec.ts`, na raiz do app |
| Setup da suíte | `test/setup.ts` |
| Servidor MSW | `test/msw/server.ts` |
| Builder de payload | `test/factories/make-<recurso>.factory.ts` |

Paths de `src/` e `test/` são relativos ao app frontend (`apps/app-web/`).

O spec mora ao lado do arquivo que prova e por isso não abre casa nova: herda a casa do arquivo. Isso é `src/` para tudo que prova código de produção, e a raiz do app para o que prova o config dele. `test/` é casa própria, com propósito único de infraestrutura de teste compartilhada entre specs. Produção nunca importa de `test/`, a mesma fronteira que o backend fixa em `backend/boundaries.md`, e aqui essa fronteira não tem rede de segurança automática, porque o app não tem `tsconfig.build.json` e o `vite build` não checa tipos. A verificação é o grep da última seção.

## Convenção de nome e execução

O sufixo é `.spec.ts` quando o arquivo é TypeScript puro e `.spec.tsx` quando ele escreve JSX (componente, página, guard, e `renderHook` com wrapper). Os dois são o mesmo nível de arquivo; a extensão é consequência de precisar de JSX, não uma classificação.

O config do Vitest mora no bloco `test` do `vite.config.ts` do app, não num arquivo separado. O backend separa em `test/vitest.config.ts` porque precisa de dois configs e não tem config de Vite para reusar; aqui `react()`, `tailwindcss()` e `tsconfigPaths()` já são exatamente os plugins de que o Vitest precisa, e um segundo arquivo os redeclararia com garantia de divergir no próximo plugin adicionado.

O runner é o Vitest, mesmo do backend, e o ambiente é `jsdom`. A digitação com máscara e reposicionamento de cursor do campo de telefone e a checagem de `pointer-events` do `user-event` dependem de fidelidade de DOM, e jsdom é o alvo de referência da `@testing-library`. API de browser que jsdom não implementa (`ResizeObserver`, `PointerEvent`) entra como polyfill no arquivo de setup quando um componente passar a exigir, nunca como troca de ambiente.

A suíte usa a origem do próprio jsdom, disponível em `window.location.origin`; não configura uma origem separada para a API. O `httpClient` resolve as rotas REST sob `/api` nessa mesma origem. Quando um spec precisa repetir a origem em mais de um handler, declara `const APP_URL = window.location.origin` no próprio arquivo.

Execução por `pnpm --filter app-web test:unit`, ou pela task `test:unit` do Turbo na raiz. Não há suíte de e2e no frontend (ver "Pontos em aberto").

## O dublê de rede é um só: MSW no nível do fetch

Toda rede do app desemboca no mesmo `globalThis.fetch`: o `httpClient` (`frontend/data-fetching.md`, "O cliente HTTP") e o client de qualquer biblioteca externa que fale com o backend usam a mesma primitiva por baixo. Dublar nesse nível é o que cobre todos os caminhos com um mecanismo só.

Mock do módulo `api/` cobre só o caminho REST, e deixa de fora o client de qualquer biblioteca que faça rede por conta própria — que é justamente a parte cujo ciclo de estado decide os ramos de tela. Um fake do `httpClient` tem a mesma lacuna e ainda pula o `output:` do better-fetch, tirando os schemas Zod da fronteira onde eles existem para atuar. O MSW, além de cobrir tudo, entrega o erro real do wire, com o `code` do envelope do backend, que é de onde dependem a tradução de erro e todo ramo de tela que liga num código específico.

Regras de uso:

- `test/msw/server.ts` exporta um `setupServer()` **sem nenhum handler default**. Todo handler é declarado no arquivo de spec, com `server.use(...)`: inline no `it()` quando a resposta é o que está sob prova, no `beforeEach` quando é pré-condição de todos os casos do arquivo. É a mesma regra de "Arrange inline, sem função utilitária escondendo um passo sob prova" do backend: a resposta de que o teste depende fica visível no teste.
- `server.listen({ onUnhandledRequest: 'error' })` no setup. É o que torna auto-verificável a afirmação de que um mecanismo cobre os dois caminhos: requisição sem dublê quebra o teste em vez de vazar para a rede.
- O `listen()` fica no **topo do arquivo de setup, nunca dentro de `beforeAll`**. Client que resolve o `fetch` uma vez, na criação, faz isso na avaliação do módulo, que roda antes de qualquer hook. Com o `listen()` em `beforeAll`, esse client fica com o `fetch` original: as chamadas dele escapam do dublê e vão para a rede de verdade, sem erro nenhum, e o teste passa ou falha pelo que houver no ambiente. É a falha mais silenciosa da suíte, porque só parte da superfície escapa e o resto continua dublado normalmente.
- Handler com URL absoluta, construída a partir de `window.location.origin`. Rota REST fica sob `/api`.
- O facade `lib/http/client.ts` tem um spec próprio que captura a URL recebida pelo MSW e afirma que a rota REST sai na origem da página sob `/api`. É uma guarda contra composição silenciosa de `baseURL`, não uma segunda prova da operação de domínio.
- `vi.mock` fica reservado a fronteira que não é rede: o `toast` do Sonner (`@metri/ui/components/ui/sonner`), quando o teste afirma título e descrição sem montar o `Toaster`, e uma função de `lib/<integração>/` cujo efeito é sobre a biblioteca, não sobre a tela. Nunca para substituir uma chamada de rede.

```ts
// test/msw/server.ts
import { setupServer } from 'msw/node';

/**
 * Sem handler default de propósito: cada spec declara o que a sua própria
 * asserção depende, com `server.use(...)`.
 */
export const server = setupServer();
```

```ts
// test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

server.listen({ onUnhandledRequest: 'error' });

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

## Store de biblioteca externa em teste

Client de biblioteca externa costuma ser singleton de módulo, com o dado num store reativo próprio. Dentro de um mesmo arquivo de spec, o valor do teste anterior continua no store depois que o handler do MSW já mudou — trocar o handler não invalida nada que a biblioteca já tenha em memória.

Quando o valor é só pré-condição, trocar o handler no `beforeEach` basta. Quando o arquivo exercita mais de um valor, a troca precisa avisar o store explicitamente, com a mesma chamada que o app já usa depois de uma escrita que não passou pelo client, seguida de um `waitFor` até o store refletir o valor novo. Não inventar um dublê próprio do client para isso.

Atenção a store que se desliga sem assinantes: alguns só mantêm o valor vivo enquanto alguém escuta, e voltam a devolver o valor antigo quando o último componente desmonta. Nesse caso o setup mantém um assinante vivo durante cada teste e o libera no fim. Sem isso, o resultado passa a depender de quanto tempo o teste anterior levou, e a suíte fica intermitente de um jeito que muda de arquivo conforme a ordem de execução.

## Como escrever spec de função pura (`shared/rules/`, `shared/schemas/`, `lib/`)

- Arrange é literal inline, montado no próprio `it()`. Nunca usa builder de `test/factories/`: o builder parte de um payload já válido, e num spec de schema é exatamente a validade que está sob prova. Mesmo princípio de "spec de entidade usa `create()`, nunca a factory" do backend.
- Um `it()` por linha da tabela de decisão, sem `it.each`: o título nomeia a condição e o resultado, e a falha aponta a linha exata.
- Título no formato `'<condição> → <resultado>'`.
- Schema prova o que aceita, o que recusa e o que transforma. Coerção e normalização (aparar espaço, converter texto em data) são comportamento, não detalhe: o consumidor depende do valor de saída.

Exemplo completo: testing.examples.md#orderrulesresolvedestination

## Como escrever spec de hook (`hooks/<módulo>/<nome>.spec.tsx`)

- `renderHook` com um wrapper montado no próprio arquivo. O `QueryClient` é novo a cada teste, com `retry: false`. Nunca reusar o singleton de `app/providers/`: ele tem retry e cache que atravessam testes.
- Hook que lê a URL ganha `MemoryRouter` com `initialEntries` no wrapper.
- O que se afirma sobre cache é o efeito observável, não a chamada: dado descartado deixa de existir, dado invalidado continua lá marcado como velho. A diferença entre os dois é decisão de produto (`frontend/data-fetching.md`, "Atualizar vs. invalidar o cache"), então o teste tem que distinguir os dois, não só verificar que "sincronizou".
- Debounce usa timers falsos, com o avanço dentro de `act`.
- Mudança de props entre renders usa `rerender`, com o valor novo passado como argumento, não uma variável externa mutada.

Exemplo completo: testing.examples.md#useconfirmorder

## Como escrever spec de página (`pages/<módulo>/<tela>/<tela>-page.spec.tsx`)

- Interação sempre por `user-event`, nunca `fireEvent`: o comportamento sob prova inclui foco, digitação e estado desabilitado, que só o primeiro reproduz.
- Consulta por papel e texto acessível, na ordem de prioridade da própria `@testing-library`. Consulta por `data-testid` só quando não existe nenhum papel ou texto que identifique o elemento, e o motivo fica num comentário.
- O que a página envia é asserção de primeira classe: capturar o corpo da requisição no handler do MSW e afirmar sobre ele. Só verificar que a tela mudou deixa passar campo errado, valor não normalizado e id trocado.
- Estado em voo (botão travado, linha marcada, campo desabilitado) é provado com handler atrasado, não com mock de função.
- Falha da escrita é caso obrigatório de toda página que escreve: o que o usuário vê, e que a tela não navega.
- A notificação da falha de escrita nasce no `catch` do handler que disparou a ação (`frontend/data-fetching.md`, "Erro e sucesso: quem dispara a ação nomeia o resultado"), então ela é observável no spec de página: título e descrição afirmados com o `Sonner.toast` mockado, sem montar o `Toaster`. Junto dela, o spec afirma o que a página faz na falha: continua na tela, mantém a ação disponível, recarrega a lista. A escrita confirmada afirma a notificação de sucesso do mesmo jeito: título nomeando o resultado e descrição dizendo onde ele aparece, ou o efeito além dele.

## Como escrever spec de rota e guard (`app/router/guards/<nome>-guard.spec.tsx`)

- `MemoryRouter` com `initialEntries` fica inline no `it()`, nunca atrás de helper: o caminho de entrada é o Arrange sob prova.
- O destino é observado como texto de uma rota-sonda, não pelo objeto de history. A sonda renderiza um texto identificável por rota, e a asserção é sobre o que apareceu na tela.
- O filho do guard renderiza um texto próprio, e "produto liberado" é a presença dele.
- Estado ainda carregando é caso próprio: guard que não renderiza nem redireciona é comportamento intencional, e some sem aviso num refactor.
- Guard com efeito (ativar um recurso e reconsultar) prova a sequência inteira: a primeira resposta que dispara o efeito, o corpo enviado, e a segunda resposta que libera. O guard de corrida contra resposta atrasada é caso próprio, com atraso no handler.

## Como escrever spec de fluxo (`app/router/<módulo>-flow.spec.tsx`)

Um arquivo por módulo para os percursos, outro para as transições entre eles. A divisão não é estética: o percurso é o caminho feliz de uma jornada inteira, e a transição é o que acontece quando o fato que trouxe o usuário até ali muda no meio do caminho. Misturar os dois num arquivo só esconde qual dos dois quebrou.

- Monta `AppRoutes` inteiro dentro de `MemoryRouter`, com as páginas de verdade. Rota-sonda é do nível 4; aqui a prova é o que a página real renderiza ao chegar.
- O estado do servidor não é recomputado no teste. Um handler guarda a resposta corrente e **quem a avança é o handler da escrita que satisfaz o passo**: o `POST` que conclui o passo é o que faz o contrato passar a responder o passo seguinte. Isso mantém a sequência declarada no teste e a derivação onde ela mora, no servidor.
- Toda navegação é confirmada pela tela de destino antes da próxima interação. Sem isso a query seguinte pode resolver contra a tela anterior, e a falha aparece três passos depois da causa.
- Transição sem ação do usuário (um prazo que expira, um pedido cancelado por outro usuário) é provocada avançando a resposta do contrato e revalidando a query correspondente, com um comentário dizendo qual é o gatilho real em produção.
- Layout que monta componente com dependência de browser (carrossel, observer) faz qualquer fluxo que passe por ele depender dos polyfills do setup.

## Spec de estrutura (`src/structure.spec.ts`)

Fica fora da pirâmide porque não prova comportamento nenhum: ele afirma a árvore de arquivos, com as regras de `frontend/structure.md`, "A pasta do dono", e `frontend/components.md`, "Um arquivo, um componente".

A mensagem de falha diz de quem é a peça e pra onde ela vai. É isso que transforma a promoção numa correção óbvia em vez de uma decisão a lembrar no meio de outra tarefa: quem consome uma peça de fora da pasta dela quebra a suíte e lê o destino junto com o erro.

Regra estrutural nova entra aqui só quando a violação for silenciosa. O que lint ou type checker já acusa não vira caso neste arquivo.

## Spec de config do dev server (`dev-server-proxy.spec.ts`)

Também fica fora da pirâmide: prova o contrato de encaminhamento do proxy, não a reação da interface a esse contrato. O objeto de proxy é importado do próprio `vite.config.ts`, nunca copiado para dentro do teste, senão a prova passa a valer para a cópia.

O arquivo mora na raiz do app, junto do config, e o nome não pode ser `vite.config.spec.ts`: o `exclude` default do Vitest cobre `**/{...,vite,...}.config.*`, então um spec com esse nome é ignorado sem nenhum aviso, e a suíte segue verde por não executá-lo.

Ele roda num projeto próprio do Vitest, em ambiente node e sem o setup da suíte de interface. Importar o `vite` traz o esbuild junto, e o esbuild recusa iniciar sob jsdom; o setup da interface, por sua vez, monta DOM e carrega os clients do app, que este arquivo não usa. É a única razão de o bloco `test` ter projetos: um caso novo aqui não abre um projeto novo.

O caso é sempre um par. A configuração real preserva o header que o backend precisa ler, e a alternativa plausível o destrói. Um caso positivo sozinho não distingue "a config está certa" de "o valor chegou por acaso"; é o controle negativo que mostra qual opção está segurando o contrato.

O arquivo sobe o dev server e um servidor de destino de brinquedo, que só registra o que recebeu, e fala com eles por `node:http`: o cliente `fetch` da plataforma recusa sobrescrever `Host`. O dublê de rede global continua ligado, e o arquivo libera passagem só para as origens que ele mesmo subiu.

Regra de entrada: só ganha caso aqui a opção de config cuja remoção não quebra nenhum outro teste e não aparece em erro de tipo. Opção que o próprio Vite recusa, ou que qualquer spec de página já acusaria, não entra.

## Builders de payload (`test/factories/make-<recurso>.factory.ts`)

Uma função pura `make<Recurso>(override = {})`, com `...override` sempre por último, mesma forma do backend. O frontend não tem entidade, então o que o builder devolve é **o objeto de wire cru**, o JSON que o handler serve, nunca um objeto já parseado por schema: o schema continua sob prova na fronteira em que ele existe para atuar.

`@faker-js/faker` só para o campo que nenhuma asserção lê. Campo que a asserção lê, ou de que um ramo de tela depende, é literal passado como override. Um id aleatório num campo que a asserção compara produz teste que passa por acidente; um valor formatado (data, telefone, slug) vindo do faker produz falha intermitente quando a formatação da tela muda de resultado.

Resposta de escrita é envelope: quando o presenter do backend devolve `{ order: { ... } }`, o builder devolve esse formato, com o override aplicado ao miolo (`Partial<...['order']>`) pra ergonomia — nunca um objeto achatado que mente sobre a forma do wire.

Exemplo completo: testing.examples.md#makeorder

## Nada de helper de render compartilhado

Um helper de render compartilhado em `test/` não entra: `QueryClientProvider` e `MemoryRouter` são o runtime sem o qual o componente não existe, não um passo sob prova, e a resposta consistente para esse caso já está escrita no backend: todo e2e monta o app inteiro no próprio arquivo, "nunca vira um `createTestApp()` compartilhado" (`backend/testing.md`).

O que continua permitido é helper local ao arquivo. Uma `function renderPage()` no topo de um spec que renderiza a mesma página em muitas variações monta providers e não esconde passo nenhum; é a mesma carve-out que o backend abre para utilitário puro sem semântica de fluxo. O que ele não pode fazer é executar interação, montar estado de domínio ou escolher a rota de entrada.

## O que não tem spec próprio

- **Key factory** (`hooks/<módulo>/keys.ts`): não tem ramificação, e o valor que ela produz é afirmado onde o cache é observado.
- **Hook de query que é passthrough de `useQuery`**, sem `select`, sem `enabled` derivado e sem tratamento de erro próprio: provado onde é consumido. Hook de query com ramificação própria ganha spec.
- **Componente sem ramo de render**, cuja única variação é repassar prop para a biblioteca de baixo: a regra que ele carrega é provada na página onde ela é observável. Componente com estado ou condicional próprio ganha spec.
- **Constante e tipo**: não tem comportamento. Mapa exaustivo anotado com `Record<Uniao, T>` também não, porque a exaustividade é do compilador, não de um teste (mesmo critério de `backend/testing.md`).
- **Página que só compõe componentes já provados**, sem estado, sem escrita e sem ramo.
- **O contrato com o backend**: nenhum teste daqui garante que o servidor devolve o que o contrato canônico declara. Campo novo ou estado novo do servidor chega como falha de parse, e o que se prova é o raio de alcance dessa falha, com um caso de payload desconhecido no ponto que consome o schema.

## Limite do contrato compartilhado

Regra de formato que a API impõe (comprimento máximo, formato de identificador) existe uma vez, no contrato canônico, e o frontend a importa. Não há teste cruzado: cada lado prova o limite onde o consome, com caso no valor limite e no valor seguinte.

Schema de form mais estrito que o do backend não é divergência, é decisão de produto (`frontend/forms.md`, "Schema de form e schema de API são coisas diferentes"). Nesse caso o spec do frontend leva um caso com o valor que o backend aceitaria e este recusa, que é o que fixa a intenção e impede alguém "corrigir" o schema depois.

## Verificação rápida

- O teste está no nível mais barato que consegue afirmar o comportamento por inteiro?
- O spec novo cobre fluxo ou cenário de exceção, em vez de mais uma variação de caminho feliz que o fluxo já atravessa?
- Comportamento de sequência entre telas está no nível de fluxo, e não espalhado em specs de página?
- Spec de fluxo confirma a tela de destino depois de cada navegação, antes da próxima interação?
- O nome do arquivo declara a extensão certa (`.spec.ts` sem JSX, `.spec.tsx` com JSX)?
- A rede está dublada só pelo MSW, com o handler declarado no próprio spec e construído a partir de `window.location.origin`?
- Handler REST usa `/api` na origem da página?
- Spec de schema monta o literal inline, sem builder?
- Builder usa literal no campo que a asserção lê, e faker só no resto?
- O `QueryClient` é novo por teste, com `retry: false`, e não é o singleton do app?
- Interação usa `user-event`, e o corpo da requisição enviada foi afirmado?
- `MemoryRouter` está inline no `it()`, com o destino observado como texto de rota-sonda?
- O helper de render, se existe, é local ao arquivo e só monta providers?
- O teste afirma reação da interface ao contrato, e não uma regra derivada que só o servidor pode provar?
- Produção não importa de `test/`? `grep -rlP "from '[^']*/test/|from '@/test" apps/app-web/src --include="*.ts" --include="*.tsx" --exclude="*.spec.ts" --exclude="*.spec.tsx"` deve devolver vazio.

## Em aberto

- **E2e de browser.** Não existe runner de browser no monorepo. O nível 5 já prova as sequências multi-tela pela árvore real de rotas, e o backend já prova o servidor com banco real, então o que falta é só o que exige um browser de verdade: cookie entre origens, redirect real de serviço externo, propagação de estado entre abas. Adotar isso é decisão maior que qualquer feature, porque traz seed de banco, provisionamento de usuário de teste e execução em CI. Enquanto não fechar, comportamento que só um browser prova fica sem teste automatizado e é verificado à mão.
