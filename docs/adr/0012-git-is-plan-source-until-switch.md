# ADR-0012 O git é a fonte do plano até a troca, na slice da F5

status: accepted
area: general
kind: decision

## Contexto

O plano do Metri foi feito à mão, nos arquivos do método, e entra no banco por uma importação na slice do tracer (F5). Os comandos do método leem esses arquivos, e o `metri verify` do Workspace, da fila e do CI roda todos eles (`cli/verify.ts:109-124`):

- o `metri scope` lê o `slice` e o `type` do ticket e, no arquivo de outro ticket, só aceita mudança na linha `status:` (`cli/scope.ts:45-50,68,111-127`);
- o docs-lint valida o `status` de cada ticket e decide por ele quais chaves exigir (`cli/lib/ticket-lint.ts:15,115-139,194`), valida o `status: done` das slices na MATRIX (`cli/lib/matrix-lint.ts:9-15,138-142`) e confere que todo UC listado numa spec tem arquivo (`cli/lib/spec-lint.ts:94`);
- o `metri sot` usa o `status: done` e o `sot:` das slices para conferir os cabeçalhos SOURCE OF TRUTH (`cli/sot.ts:226-234`).

Se o banco virasse a fonte já na importação, os arquivos envelheceriam, e esses comandos passariam a conferir um plano velho ou a falhar.

### Como o mercado faz

Não se aplica: nenhuma das ferramentas pesquisadas executa um método com o plano em arquivos versionados. A ordem segue o ADR-0003: a mudança no método entra na slice que entrega a peça que substitui o comportamento antigo.

## Decisão

Até a troca, o fluxo tem um sentido só: o git é a fonte do plano, e o banco é uma projeção, reimportada por id a cada mudança nos arquivos.

- Nenhuma operação do Metri escreve plano no banco: propor UC, ticket ou plano, ou mudar contrato. Elas ficam desabilitadas, com o motivo na tela.
- O status de tickets e de slices mora nos arquivos, como no método. Quem o muda é quem o método manda: a etapa feita à mão, antes da slice que a substitui, ou o Metri como sistema, nos pontos em que o método grava status (na branch do ticket, ao começar e ao bloquear; na fila, no merge). O agente nunca grava status. O estado do Run mora só no banco, porque não é plano.
- A troca é um ticket do método na slice que entrega a F5: os comandos passam a receber o plano do Metri, o banco vira a fonte, e os arquivos de tickets e a MATRIX viram exportação.

## Alternativas consideradas

- O banco como fonte desde a importação, com o Metri escrevendo no Workspace os arquivos que os comandos leem: os arquivos no git envelheceriam, e o CI quebraria no primeiro UC criado dentro do Metri.
- Mudar os comandos do método antes do tracer: pediria uma tag nova antes da fundação, contra a ordem do ADR-0003.

## Consequências

- Até a troca, Moldar, Look across e as propostas de lacuna e de padrão feitas pelo Metri ficam desabilitadas; essas etapas seguem à mão, pelo método da tag (ADR-0001).
- Mudar o plano antes da troca é mudar os arquivos e reimportar.

## Imposto por

O ticket da troca, na slice da F5. Até ele, não imposto.
