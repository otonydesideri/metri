---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Adapted from mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 (MIT)

Ask and report in the user's language set in AGENTS.md (pt-BR by default).

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it. A running exploration is an unsettled prerequisite: only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

## Defined, inferred, ask

Before asking, classify each open decision:

- **Defined**: an approved artifact, the conversation, an attachment or a global default answers it. Cite the source instead of asking.
- **Inferred**: it follows from an approved artifact or the code and is cheap to reverse. Decide it, give the reason in one line, and confirm it at the next gate.
- **Ask**: taste, business, hard to reverse, sensitive, or two reasonable options. Only these enter the frontier, one decision per question, with your recommendation.

At every gate, show three blocks: **Defined** (each with its source), **Inferred** (each with its reason) and **Open questions**.

Unattended, take your recommendation, mark it _unconfirmed_ and show it first at the next gate. A hard-to-reverse decision waits for the user.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
