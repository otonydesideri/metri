---
name: setup
description: Set up a project for the method, or activate a capability whose trigger just appeared. Pins the Source at .metri/, wires its skills and scripts, writes AGENTS.md, CLAUDE.md and docs/architecture/INDEX.md.
disable-model-invocation: true
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default); before AGENTS.md exists, ask and report in pt-BR from the first question.

# Setup

Scaffold what the other skills assume:

- **Source**: the Architecture Source at `.metri/`, read-only, at a pinned version.
- **Wiring**: the Source's skills in `.claude/skills/`, its scripts in `package.json`.
- **Agent files**: `AGENTS.md` and `CLAUDE.md`.
- **Activation**: `docs/architecture/INDEX.md`, with what the project activated and decided, by [ACTIVATION.md](ACTIVATION.md).

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `.gitmodules` and `.metri/`: is the Source mounted, and at which tag (`git -C .metri describe --tags --exact-match`)?
- `AGENTS.md` and `CLAUDE.md` at the repo root: does either exist, and what does it hold?
- `docs/PRODUCT.md`, `docs/CONTEXT.md`, `docs/DESIGN.md`, `docs/architecture/INDEX.md`, `docs/adr/` and `docs/plan/MATRIX.md`.
- `package.json` (scripts, dev dependencies) and `.claude/skills/`.
- The code: the apps and packages (`pnpm-workspace.yaml`, `apps/*`, `packages/*`) and the signs of each trigger in [ACTIVATION.md](ACTIVATION.md) and in the "Capacidades condicionais" table of `.metri/architecture/INDEX.md`.

On a project already set up, every step keeps what exists and adds only what is missing; a trigger that showed up since (the first job, the first asset) is resolved by steps 3 to 6 of "Order" in [ACTIVATION.md](ACTIVATION.md).

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order. One section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word; skip a section when exploration already settled it.

**Section A: Source.** `.metri/` holds the Source at a tag (recommended: the latest). Not mounted: `git submodule add <source repository> .metri`, then check out the tag in it. Mounted on a branch or an untagged commit: check out the tag. A package works too, when it puts the pinned Source at `.metri/`. `.metri/` is a development dependency: keep it out of the build, the typecheck, the lint and the delivered code.

**Section B: Capabilities.** Name the project's capabilities from what exploration found and what the user says the project is. For each row of the "Capacidades condicionais" table of `.metri/architecture/INDEX.md` whose trigger shows up, ask its `activation` question; on yes, resolve the values its rule's `not_covered` leaves to the project (`→ project:architecture/INDEX`).

**Section C: Delegations.** For each row of the delegation matrix in [ACTIVATION.md](ACTIVATION.md) whose trigger is present now, ask what the project decides, showing the Source's constraints and the default. A value nothing depends on yet may wait: it is resolved before the first point that depends on it, at the latest in the /look-across that plans that point.

**Section D: Stack.** Only what differs from `.metri/architecture/defaults/stack.md`, each difference with its ADR.

### 3. Confirm and edit

Show the user a draft of:

- `AGENTS.md` and `CLAUDE.md`;
- `docs/architecture/INDEX.md`;
- the ADRs (call the Skill tool with "domain-language");
- the `package.json` scripts and dev dependencies, and the `.claude/skills/` links.

Let them edit before writing.

### 4. Write

- **Agent files.** Copy [AGENTS-TEMPLATE.md](AGENTS-TEMPLATE.md) to `AGENTS.md` and [CLAUDE-TEMPLATE.md](CLAUDE-TEMPLATE.md) to `CLAUDE.md`. When either already exists, keep the project's own content: `AGENTS.md` takes the template's sections, merged in place; `CLAUDE.md` becomes the template's one line, and what it held moves to `AGENTS.md`. `AGENTS.md` stays about 20 lines, in English: procedures and pointers with the condition to follow them, never architecture or what the environment already shows (`pnpm docs-lint` warns past 30).
- **Activation.** Copy [INDEX-TEMPLATE.md](INDEX-TEMPLATE.md) to `docs/architecture/INDEX.md` and fill it by "Record" in [ACTIVATION.md](ACTIVATION.md).
- **Skills.** Link each skill folder of the Source into `.claude/skills/`, so the files live only in `.metri/`:

  ```bash
  mkdir -p .claude/skills
  for dir in .metri/skills/*/; do name=$(basename "$dir"); ln -sfn "../../.metri/skills/$name" ".claude/skills/$name"; done
  ```

- **Scripts.** In `package.json`, the dev dependencies `tsx`, `yaml` and `picomatch`, and these scripts; in `pnpm-workspace.yaml`, `allowBuilds: { esbuild: false }`, as in the Source (without it, `pnpm install` stops at the build script of `esbuild`, a dependency of `tsx`); then `pnpm install`:

  ```json
  "verify": "tsx .metri/template/scripts/verify.ts",
  "docs-lint": "tsx .metri/template/scripts/docs-lint.ts",
  "rules-for": "tsx .metri/template/scripts/rules-for.ts",
  "rules-index": "tsx .metri/template/scripts/rules-index.ts docs/architecture",
  "rules-index:check": "tsx .metri/template/scripts/rules-index.ts docs/architecture --check",
  "matrix-view": "tsx .metri/template/scripts/matrix-view.ts",
  "matrix-view:check": "tsx .metri/template/scripts/matrix-view.ts --check"
  ```

### 5. Done

Done when:

- `.metri/` is at the pinned tag, and every `.claude/skills/<name>` resolves to `.metri/skills/<name>/SKILL.md`;
- every conditional capability with a trigger is answered in `docs/architecture/INDEX.md`, and the "Check" list of [ACTIVATION.md](ACTIVATION.md) holds;
- `pnpm verify` is green.

Tell the user the setup is complete, to commit it (the agent never commits on main), and to run /shape next (after /reload-skills when `.claude/skills/` didn't exist when the session started): /shape defines the product, the domain terms and, when the project has an interface, the visual style (`docs/DESIGN.md`).
