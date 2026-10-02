---
name: diagnose
description: Diagnose a bug or a performance regression until a red check goes green, then answer "why didn't the guardrail catch it?" through the knowledge gate.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Before reporting to the user, call the Skill tool with "humanizer" on the report's prose.

# Diagnose

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, read `docs/CONTEXT.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in `docs/adr/` in the area you're touching.

## Redact

This skill has you show commands, outputs and captured artifacts. **Redact every secret and every piece of personal data first**: write `<REDACTED>` in its place. In an artifact shared outside the project (an issue, a vendor ticket, a PR to the Source), redact the owner or tenant identifiers too (the owner identity of `.metri/ARCHITECTURE.md`, "Delegações"). Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.

If the redacted output is not enough to diagnose the bug, say so and ask the user.

## Phase 1: Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a **tight** pass/fail signal for the bug (one that goes red on _this_ bug), you will find the cause; bisection, hypothesis-testing, and instrumentation all just consume it. If you don't have one, no amount of staring at code will save you.

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one, in roughly this order

1. **Failing test** at whatever seam reaches the bug: unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright / Puppeteer) that drives the UI and asserts on DOM/console/network.
5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
7. **Property / fuzz loop.** If the bug is "sometimes wrong output", run 1000 random inputs and look for the failure mode.
8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
10. **HITL bash script.** Last resort. If a human must click, drive _them_ with this skill's `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.

### Tighten the loop

Treat the loop as a product. Once you have _a_ loop, **tighten** it:

- Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
- Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop; a 2-second deterministic one is tight, a debugging superpower.

### Non-deterministic bugs

The goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100×, parallelise, add stress, narrow timing windows, inject sleeps. A 50%-flake bug is debuggable; 1% is not, so keep raising the rate until it's debuggable.

### When you genuinely cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for: (a) access to whatever environment reproduces it, (b) a redacted captured artifact (HAR file, log dump, core dump, screen recording with timestamps), or (c) permission to add temporary production instrumentation. Do **not** proceed to hypothesise without a loop.

### Completion criterion: a tight loop that goes red

Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one command** (a script path, a test invocation, a curl) that you have **already run at least once** (show the invocation and its output, redacted), and that is:

- [ ] **Red-capable**: it drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring"; it must be able to _catch this specific bug_.
- [ ] **Deterministic**: same verdict every run (flaky bugs: a pinned, high reproduction rate, per above).
- [ ] **Fast**: seconds, not minutes.
- [ ] **Agent-runnable**: you can run it unattended; a human in the loop only via `scripts/hitl-loop.template.sh`.

If you catch yourself reading code to build a theory before this command exists, **stop: jumping straight to a hypothesis is the exact failure this skill prevents.** No red-capable command, no Phase 2.

## Phase 2: Reproduce + minimise

Run the loop. Watch it go red as the bug appears.

Confirm:

- [ ] The loop produces the failure mode the **user** described, not a different failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
- [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.

### Minimise

Once it's red, shrink the repro to the **smallest scenario that still goes red**. Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop after each cut, and keep only what's load-bearing for the failure.

Done when **every remaining element is load-bearing**: removing any one of them makes the loop go green.

Do not proceed until you have reproduced **and** minimised.

## Phase 3: Hypothesise

Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe: discard or sharpen it.

**Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it; proceed with your ranking if the user is AFK.

## Phase 4: Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.

**Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Phase 5: Fix + regression test

Phases 1 to 4 commit nothing. The fix is a ticket, in the format of `node_modules/metri/skills/look-across/MATRIX-FORMAT.md` (a done slice reopens by its "Pruning" rule):

- A bug that breaks a criterion of a UC reopens that UC in its own ticket file: `status: in_progress`, what broke in "Notas"; its `slice`, `mode`, `areas`, `touches` and `sensitive` stay from before, since the file was never pruned or collapsed; a UC without a story gets one (MATRIX-FORMAT.md, "Ticket files").
- Any other bug becomes a T, its own new file in the slice whose code the fix changes, with the next free id of that slice: `type: task`, `mode: afk`, `status: in_progress`, "O que entrega" and "Critérios" for the fix, the `areas` and `touches` of that code, and `sensitive` by the criterion of MATRIX-FORMAT.md.
- Their `checks` get the regression check: the regression test's command (with no correct seam, the Phase 1 command, committed), plus `pnpm verify`.

Run `pnpm docs-lint`. Work on `ticket/<id>` by the Git rules of `node_modules/metri/skills/build/SKILL.md`, with `slice/<id>` taken again from main when the slice was merged; the new branch carries the uncommitted work of Phases 1 to 4. Before editing code, call the Skill tool with "guardrail".

Write the regression test **before the fix**, but only if there is a **correct seam** for it (call the Skill tool with "tdd"). A Phase 1 test that already sits at a correct seam, minimised, is that regression test.

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Carry it to Phase 7.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam.
2. Watch it fail.
3. Apply the fix.
4. Watch it pass.
5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.

## Phase 6: Cleanup

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is stated in the commit message, with the ticket id, so the next debugger learns
- [ ] The ticket's checks and `pnpm verify` are green

## Phase 7: Why didn't the guardrail catch it?

Answer it: which rung of the guardrail's ladder (check, pattern in the code, inline header, rule) would have stopped this bug, or why none could (a missing seam included). Call the Skill tool with "guardrail" and put the answer through its knowledge gate; the human approves its destination, or it is discarded. Write an approved lesson on `ticket/<id>`; a lesson for the Source goes as a PR to the Source's repository (`node_modules/metri/` is read-only). Then set the ticket's `status: done` and its `metrics` (`node_modules/metri/skills/look-across/MATRIX-FORMAT.md`, "Ticket files") and commit, with its id.

Done when the regression check is green, the answer has gone through the knowledge gate (written or discarded) and the ticket is `done`. Tell the user to run /accept on the slice to take the fix to main. A fix with `sensitive: true` is urgent: its ticket works on `slice/<id>` taken again from main, even when the slice isn't merged; /accept runs on that branch for it alone, and a `release` T of its own takes it to production right after.
