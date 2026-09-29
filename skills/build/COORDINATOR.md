# Coordinator mode

For several ticket ids, or a slice id. Only **unblocked** tickets or subtasks run in parallel (a slice in `blocked_by` only once /accept merged it into main), when their `touches` don't overlap and their areas differ. Schema and migrations run alone, never in parallel.

- **Coordinator**: this session, the slice's (or the initiative's). It hands out the tickets (UCs and T) and subtasks (a ticket is taken once handed out), writes every `status` and `metrics` in each ticket's file, merges each ticket branch into `slice/<id>` after its checks pass, one at a time, and talks to the human.
- **Worker**: one per ticket or subtask, the `builder` agent (`.claude/agents/builder.md`, which owns its isolation and its report) in its own worktree, with a clean context, the ticket id and its own `E2E_PORT`, a different one per worker (`node_modules/metri/architecture/frontend/testing.md`, "E2e de critério de UI"). A new worktree runs `pnpm install` first: the skills and the global rules come from `node_modules/metri/`. Every worker uses the project's one database server.
- Workers communicate through artifacts: the state each one reports, `PP-n`, `GAP-n` and `notes`.
- A merged `GAP-n` or `PP-n` whose number is already taken on the slice branch gets the next free number from the coordinator, in the matrix and in the code.
