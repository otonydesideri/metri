# SPEC.md Format

`.metri/specs/<F-id>.md` is the feature's single file: the problem and the solution the user lives, its use cases,
the implementation and testing decisions, and what is out of scope. Adapted from the `to-spec` skill of
mattpocock/skills, MIT. Keys are fixed, in English, as `node_modules/metri/VOCABULARY.md` defines them;
section titles are fixed, in Portuguese, as in the Skeleton; the prose is in Portuguese. `pnpm docs-lint` checks the format.

## Skeleton

````markdown
---
id: F<n>
title: <feature>
status: draft | planned | done
horizon: now | planned | fog | out
milestone: <marco>
---

# F<n> · <feature>

## Problema

<o problema que a feature resolve, do ponto de vista de quem usa>

## Solução

<a solução, do ponto de vista de quem usa>

## Casos de uso

- UC<f>.<n> · <caso de uso>

## Decisões de implementação

<módulos, interfaces, mudanças de schema, contrato de API e interações que valem só para esta feature; cita o
contrato de slice e o ADR pelo id, sem repeti-los>

## Decisões de teste

<os seams onde a feature será testada, o mais alto possível, idealmente um, preferindo os que já existem; o que
torna um bom teste aqui; os testes que já servem de modelo>

## Fora de escopo

<o que a feature deliberadamente não faz>

## Notas

<o que não cabe nas seções acima>
````

`milestone` is a reserved field: optional, and written only with a value.

## Status

- `draft`: written by /shape, with Problema, Solução, Casos de uso (its UCs in `draft`) and Fora de escopo. Every
  candidate feature of the direction gate gets one, whatever its `horizon`.
- `planned`: /look-across fills Decisões de implementação and Decisões de teste, only for a `now` feature (a
  `planned`, `fog` or `out` feature's UCs stay `draft`, so its spec stays `draft` too, by "Matrix rules" in
  `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`).
- `done`: /accept sets it when the feature's last slice is accepted (every UC in "Casos de uso" is `done`). A
  `done` spec is history: /build's context chain doesn't read it, and nothing writes it again.

## Seções

- **Casos de uso**: only the id and the title of each UC of the feature, one per line (`- UC<f>.<n> · <título>`).
  Every UC whose `feature` is this spec's id appears here, `draft` included (`pnpm docs-lint` checks the ones
  outside `draft`). The UC's own file, `.metri/tickets/UC<f>.<n>.md`, is the single source of its BRs and
  criteria: the spec never repeats them.
- **Decisões de implementação**: no file path and no code, except a prototype snippet that encodes a decision
  better than prose (a state machine, a reducer, a schema, a type shape); mark it as coming from a prototype, and
  trim it to the decision, not a working demo. Cites the slice's `contract` and the ADR by id; doesn't repeat what
  they already say.
- **Decisões de teste**: the seams where the feature is tested (`node_modules/metri/skills/tdd/SKILL.md`, "Seams:
  where tests go"), what makes a good test here (external behaviour, not implementation;
  `node_modules/metri/skills/tdd/SKILL.md`, "What a good test is"), and the tests that already model it.
- The feature's slices are never listed on the spec (a decision that rests on a contract cites it by id): they are the `slice` of each UC in "Casos de uso", found in
  the UC's own ticket file. Writing them here would duplicate what the ticket already declares.

## Onde cada coisa mora

A spec aponta para os outros arquivos, sem repeti-los:

| O quê | Mora em |
| --- | --- |
| Critério e regra de negócio | O ticket (`.metri/tickets/<id>.md`) |
| Contrato de slice | `.metri/MATRIX.md`; construída a slice, o cabeçalho `SOURCE OF TRUTH` dos donos |
| Decisão difícil de reverter | ADR |
| Padrão que vale para mais de uma feature | Regra |

## Example

```markdown
---
id: F1
title: Pedidos no painel
status: planned
horizon: now
---

# F1 · Pedidos no painel

## Problema

O operador não sabe quais pedidos aguardam ação sem abrir cada um, e o cliente não sabe se o pedido foi
confirmado.

## Solução

O operador acompanha os pedidos da organização numa lista, mais recentes primeiro; o cliente recebe um aviso
quando o pedido é confirmado.

## Casos de uso

- UC1.1 · Listar pedidos
- UC1.2 · Avisar pedido confirmado

## Decisões de implementação

O aviso de confirmação nasce do evento de pedido confirmado, sem módulo novo. Sem mudança de schema.

## Decisões de teste

Seam único: a resposta da rota de listagem e o payload do evento `events:order-confirmed`; comportamento externo,
não implementação interna. O teste de `orders-page` já modela o primeiro.

## Fora de escopo

Relatórios agregados por período (F2).

## Notas
```
