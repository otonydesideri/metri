---
name: accept
description: Accept a slice, and its feature when it is the last slice. Isolated reviewers on contract, patterns, experience and risk, the consumer test, the human gate, the knowledge gate and the matrix pruning.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Before showing the reports or a lesson's text, call the Skill tool with "humanizer" on their prose.

Judge what no check judges, on the commits of a slice, along separate axes:

- **Contract**: does the code deliver the slice contract, its UCs and its T tickets?
- **Patterns**: does the code pass the verification items of its rules that no check covers?
- **Experience**, when the slice has a `Tela:` criterion: what does the user live on its screens?
- **Risk**: what can still break in production that no contract, rule or check names?

The work never judges itself: each axis is a reviewer agent, blind to the builder's conversation. Every reviewer writes its findings in the format of [FINDING-FORMAT.md](FINDING-FORMAT.md).

## Process

Branches, merges and commit subjects: `node_modules/metri/skills/build/SKILL.md`, "Git".

### 1. Pin the fixed point

The slice's commits are the integration branch's commits whose subject starts with the id of a ticket with `slice: S<id>`, after the slice's last `S<id> accepted`; its tickets are those commits' tickets. The slice is ready when every ticket with `slice: S<id>` is `done`; for the urgent fix of /diagnose, when that ticket is, and it is the slice's only ticket. Done tickets of other slices are history: /accept reads and changes only the slice's tickets.

Check out the integration branch with a clean working tree: its tip is the fixed point. There, once, run each command of the tickets' `checks` (an e2e with `METRI_EVIDENCE=<id>`, which records fresh `Tela:` evidence) and `pnpm verify`, keeping each result: the reviewers and the human see these.

A later round reviews only the tickets the previous round reopened or created, leaving out its `mecânico` T, which its checks prove; steps 2 to 5 take only those tickets, and the earlier rounds' decisions come from the Notas of the slice's tickets (step 5).

Done when the slice is ready and every command exits 0.

### 2. Gather the inputs

Run `pnpm rules-for` once, with every path of the commits.

- **Contract**: the slice's `contract` block in `.metri/MATRIX.md`, which /accept prunes only in step 7 (`S0` has none); the file of each ticket, whole; and the Fora de escopo of each UC's feature spec.
- **Patterns**: in each listed rule, leaving out the `citada:` lines and `frontend/experience` (its items go to Experience), the items of its verification sections ("Verificação", "Verificação rápida") without a `(check: <id>)` mark; the marked ones passed `pnpm verify`. With no such item, skip the Patterns reviewer and say so.
- **Experience**, when a ticket has a `Tela:` criterion: the evidence paths of each `Tela:` criterion, `docs/DESIGN.md`, the UCs, and the unmarked verification items of `frontend/experience`.
- **Risk**: the slice's `contract` block and the BRs of each UC.

### 3. Call the reviewers in parallel

Call each agent (`.claude/agents/<name>.md` owns its brief and what it may read) as a sub-agent, with only its inputs. Every reviewer also gets the `exceção:` lines `pnpm rules-for` printed, and every agent, from the second round on, the earlier rounds' decisions.

- `reviewer-contract`, `reviewer-patterns` and `reviewer-risk`: the fixed point, the commits as `<hash> <subject>`, the check results, and their axis's inputs pasted in full (the Patterns items with their rule id).
- `reviewer-ux`, when the slice has a `Tela:` criterion: the Experience inputs.
- `consumer-tester`: the contract's `interface`, when its `consumers` include an external consumer (a public API, a library, a guide for agents, a critical user flow; ask the user when unsure); and, for each UC with a `Tela:` criterion, only its story (its title, for a done UC without one) and the URL of the app this session serves once for it, on its own port, with the development seed and, behind login, the credentials of one seeded account per role the story needs (`frontend/testing`, "E2e de critério de UI"), stopped when the tester reports. With no browser tool in this session, tell the user first.

### 4. Aggregate

Present the reports in the chat, each axis apart so none masks another, under `## Contract`, `## Patterns` and `## Risk` (and `## Experience`, `## Consumer`), findings unchanged, in the reviewer's three groups, the "Apêndice" collapsed into one line with its count. A reviewer that failed, timed out or reported **não coberto** leaves its axis uncovered: say so under its heading, never as an axis without findings.

### 5. Human gate

Call the Skill tool with "grilling" and walk the human through:

- the slice's linear path: the "Caminho linear" of `.metri/ARCHITECTURE.md` with the slice's new owners in their places, each step as `arquivo:símbolo` with its `SOURCE OF TRUTH:` header;
- for each criterion, the paths of its evidence (the test that proves it and, for a `Tela:` criterion, `.metri/tickets/<id>/<n>-desktop.png`, and `<n>-mobile.png` for one about the phone), with visual conformity to `docs/DESIGN.md`; and, when every UC of a feature's spec is `done` (its last slice), whether its Solução holds across all its UCs. Give the steps to run the app per criterion when the human wants them;
- the commits (`git show <hash>`) of every ticket with `sensitive: true` or `type: pattern`;
- each finding, with its group and the reviewer's recommendation: a `mecânico` finding grouped Corrigir agora is Inferred, decided with its reason unless the user objects; the user decides every other finding;
- each uncovered axis: the user decides whether the slice is accepted without it or the axis runs again.

What each decision does (the formats: `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`):

- **Corrigir agora**: reopens its UC (`in_progress`, the finding in its ticket file's "Notas"), or becomes a T of the slice when no UC covers it; all the round's `mecânico` findings go into one T.
- **Virar T**: a new T, `open`, for a later /build; the acceptance goes on, and the slice stays `horizon: now` by the pruning rule.
- **Aceitar como está**: the code stays; the finding and its decision go in one line of the Notas of the ticket it is about, and to the knowledge gate as a lesson candidate.

With a Corrigir agora, close the round and stop before step 6: write the reopened UCs, the new Ts and step 1's evidence, and commit them on the integration branch with the human's approval. Once /build integrates those tickets, the next round starts at step 1.

### 6. Knowledge gate

Collect the proposed lessons: the findings accepted as they are (the earlier rounds' in the Notas), `PP-n`, `GAP-n`, repeated fixes and the decisions in the Notas of the slice's tickets and, on a feature's last slice, in its spec's Decisões de implementação, each with its evidence; an approved decision leaves the Notas. When the slice hurt (many findings, proposals or fixes), an architecture survey in a sub-agent brings back only its conclusion, as one more lesson. Call the Skill tool with "guardrail" and put each lesson through its knowledge gate; write each destination the human approves. `node_modules/metri/` is read-only: a lesson for the Source goes in `.metri/SOURCE-LESSONS.md`.

### 7. Prune and merge

Once a test of the slice's `checks` proves each invariant of the contract and each owner has its `SOURCE OF TRUTH` header (WHAT, WHY, WHERE, one short sentence each), prune the matrix by "Pruning" in "Matrix rules" of `node_modules/metri/skills/look-across/MATRIX-FORMAT.md`; the steps the human saw in step 5 enter the "Caminho linear" of `.metri/ARCHITECTURE.md`, and `pnpm exec metri prune <slice id>` takes its tickets' evidence out of the tree. Keep every id, commit, and run `pnpm docs-lint` and `pnpm verify`. Then, with the human's approval, commit it on the integration branch as `S<id> accepted`.

Done when the slice's `S<id> accepted` commit, or the round's, is on the integration branch; every finding has the user's decision; once accepted, the slice is collapsed in the MATRIX, every lesson has an approved destination or is discarded, and `pnpm verify` is green.
