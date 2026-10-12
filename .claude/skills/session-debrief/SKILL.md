---
name: session-debrief
description: Write a teaching debrief of what was actually built in this coding session — the decisions that mattered, why they were made that way, what the alternatives were, and what would break. Use this whenever the user asks to review, recap, debrief, or "explain what we did", asks what they should have learned from a session, says they don't fully understand the code that was just generated, or wants to check their own understanding before merging. Also use it proactively at the end of a long or non-trivial session, or before a commit, when the user has been accepting changes fast without inspecting them.
---

# Session Debrief

The purpose of this skill is to close the gap between *code that exists* and *code the user can defend*. Fast agentic coding makes it easy to ship things nobody on the team actually understands. This skill turns one session into a lesson, and is honest about the parts the user would struggle to explain if asked in a code review.

This is not a changelog and not a summary. A changelog says what changed. This says why it was done that way, what else could have been done, and what happens when it breaks.

## Step 1: Read the code, not the conversation

Do not write the debrief from memory of the chat. Conversation memory is lossy and flattering — it remembers intentions, not what actually landed on disk. Start from the diff:

```bash
git status
git diff
git diff --staged
git log --oneline -10
```

If the work is already committed, diff against the commit the session started from. If the repo isn't under version control or the diff is empty, say so and reconstruct from the files that were touched, but flag that the reconstruction is less reliable.

Read enough surrounding code to understand how the changes fit the existing system. A change is only explainable in context.

## Step 2: Decide whether there is anything worth teaching

Be honest here. Some sessions are renaming variables, bumping dependencies, or fixing typos. If that's what happened, write three lines saying so and stop. Manufacturing depth out of a trivial session trains the user to skim these documents, which destroys the point of the skill.

Something is worth including when at least one of these holds:
- A decision was made where a competent engineer could reasonably have chosen differently
- The code depends on a behaviour of a framework, protocol, or external system that isn't obvious from reading it
- It touches state, concurrency, money, auth, data migration, or anything external and unreliable
- Getting it wrong would fail silently or only under load
- The user asked for the outcome but never specified the mechanism, so the mechanism was chosen for them

Skip: boilerplate, formatting, anything mechanically implied by a decision already covered.

## Step 3: Write the debrief

Save it to `.claude/debriefs/YYYY-MM-DD-<short-slug>.md` in the repo, so debriefs accumulate into a log the user can reread. Create the directory if needed. Tell the user the path when finished.

Use this structure:

```markdown
# <Date> — <what this session was about, in plain words>

## What changed
Two or three sentences. What the system could not do before and can do now.
Name the files that matter, ignore the rest.

## The decisions that mattered

### 1. <The decision, phrased as a question that was answered>
**The problem:** what forced a choice here.
**What we did:** the mechanism, concretely.
**Why this and not something else:** the alternatives that were real, and the
tradeoff that decided it. If the deciding factor was "it's the convention in this
codebase" or "it was the fastest thing that worked", say exactly that — a weak
reason honestly labelled is more useful than a strong-sounding invented one.
**What breaks it:** the input, timing, or failure mode this does not survive.

### 2. ...

## Concepts worth knowing beyond this codebase
Only for ideas that transfer: idempotency, cache invalidation, an isolation level,
a protocol guarantee, a framework's rendering model. Explain the idea itself, not
its use here. One short paragraph each. Skip this section if nothing qualifies.

## What you'd struggle to defend right now
The honest part. Code that landed without being examined, assumptions baked in
without being checked, error paths never exercised, TODOs disguised as done.
Be specific and name lines. If there's nothing, say so — but look properly first.

## Check yourself
Four or five questions, hardest first, answers hidden below. See Step 4.

## If you have 20 more minutes
One or two concrete follow-ups, ordered by value: a test that would have caught a
real bug, a failure path to exercise manually, a line to rewrite from scratch
without assistance. Not a wishlist — things that would genuinely raise confidence.
```

## Step 4: Make the reader work before you explain

Passive reading feels like learning and mostly isn't. Retrieval does the work. So the `Check yourself` section asks questions *first*, with answers collapsed underneath:

```markdown
**1. Why does `processWebhook` check the event ID against the database before doing anything else?**

<details><summary>Answer</summary>

Because the provider guarantees at-least-once delivery, not exactly-once...

</details>
```

Good questions target the reasoning, not the syntax. "What happens if this webhook arrives twice?" is a good question. "What does `useEffect` do?" is not. Aim for questions where a wrong answer reveals a real misconception, and where the user has to reconstruct the reasoning rather than recall a fact.

## Step 5: Diagram only when it beats prose

Reach for a visual when the thing being explained is a sequence over time, a state machine, a data flow across boundaries, or a structure with more than three interacting parts. Do not diagram a linear function.

Default to a Mermaid block inside the markdown — it renders in most editors and stays in the same file. `sequenceDiagram` for interactions over time, `stateDiagram-v2` for lifecycles, `flowchart` for data movement.

Write a standalone HTML file next to the debrief only when the explanation genuinely needs interaction — stepping through states, comparing two request timelines, adjusting a parameter to see the effect. Keep it one self-contained file with no build step, and link it from the markdown.

## Tone

Assume a competent programmer who has zero context on this specific codebase and no prior exposure to the domain concept being explained. That combination is the target: never condescend about programming, never assume familiarity with the domain.

- Define jargon the first time it appears, in one clause, then use it freely
- Use concrete numbers and concrete failure stories over abstract description: "if two tabs write at 12:00:00.030 and 12:00:00.031, the second overwrites the first" beats "there may be race conditions"
- Short sentences. Active voice. No throat-clearing
- Never open a section by praising the work or the user. There is no audience for that here
- If a decision was arbitrary, say it was arbitrary. If something was cargo-culted, say so. The value of this document is entirely in whether the user trusts it to tell them when something is shaky

## What failure looks like

A debrief has failed if the user reads it, nods, and learns nothing they couldn't have guessed. The most common causes are: summarising the diff instead of interrogating it, explaining what the code does line by line instead of why it's shaped that way, treating every change as significant, and softening the "struggle to defend" section until it says nothing.
