# Coordinator mode

For several ticket ids, or a slice id. Only **unblocked** tickets or subtasks run in parallel, when their `touches` don't overlap and their areas differ. Schema and migrations run alone, never in parallel.

- **Coordinator**: this session, the slice's (or the initiative's). It hands out the tickets (UCs and T) and subtasks (a ticket is taken once handed out), writes every `status` and `metrics` in each ticket's file, merges each ticket branch into `slice/<id>` after its checks pass, one at a time, and talks to the human.
- **Worker**: one per ticket or subtask, a sub-agent in its own worktree with a clean context, told to read `.metri/skills/build/SKILL.md` and build that one ticket, without writing `status` and without merging it. A new worktree needs `.metri/` checked out in it (for a submodule: `git submodule update --init`).
- A worker reports only to the coordinator; workers never talk to each other. They communicate through artifacts: the state it reports, `PP-n`, `GAP-n` and `notes`.
- A merged `GAP-n` or `PP-n` whose number is already taken on the slice branch gets the next free number from the coordinator, in the matrix and in the code.
