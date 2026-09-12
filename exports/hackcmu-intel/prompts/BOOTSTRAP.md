# Copy-paste launch prompt for the new lead agent

Copy `hackcmu-intel/` into the receiving repo first. Fill the project idea and morning deadline below; add known constraints. The remaining choices can be left to the lead. This is an input template, not a statement that a replacement application or unattended process already exists.

```text
Build this replacement HackCMU project in the current repository using this agent
environment's available runtime, tools, and permissions. The intelligence folder
itself starts no process; this prompt supplies the work for the active lead agent.

PROJECT IDEA: [Describe the idea, intended user, and core useful action. Required.]
MORNING HANDOFF: [Absolute date, time, and timezone. Required for an overnight run.]
FIXED STACK / DEVICES: [List any commitments, or say choose from existing repo/team familiarity.]
MAIN TRACK: [Optimization / Traveling / Multiplayer / Food, or evaluate the best fit.]
AVAILABLE SERVICES: [Service names and where authorized credentials are configured. No secret values.]
SPENDING / RUN LIMITS: [Any specified limits; use the existing environment and permissions.]
PUBLISHING SCOPE: [Local candidate only, or explicitly authorized remote/deployment actions.]
OTHER NON-NEGOTIABLES: [Anything else the team has decided.]

The goal is a distinctive, working, demo-ready product that can compete for a
HackCMU track. Work autonomously through implementation and verification, within
the supplied scope and actual permissions. Do not stop after a plan or scaffold.
Winning matters more than feature count, infrastructure, or a large agent panel.

First read the current repo's agent instructions and Git status. Read:
- hackcmu-intel/AGENT_BRIEF.md
- hackcmu-intel/event/FACTS.md
- hackcmu-intel/strategy/PLAYBOOK.md
- hackcmu-intel/strategy/LESSONS.md
- hackcmu-intel/execution/OVERNIGHT.md
- hackcmu-intel/execution/DEMO.md
Read event/SPONSORS.md before choosing a sponsor integration. Load the source
archive and transit case only when they answer a relevant question.

This intelligence does not select our idea, stack, contracts, or main track.
Do not inherit the old bus project, its fixed choices, or its GitHub issue queue.
New human instructions govern the product; current organizer instructions govern
event rules. Identify consequential contradictions and continue unaffected work.

Check the actual clock. The event submission is September 12, 2026, 4 p.m. EDT
(20:00 UTC). The original coding-to-submission window was 19 hours, not a fresh
24-hour budget. Plan backward from my morning handoff and leave time for human
review, rehearsal, and submission. If a required input or valid deadline is
missing, ask once early while doing independent preparation; do not invent an
idea or silently reuse an expired deadline.

Create or update one concise canonical product brief using the repo's existing
structure. Record user/action, competitor gap, technical centerpiece, main track,
three must-haves at most, cuts, hardest dependency, contracts, and proof. Inspect
existing code and shared work before changing it. Coordinate tasks in this repo's
chosen system; do not create a second tracker or prescribe permanent human roles.

Use a small panel if subagents are available: bounded independent strategy and
feasibility reviews, one coordinator who resolves decisions, and implementers
assigned disjoint paths after agreeing a canonical contract. Every worker must
read AGENT_BRIEF and the current product brief, task, contract, and dependencies.
Pass explicit paths and evidence; do not assume workers inherit this conversation.
Limit the initial review round, resolve material objections, and begin building.
If subagents are unavailable, perform the review functions sequentially and proceed.

Verify the hardest external/model/device dependency with an actual small experiment.
Check current competitors before calling our central mechanism new. Preserve one
useful technical contribution when cutting scope. Prefer a narrow complete flow
over disconnected components. A live API, database, or LLM is required only when
the product or a selected sponsor entry needs it.

Use meaningful synthetic inputs where appropriate, with clear source modes.
Make the claimed contribution compute or coordinate a real result. Do not label
authored future values as predictions, simulations as field validation, an LLM
explanation as proof, or a stub as working functionality. Test the core against an
appropriate baseline or changed input, including relevant failure and recovery.

Keep one active writer per file. Isolate concurrent edits with worktrees/checkouts
where available. Serialize shared contracts, dependencies, entry points, migrations,
and integration. Preserve existing human edits. Integrate small verified increments.
After two failed approaches or ten minutes stuck, record evidence and the smallest
useful request, then continue independent work or an explicitly disclosed fallback.

Complete routine reversible work without repeated confirmation. Respect actual
approval requirements and existing budgets; do not bypass controls. Prepare any
permission-dependent external action so it is reviewable, and continue local work
while it is unresolved. Keep secrets out of Git, logs, prompts, and handoffs.

Before the morning deadline, personally verify the integrated candidate. Provide
one concise handoff with exact startup/reset commands and revision, demonstrated
behavior, observed checks, limitations, a three-minute demo sequence, track rationale,
and next submission actions. Distinguish completed, simulated, blocked, and untested
work. Do not claim a deployment, prediction, benchmark, sponsor use, or submission
that was not actually verified. Preserve the strongest working candidate at freeze.
```

To make later agents read the same context, incorporate [the onboarding snippet](AGENTS_SNIPPET.md) into the receiving repo's instruction entry point and pass it explicitly to spawned workers. Copying a folder alone does not load it into an already-running agent's context.
