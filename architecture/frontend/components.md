---
id: frontend/components
description: "a construção de página e componente no `app-web` — a ordem do corpo da página e do modal, o nome que separa estado da fonte e estado da página, a forma da condicional, um arquivo por componente, a composição (compound do pacote e do app) e os estados de leitura (loading, vazio e erro)."
use_when:
  - "criar página, componente ou estado de tela"
  - "extrair um componente"
  - "montar um compound"
  - "decidir o loading, o vazio ou o erro de uma tela"
applies_to:
  - "apps/app-web/src/pages/**/*.tsx"
  - "apps/app-web/src/shared/components/**/*.tsx"
keywords: [página, componente, modal, guard, handler, compound, "import * as", Skeleton, EmptyState, load-error-state, isLoading, isBusy, isPending, estado vazio, erro de leitura, erro de escrita, "@metri/ui"]
not_covered:
  - "grupo de rota, guard, rota × modal e carregamento lazy da página → frontend/routing"
  - "formulário, schema de form e campo → frontend/forms"
  - "uso de token e tema no código → frontend/theming"
  - "valores e vocabulário visual → project:DESIGN"
  - "a casa e o nome de arquivo → frontend/structure"
  - "o dado da tela e o feedback de escrita → frontend/data-fetching"
  - "estado cliente → frontend/state"
examples: [frontend/components.examples.md]
status: active
---
# Componentes do frontend

Os exemplos usam o domínio didático de pedidos (`order`, `customer`).

## O corpo da página segue a ordem das decisões

Página mantém a mesma ordem de leitura independentemente do tamanho do módulo: hooks e estados externos, dados e condições de leitura, guards terminais, handlers, condições do conteúdo e da interação, modo alternativo da tela e JSX principal. Blocos separados por linha em branco bastam; comentário de seção repetiria o que a ordem e os nomes já dizem.

Exemplo completo: components.examples.md#orderpage

Todo hook fica antes do primeiro retorno. Os guards terminam o ciclo de leitura na ordem loading, erro sem dado utilizável e indisponibilidade definitiva. Um modo normal da tela, como criação no lugar da listagem, vem depois dos handlers e das condições de conteúdo; não é misturado aos estados de falha.

Handler nomeado começa com `handle` (`handleSave`, `handleRetry`); prop que o recebe começa com `on` (`onSave`, `onRetry`). Callback curto fica inline quando pertence somente ao guard que o mostra ou quando precisa vincular o item atual, como `onChoose={() => handleChoose(order.id)}`. Os demais handlers ficam juntos depois dos guards terminais. Ação pronta retornada por hook mantém o verbo de domínio (`confirmOrder`) e vai direto à prop quando não há lógica local; não nasce um `handleConfirmOrder` só pra repassar a chamada.

### O nome separa estado da fonte e estado da página

O estado recebido de hook ou biblioteca preserva o vocabulário e nomeia a fonte quando necessário: `isOrderPending`, `isCustomersPending`, `isSubmitting`. A condição que a página usa pra decidir o guard tem nome estável mesmo quando só repete uma fonte: `const isLoading = isOrderPending`. Quando combina fontes, continua `isLoading`, e a composição fica visível uma vez na declaração.

Os nomes booleanos seguem o papel que exercem:

- `is...` descreve estado ou característica (`isLoading`, `isJoining`, `isUnavailable`);
- `has...` descreve presença (`hasItems`, `hasLoadError`);
- `can...` descreve capacidade ou permissão (`canCreateOrder`);
- `should...` descreve uma decisão de comportamento (`shouldRedirect`);
- `isBusy` reúne duas ou mais ações que bloqueiam o mesmo conjunto de controles;
- ação específica em andamento usa o verbo correspondente (`isJoining`, `isAccepting`, `isRejecting`), enquanto `isPending` permanece o estado cru da mutation; a primitiva do em-voo em si segue `frontend/data-fetching.md`, "O estado em voo cobre a ação inteira".

Condição sai do JSX quando decide uma seção ou modo, combina mais de uma variável, aparece mais de uma vez, vira prop ou nomeia um conceito da página. Condição específica de uma linha de lista fica como `const` dentro do callback do `map`. Condição local e autoexplicativa de campo, como `errors.email`, continua inline.

### A forma da condicional acompanha a decisão

- Elemento opcional usa condição booleana positiva com `&&`.
- Duas alternativas equivalentes usam ternário.
- Três ou mais alternativas derivam um estado nomeado ou usam componentes com identidade própria.
- `condition ? null : <X />` vira condição positiva com `&&`.
- Condição composta não fica escondida dentro de prop; recebe nome declarativo antes do JSX.

Componente é extraído por identidade, conforme "Um arquivo, um componente" e `frontend/structure.md`, "A pasta do dono", nunca pela quantidade de linhas ou elementos. Formulário continua inline, e a organização de condicionais não o parte em componentes (`frontend/forms.md`, "Onde o formulário mora").

### O corpo do modal

O corpo do modal segue a mesma ordem do corpo de página, incluindo os guards de leitura quando ele carrega dado próprio — a lista de opções que só existe por causa dele mora nele, não na página que o abre.

