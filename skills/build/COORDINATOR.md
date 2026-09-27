# Coordinator mode

Parallel work only for **unblocked** tickets or subtasks with no `touches` in common, in different areas. Schema and migrations are serialized, never parallel.

- **Coordinator**: this session, the slice's (or the initiative's). It hands out tickets and subtasks, merges each into `slice/<id>` after its checks pass, and talks to the human.
- **Worker**: one per ticket or subtask, a sub-agent in its own worktree with a clean context, told to read `.metri/skills/build/SKILL.md` and build that one ticket. A new worktree needs `.metri/` checked out in it (for a submodule: `git submodule update --init`).
- A worker reports only to the coordinator; workers never talk to each other. They communicate through artifacts: the ticket's status, `PP-n`, `GAP-n` and `notes`.
