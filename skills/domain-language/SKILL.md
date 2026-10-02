---
name: domain-language
description: Build and sharpen the project's domain language (docs/CONTEXT.md, each Portuguese term with its English code identifier) and record ADRs. Use when discussing domain terms or code identifiers, writing or editing docs/CONTEXT.md, or recording or editing an ADR.
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Before writing a definition in `docs/CONTEXT.md` or the prose of an ADR, call the Skill tool with "humanizer" on it.

# Domain Language

Actively build and sharpen the project's domain language as you design. This is the *active* discipline: challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `docs/CONTEXT.md` for vocabulary is not this skill: that's a one-line habit any skill can do. This skill is for when you're changing the language, not just consuming it.)

## File structure

```
/
├── docs/
│   ├── CONTEXT.md
│   └── adr/
│       ├── 0001-orders-server-pagination.md
│       └── 0002-postgres-for-write-model.md
└── apps/
```

One `docs/CONTEXT.md` per project. Create files lazily: only when you have something to write. If no `docs/CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `docs/CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"

### Update docs/CONTEXT.md inline

When a term is resolved, update `docs/CONTEXT.md` right there, with its English identifier: the name in code and the SOT keyword. Don't batch these up: capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`docs/CONTEXT.md` should be totally devoid of implementation details. Do not treat it as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Offer an ADR only by "When to offer an ADR" in [ADR-FORMAT.md](./ADR-FORMAT.md), and write it in that format.
