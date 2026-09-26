---
id: frontend/components
description: "Componentes do frontend: ordem do corpo de página e modal, nomes de estado, condicional, um componente por arquivo, compound e estados de leitura."
applies_to: ["apps/app-web/src/**/*.tsx"]
keywords: [page, component, modal, handler, guard, compound, skeleton, empty state, load error]
read_first: [frontend/structure]
not_covered:
  - "grupo de rota, guard de rota, rota × modal e carregamento lazy da página → frontend/routing"
  - "formulário, schema de form e campo → frontend/forms"
  - "tokens, tema e vocabulário visual → frontend/design-system"
  - "dado da tela, estado em voo e feedback de escrita → frontend/data-fetching"
  - "estado cliente → frontend/state"
  - "colocação de código entre app e pacote → overview"
enforced_by: []
examples: [frontend/components.examples.md]
adr: []
status: active
---
# Componentes do frontend

## Regras
- **Obrigatório.** Ordene o corpo da página, em qualquer tamanho de módulo: hooks e estados externos → dados e condições de leitura → guards terminais → handlers → condições do conteúdo e da interação → modo alternativo → JSX principal. — `manual`
- **Obrigatório.** Declare todo hook antes do primeiro retorno. — `manual`
- **Obrigatório.** Ordene os guards terminais: loading → erro sem dado utilizável → indisponibilidade definitiva. — `manual`
- **Proibido.** Modo alternativo da tela (ex.: criação no lugar da listagem) entre os guards de falha; em vez disso, coloque-o depois das condições do conteúdo. — `manual`
- **Proibido.** Comentário de seção no corpo; em vez disso, separe os blocos por linha em branco. — `manual`
- **Obrigatório.** Aplique ao corpo do modal a mesma ordem, com guards de leitura quando ele carrega dado próprio. — `manual`
- **Obrigatório.** Carregue no modal o dado que só existe por causa dele (ex.: lista de opções), não na página que o abre. — `manual`
- **Obrigatório.** Nomeie o handler `handle<Ação>` e a prop que o recebe `on<Ação>`. — `manual`
- **Permitido.** Callback curto inline quando pertence só ao guard que o mostra ou vincula o item atual (`onChoose={() => handleChoose(order.id)}`). — `manual`
- **Proibido.** `handle<Ação>` que só repassa uma ação pronta de hook; em vez disso, passe a ação, com o verbo de domínio (`confirmOrder`), direto à prop. — `manual`
- **Obrigatório.** Preserve o nome do estado vindo de hook ou biblioteca; acrescente a fonte quando precisar distinguir (`isOrderPending`, `isCustomersPending`). — `manual`
- **Obrigatório.** Dê à condição de guard um nome de página estável (`const isLoading = isOrderPending`), mesmo com uma fonte só; ao combinar fontes, declare a composição uma vez. — `manual`
- **Obrigatório.** Nomeie booleanos pelo prefixo da árvore de decisão. — `manual`
- **Obrigatório.** Posicione cada condição pela árvore de decisão. — `manual`
- **Obrigatório.** Escolha a forma da condicional pela árvore de decisão. — `manual`
- **Proibido.** `cond ? null : <X />`; em vez disso, `cond && <X />` com condição positiva. — `manual`
- **Obrigatório.** Declare um componente por arquivo `.tsx`; o segundo (skeleton, estado de tela, item de lista) vai para arquivo próprio, na casa definida por `frontend/structure`. — `manual`
  Exceção: as partes de um compound (`Root`, `Item`, `Trigger`) ficam no mesmo arquivo, exportadas num bloco `export { X as Root, ... }`.
- **Proibido.** Extrair componente por tamanho (linhas, elementos); em vez disso, extraia por identidade: markup ou decisão própria. — `manual`
- **Proibido.** Passar dado cru para a peça extraída decidir; em vez disso, passe o que renderizar, as flags já calculadas e o handler pronto (`onContinue`, `onAccept`). — `manual`
- **Proibido.** Componente que só traduz um dado numa prop de primitivo do kit de UI; em vez disso, use o primitivo direto, com a variação num mapa de apresentação. — `manual`
- **Obrigatório.** Quando as telas montam as partes de um componente compartilhado em ordens e combinações próprias (ex.: cabeçalho com ícone, título, descrição e ações opcionais), faça dele um compound em `shared/components/`, consumido via `import * as`. — `manual`
- **Proibido.** Variável de render ou prop nova por variação de anatomia de um compound; em vez disso, monte as partes inline, na ordem da tela. — `manual`
- **Proibido.** Spinner centralizado no loading de leitura; em vez disso, skeleton com a silhueta do conteúdo (uma linha por linha de texto, círculo no avatar). — `manual`
- **Obrigatório.** Mostre o spinner da ação disparada pelo usuário no próprio botão. — `manual`
- **Obrigatório.** Ofereça sempre uma ação de saída no estado vazio e no erro de leitura. — `manual`
- **Obrigatório.** Com filtro ativo, faça o vazio oferecer limpar o filtro; sem filtro, convidar a criar. — `manual`
- **Obrigatório.** Use `shared/components/load-error-state.tsx` para o erro de leitura que só muda de título entre telas; nunca copie o bloco. — `manual`
- **Obrigatório.** Mostre o erro de leitura no corpo, como estado do conteúdo, com a ação de tentar de novo. — `manual`
- **Obrigatório.** Com erro de leitura, mantenha o chrome que não depende do dado: header com título genérico (sem identificador, descrição ou ações do dado) e caminho de volta. — `manual`

## Árvore de decisão
- Nome de booleano:
  - estado ou característica → `is...` (`isLoading`, `isUnavailable`)
  - presença → `has...` (`hasItems`, `hasLoadError`)
  - capacidade ou permissão → `can...` (`canCreateOrder`)
  - decisão de comportamento → `should...` (`shouldRedirect`)
  - duas ou mais ações bloqueando os mesmos controles → `isBusy`
  - ação específica em andamento → verbo da ação (`isJoining`, `isAccepting`); o estado cru da biblioteca mantém o nome dela
- Lugar da condição:
  - decide seção ou modo, combina variáveis, repete, vira prop ou nomeia conceito da página → `const` nomeada antes do JSX
  - específica de uma linha de lista → `const` dentro do callback do `map`
  - local e autoexplicativa de campo (`errors.email`) → inline
- Forma da condicional:
  - elemento opcional → `cond && <X />`, com condição positiva
  - duas alternativas equivalentes → ternário
  - três ou mais alternativas → estado nomeado ou componentes com identidade própria

## Stack padrão
- Kit de UI (primitivos) e dono do design system: `@metri/ui`.
- Loading de leitura: `Skeleton` do `@metri/ui`.
- Vazio e erro de leitura: `EmptyState`.
- React Query: `isPending` fica como estado cru da mutation; a página deriva o nome da ação (`isSaving`, `isJoining`).
