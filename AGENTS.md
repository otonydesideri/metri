# AGENTS.md

This repository is the global Architecture Source of the "Slices com Guardrails" methodology.

## How to work here

- The method lives in `skills/`, `architecture/` and `VOCABULARY.md`; `README.md` is the human overview (why, principles, map, starting a project, the pilot). Skills are written for projects: `.metri/<path>` in a skill is `<path>` here.
- What the pilot measures and what feeds the next version: `README.md`, "Validação e melhoria (piloto)".
- Change a rule in `architecture/` only when the task asks for it, by `skills/writing-for-agents/RULE-FORMAT.md`.
- Before committing: `pnpm verify` green. A change that reaches projects gets its line in `CHANGELOG.md`, under the next version.
- Language: keys, ids and skills in English; prose of rules and ADRs in Portuguese. Full policy: `README.md`, "Política de idioma".
