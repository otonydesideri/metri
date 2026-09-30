# AGENTS.md

This repository is the global Architecture Source of the "Slices com Guardrails" methodology, installed in projects as the package `metri`.

## How to work here

- The method lives in `skills/`, `agents/`, `architecture/` and `VOCABULARY.md`, the CLI in `cli/` and the code `metri init` gives a new project in `starter/`; `README.md` is the human overview (why, principles, map, starting a project, the pilot). Skills and templates are written for projects: `node_modules/metri/<path>` in them is `<path>` here, and `.metri/` is the project's own state.
- What the pilot measures and what feeds the next version: `README.md`, "Validação e melhoria (piloto)".
- Change a rule in `architecture/` only when the task asks for it, by `skills/writing-for-agents/RULE-FORMAT.md`.
- Every change to a `.md` ends with a prune by `skills/writing-for-agents/SKILL.md`, "Pruning".
- Before committing: `pnpm verify` green. A change that reaches projects gets its line in `CHANGELOG.md`, under the next version.
- Language: keys, ids and skills in English; prose of rules and ADRs in Portuguese. Full policy: `README.md`, "Política de idioma".