## Um arquivo, um componente

Um arquivo `.tsx` declara um componente. O segundo vira arquivo próprio, e a casa dele sai da pergunta de identidade em `frontend/structure.md`, "A pasta do dono".

A regra existe pelo caminho que ela fecha. Esqueleto de carregamento, estado de tela e item de lista de uma página nascem dentro do arquivo dela, porque declarar mais uma função ali é sempre a ação mais barata, e o resultado é a página carregando ao mesmo tempo o fluxo de dados, os handlers, a decisão de qual estado renderizar e o markup de todos eles. Com a peça em arquivo próprio, a página fica com a decisão e cada estado fica com o próprio markup.

A peça extraída recebe o que renderizar e o handler pronto, não o dado cru pra decidir sozinha: o estado de erro recebe `onContinue`, o item de lista recebe `onAccept` e as flags que já foram calculadas. Quem decide continua sendo a página.

A extração tem um limite no outro sentido: componente nasce quando há markup ou decisão de verdade pra encapsular. Peça que só traduz um dado numa prop do primitivo do `@metri/ui` é indireção com nome de domínio — a tela usa o primitivo direto, e a variação fica num mapa de apresentação (ver `docs/DESIGN.md`).

O compound é a exceção, e não contraria o parágrafo acima: as partes de um componente composto (`Root`, `Item`, `Trigger`) moram no mesmo arquivo e saem dele renomeadas num bloco de export, como no `@metri/ui`. Elas não disputam um arquivo entre si, são as fatias de um componente só, sempre consumidas juntas — separá-las não desfaz acúmulo nenhum, porque não há nada acumulado ali. O spec de estrutura reconhece o compound por esse bloco de export.

## Composição e o que sobe pro pacote

Compound component (`Input.Root`, `Label.Asterisk`) é do `@metri/ui`: o app monta a tela com essas peças, não redefine o padrão de composição. Peça de UI que passa a ser mais global sobe pro pacote pela regra que já existe, não por uma regra nova daqui: `general/code-placement.md`, "Código pode nascer no pacote dono quando nada nele é do app", com o `@metri/ui` como dono do design system. Este documento aponta pra essa regra, não a reescreve.

O padrão de composição também vale pra peça do app: componente de `shared/components/` cujas partes as telas montam em ordens e combinações próprias — um cabeçalho de página com ícone, título, descrição e ações opcionais — é compound como os do pacote, um arquivo com as fatias exportadas num bloco `export { X as Root, ... }` e consumido via `import * as`. Cada página monta as partes inline, na ordem que a tela pede, sem variável de render e sem uma prop nova no componente pra cada variação de anatomia.

## Estados de leitura: loading, vazio e erro

Três estados, três formas, escolhidas pelo que a tela sabe no momento:

- **Loading** usa o `Skeleton` do `@metri/ui`, desenhado com a forma do conteúdo que vai chegar (uma linha por linha de texto, círculo no lugar do avatar). Skeleton com a silhueta do resultado evita o salto de layout que um spinner centralizado provoca quando o dado chega. Ação disparada pelo usuário mostra o spinner no próprio botão, onde não há layout a reservar (`docs/DESIGN.md`).
- **Vazio** e **erro de leitura** usam o `EmptyState`, sempre com uma ação que tire o usuário dali. Estado vazio sem saída é o que transforma uma tela intermediária em beco sem saída. Quando o erro de leitura só muda de título entre telas, ele é um componente compartilhado (`shared/components/load-error-state.tsx` no `app-web`), não o bloco copiado em cada página. Tela com filtro ativo distingue os dois vazios: "não existe nada" convida a criar; "nada com esse filtro" oferece limpar o filtro — o primeiro texto no segundo caso mente pro usuário.
- **Erro de escrita** vai pra notificação no `catch` do handler que disparou a ação (`frontend/data-fetching.md`, "Erro e sucesso"), não pro corpo da página, salvo quando a tela ramifica por código e mostra estado próprio. Escrita confirmada também notifica, no mesmo handler — a regra completa mora lá.

O erro de leitura não apaga a tela inteira: o chrome que não depende do dado que falhou permanece — o header com o título genérico da tela (sem o que só o dado preencheria: identificador, descrição, ações) e o caminho de volta. O erro é estado do conteúdo e fica no corpo, com a saída de tentar de novo.

## Verificação rápida

- O corpo segue hooks e leitura, guards terminais, handlers, condições declarativas, modo alternativo e JSX, com o vocabulário booleano canônico?
- O corpo do modal segue a mesma ordem, com o dado próprio dele carregado nele?
- Loading de lista usa skeleton com a forma do conteúdo, e todo estado vazio ou de erro oferece uma saída (inclusive "limpar filtro" quando o vazio é do filtro)?
- O arquivo declara um componente só, com as peças da tela em arquivos próprios na pasta da página?
- Nenhum componente existe só pra repassar prop pro primitivo do pacote, e peça compartilhada de anatomia variável é compound consumido via `import * as`?
- Peça mais global subiu pro pacote pela regra de colocação, sem redefinir o compound do `@metri/ui`?
