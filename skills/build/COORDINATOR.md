# Coordinator mode

For several ticket ids, or a slice id. Run in parallel the frontier tickets and subtasks ([SKILL.md](SKILL.md)) whose `touches` don't overlap and whose areas differ. Schema and migrations run alone, never in parallel.

- **Coordinator**: this session. It hands out tickets and subtasks (a ticket is taken once handed out), writes every `status` and `metrics`, integrates each ticket after its checks pass, one at a time (SKILL.md, "Git"), and talks to the human.
- **Worker**: the `builder` agent (`.claude/agents/builder.md`, which owns its isolation and its report), one per ticket or subtask, with a clean context, the ticket id and its own `E2E_PORT` (`node_modules/metri/architecture/frontend/testing.md`, "E2e de critério de UI").
- **Worktree**: one per worker, on `ticket/<id>`; it runs `pnpm install` first, for `node_modules/metri/`.
- **Database**: every worker uses the project's one database server.
- Workers communicate through artifacts: the state each one reports, `PP-n`, `GAP-n` and `notes`.
- An integrated `GAP-n` or `PP-n` whose number the integration branch already has gets the next free one from the coordinator, in the matrix and the code.
