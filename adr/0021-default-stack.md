# ADR-0021 Stack padrão

status: accepted
area: defaults
kind: decision

## Contexto

- A mesma stack se repete entre os projetos, e as regras a citam no próprio texto (METHODOLOGY 6.2).
- A lista dessa stack precisa de uma casa só, fora das regras.

## Decisão

- A stack padrão é a lista de `architecture/defaults/stack.md`, "Stack".
- Projeto que não decide nada diferente usa essa stack.
- Projeto com outra stack registra a troca em ADR do projeto e escreve regra de projeto para o que muda.

## Alternativas consideradas

- Stack decidida em cada projeto, sem default: cada projeto decidiria de novo o que as regras já assumem no texto.
- Seção "Stack padrão" em cada regra: a mesma lista copiada em vários arquivos.

## Consequências

- As regras citam a stack no texto; a lista única fica em `architecture/defaults/stack.md`.
- Escolha ainda aberta dentro da stack tem ADR próprio (ADR-0001, ADR-0012, ADR-0017).

## Imposto por

Não imposto.
