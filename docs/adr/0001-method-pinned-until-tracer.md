# ADR-0001 O processo de construção usa o método preso numa tag até o tracer

status: accepted
area: general
kind: decision

## Contexto

O Metri é construído com a metodologia Slices com Guardrails, e o próprio método passa a morar no mesmo repositório, em `packages/method`, evoluindo junto com o produto. Um projeto comum instala o método preso numa tag e trata `node_modules/metri` como somente leitura: é isso que impede quem constrói de mexer nas regras e nos checks que julgam o próprio trabalho. No monorepo, `packages/method` é uma pasta como outra qualquer.

A partir da slice do tracer, a construção reescreve as skills para pedir o trabalho e entregar o resultado por ferramentas que só existem com o Metri rodando. Se o processo usasse o método da própria branch, a ferramenta de construção mudaria no meio da construção.

### Como o mercado faz

- Quem se constrói consigo mesmo compila com uma versão já lançada e fixada, trocada de propósito. O Rust fixa o compilador beta em `src/stage0`, trocado pelo comando `bump-stage0`, e o código da árvore só vale a partir do estágio seguinte (`rust-lang/rust`, `src/stage0` e o rustc-dev-guide, "what bootstrapping does"). O TypeScript 6.0 compila com o pacote já publicado e só promove o compilador novo pela tarefa `hereby LKG` (`microsoft/TypeScript`, branch `release-6.0`, `scripts/build/projects.mjs` e `Herebyfile.mjs`).
- O Go exige uma toolchain de bootstrap mais antiga, e só depois compila a si mesmo (https://go.dev/doc/install/source). O pnpm fixa a versão publicada em `packageManager` e nunca usa o código do próprio checkout para instalar (`pnpm/pnpm`, `package.json`).

O Metri segue o Rust e o TypeScript: até o tracer, o processo usa o método numa tag; depois, usa o do repositório, como os estágios seguintes do Rust, com a versão gravada em cada Run. O pnpm é o caso em que a versão fica presa sempre.

## Decisão

A decisão tem duas fases.

Até o tracer, o processo de construção usa o método preso numa tag; o `package.json` da raiz diz qual. `packages/method` evolui como parte do produto, sem mudar o processo. Trocar a tag que o processo usa exige uma tag nova e a aprovação do humano.

Na slice do tracer, a skill de construção passa a usar as ferramentas do Metri e deixa de gravar status e de fazer merge, porque essas ferramentas só existem a partir dela. A mudança fecha a slice numa tag nova, aprovada pelo humano, que é a que o Run de aceite do tracer usa. As outras mudanças no método e quantas tags elas pedem antes da fundação se decidem no Look across.

Depois do tracer, o processo usa `packages/method` pelo link do workspace, e o Metri grava em cada Run a versão do método com que ele rodou.

O gatilho da troca é o aceite da slice do tracer, com o critério de pronto dela cumprido: um ticket do repositório do Metri vai de aberto a feito conduzido pelo Metri, sem o humano tocar no código. O teste: todo commit entre o início do Run e o merge tem uma de duas identidades, a do Run ou a da fila de integração. Um ticket do método faz a troca, depois desse aceite.

Nas duas fases, `packages/method` só muda em ticket próprio do método, e a mudança segue as regras do Source: CHANGELOG, poda e texto no presente. O `metri scope` falha quando outro ticket toca `packages/method`.

## Alternativas consideradas

- Link do workspace desde o início, com guarda: a ferramenta de construção mudaria no meio da construção, quando as skills passam a depender do Metri rodando.
- Método preso numa tag para sempre: toda mudança no método precisaria de uma tag antes de o processo usá-la, os dois passos por mudança que o monorepo existe para evitar.
- Link do workspace sem guarda: um ticket poderia afrouxar, no mesmo diff, o check que o julga.

## Consequências

- A raiz do repositório deixa de se chamar `metri`: com o nome do pacote na raiz, os comandos do método rodam em modo source e não conferem `docs/` nem `.metri/`.
- O `AGENTS.md` do Source vai para `packages/method`, e a raiz ganha o `AGENTS.md` de projeto.
- Até o tracer, uma correção no método de que o processo precise espera uma tag nova.
- Depois do tracer, cada Run guarda a versão do método que usou, e uma mudança no método só vale para os Runs abertos depois dela.

## Imposto por

`metri scope`, estendido na fundação para falhar quando um ticket que não é do método toca `packages/method`. Um ticket do método é um T `pattern` com a área `method`. Até essa extensão, não imposto.
