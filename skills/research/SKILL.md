---
name: research
description: Investigate a question against high-trust primary sources in a background agent and bring back a short conclusion with sources. Use when a decision depends on a fact outside the repository, or when docs or API facts need gathering.
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Return a short conclusion, citing each claim's source.

The conclusion becomes a decision (an ADR, through the domain-language skill) or is discarded. Nothing of the research is saved in the repo.
