# CONTEXT.md Format

`docs/CONTEXT.md` is the project's shared language: each domain term in Portuguese with its canonical English identifier, which is the name in code and the SOT keyword. Prose in Portuguese; the section titles are fixed.

## Structure

```md
# Contexto: <Produto>

## Termos

**Pedido** · `Order`
Solicitação de compra confirmada pelo cliente.
_Evitar:_ Encomenda, Purchase, Request

## Relações

Um `Order` tem um ou mais `OrderItem`; pertence a um `Customer`.

## Ambiguidades resolvidas

"Conta" era usada para `Account` e `Customer`: são coisas diferentes.
```

## Rules

- **Every term carries** its Portuguese name, its English identifier, its definition and, when there are any, the synonyms to avoid.
- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Evitar:_`, in Portuguese and in English.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.
- **Group terms under subheadings** when natural clusters emerge, one per bounded context when the project has more than one. If all terms belong to a single cohesive area, a flat list is fine.
- **Relations and resolved ambiguities** go in their own sections.
- **No business rules and no code conventions**: business rules are UCs and BRs in `.metri/MATRIX.md`; code conventions are architecture rules.
