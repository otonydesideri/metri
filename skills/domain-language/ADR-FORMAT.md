# ADR Format

ADRs live in `docs/adr/`, the project's decisions, cited `ADR-NNNN` and numbered sequentially: `0001-<slug>.md`, `0002-<slug>.md`, etc. The Source has no ADR: a global decision lives in its owner rule.

Create the `docs/adr/` directory lazily: only when the first ADR is needed.

## Template

Prose in Portuguese; the header keys and the section titles are fixed, and `pnpm docs-lint` checks them.

```md
# ADR-NNNN <título>

status: accepted | superseded by ADR-NNNN
area: <área>
kind: decision | exception | default-change

## Contexto

## Decisão

## Alternativas consideradas

## Consequências

## Imposto por

(Check ou lint que garante a decisão, ou "não imposto".)
```

- `kind`: `exception` for an exception to a global rule, `default-change` for a swapped global default, `decision` for the rest. With `exception` or `default-change`, "Decisão" opens with the rule id (and section) or the default it replaces, and the scope where it holds.
- `status`: `accepted`, or `superseded by ADR-NNNN` once a later ADR replaces it. An ADR is never deleted.
- What the decision explicitly is not goes under "Alternativas consideradas".

## Numbering

Scan `docs/adr/` for the highest existing number and increment by one.

## When to offer an ADR

Only for a decision already taken, and all three of these must be true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it: you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

Always an ADR, on top of the three: every exception to a global rule and every swap of a global default.

Never an ADR: an open question. It stays in the owner rule, in "Em aberto" (`node_modules/metri/skills/writing-for-agents/RULE-FORMAT.md`, "Ponto em aberto").

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library: just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it; otherwise someone will suggest GraphQL again in six months.
