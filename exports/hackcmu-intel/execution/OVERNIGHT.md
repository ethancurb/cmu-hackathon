# Run one coherent overnight build

This is an execution pattern for the receiving agent environment. It does not install or launch a runner. Use the actual available models, tools, permissions, and concurrency. If subagents are unavailable, perform the bounded review passes sequentially and continue; do not pretend a panel ran.

The user wants a working project at wake-up. Optimize for one integrated result. Use a panel to improve decisions and catch failures, not as a substitute for writing and verifying the application.

## Before the human leaves

Establish the replacement idea, target user, explicit morning deadline with timezone, any fixed stack, available credentials/devices, and the intended demo environment. Read the actual clock. If the idea is missing, ask for it once; do not resurrect the bus idea as a default.

Resolve launch-dependent access while the human is present: can the agent edit the receiving repo, run its tools, reach required services, and continue operating while the machine is unattended? Check the runner's actual behavior and keep the machine in a state that permits it to run. A prompt cannot guarantee continued execution through sleep, session closure, lost connectivity, or exhausted usage.

Respect existing authorization and spending limits. Routine reversible work within the supplied task should proceed without repeated approvals. Do not bypass permission controls. Where a deployment, account, payment, organizer message, or external publication needs authorization, prepare the reviewable result and continue local work while it remains unresolved. Do not let an optional service block the core.

Choose the morning handoff target separately from the event's **September 12, 4 p.m. EDT** submission. If the event date or morning target has passed, report that fact and replan against a valid target; do not silently reuse stale dates.

## Panel structure

These are temporary agent functions, not permanent assignments for Ethan, Alex, BigMike, Nate, or any new human team.

| Function | Bounded responsibility | Authority |
| --- | --- | --- |
| Coordinator / integrator | Product thesis, canonical contract, task boundaries, decisions, integration, proof, handoff | Resolves routine tradeoffs within the human's scope; serializes shared changes |
| Strategy / competitor reviewer | Check distinctiveness, track fit, sponsor relevance, and the proposed three-minute proof | Read-only findings; cannot independently pivot the project |
| Feasibility / engineering reviewer | Challenge the hardest dependency, data semantics, runtime, and failure path | Read-only experiments or explicitly assigned scratch work |
| Implementers | Deliver small independent slices against the contract | Write only assigned paths; own tests and integration handoff |
| Demo / skeptical reviewer | Operate the integrated candidate and verify its claims, reset, and limits | Report reproducible issues; do not start a parallel redesign |

One agent can perform several functions at different times. Start with only the reviews that resolve real uncertainty. Use more workers only when the tasks have disjoint write areas and stable interfaces. The implementation stage should not leave all agents reviewing while nobody integrates.

## Finite review protocol

1. Coordinator publishes a short brief: user, action, differentiator, main-track candidate, three must-haves, cuts, hardest assumption, and proof.
2. Reviewers independently return at most about 200 words each: strongest evidence, two highest-impact objections, required experiment, and a recommendation to proceed or narrow. Each objection needs an observable consequence.
3. Coordinator chooses one plan, records why, and starts the decisive experiment. Do not seek unanimous enthusiasm.
4. Run a second review only for a material change or unresolved consequential issue. Once resolved, implement. A failed verification can require further fixes; the deliberation limit is not permission to ignore a real failure.

Prefer a strong model for ambiguous architectural and claim-evaluation decisions when available; use faster models for bounded extraction, implementation, and checking when appropriate. The source user preferred Luna for research speed, but this pack does not require a particular provider or invent a token budget. Use the receiving environment's actual model names and limits.

## Plan from the remaining time

Let `T0` be actual launch time and `H` the human's requested morning handoff. Let `B = H - T0`, bounded by time that must remain before event submission. These are planning defaults to adapt to the task, not official event rules.

| Latest target | Required evidence | If absent |
| --- | --- | --- |
| About 10% of B, normally no more than 20 minutes | Narrow thesis, competitor check, identified input dependency, explicit scope | Cut unclear extras; resolve the most consequential assumption |
| About 25% of B | Dependency sample/device proof and one canonical input/output example | Use a disclosed fallback or reduce the promise; do not build many consumers of an unproven source |
| About 40% of B | Rough complete flow reachable by a second client/person where relevant | Stop expansion and integrate or shrink |
| About 70% of B | Core mechanism, useful result, baseline/check, repeatable reset | Freeze features and repair the missing proof |
| Final 30% of B | Cold run, failure/recovery, demo script, exact startup instructions, durable handoff | Deliver the strongest verified subset and identify gaps explicitly |

For a very short run, combine gates instead of spending the time on ceremony. Check the clock at integration boundaries. Never schedule all testing after the human wakes up. Leave room after wake-up for human judgment, corrections, event submission, and rehearsal.

## Minimum shared state

Use the receiving repo's existing files/tools when they serve these purposes. Do not create duplicate ledgers, a custom tracker, or process-only CI.

- **One product brief:** selected scope, track, cuts, current decisions, and delivery targets.
- **One canonical contract:** executable types/schema when possible, a representative fixture, and agreed error/provenance semantics. Define it before splitting producers and consumers.
- **One current task system:** prefer the team's chosen GitHub Issues workflow when connected. For a new local-only repo with no tracker, the coordinator can temporarily keep one task section in the product brief; reconcile it when the selected tracker exists. It is not a cross-checkout lock.
- **One concise morning handoff:** exact revision/path, startup/reset commands, verified behavior, evidence, gaps, and next actions.
- **Personal publication history where used:** update the actual human's ledger with their pushed work. Multiple agents serving one human serialize ledger edits; do not fabricate contributions for another person.

Reviewers return short findings to the coordinator instead of editing every shared document. The coordinator records material decisions once in the canonical place and links to them from tasks.

## Contract before concurrency

Each implementation assignment states outcome, owned paths, input/output contract, dependencies, exact verification, and integration destination. Give the worker actual producer/consumer context, not a vague feature name.

Keep package manifests/lockfiles, migrations, environment names, entry points, and deployment changes with one active writer. Use isolated worktrees or checkouts for independent code edits; assign noncolliding ports and data. Shared services and databases are not isolated merely because Git worktrees are.

Implement the smallest whole path first. Merge small verified increments, then rerun checks that exercise the integrated boundary. Do not use force pushes or reset others' changes to solve routine divergence. Inspect before merging. Fast-forward-only pulls are useful guards but are not a solution for divergent branches; deliberate merge/rebase decisions must preserve local work.

When something breaks, identify one repair owner. After two failed approaches or ten blocked minutes, record the failure and smallest next request, then continue unaffected work. A subagent's claim of success is a lead for verification, not evidence by itself.

## Meaningful morning acceptance

The coordinator must personally verify the integrated candidate using real tools. Use [DEMO](DEMO.md) for the complete evidence checklist.

At minimum: startup works from documented conditions; one useful input reaches the actual mechanism and visible result; changed input changes the correct result; relevant shared state crosses clients; reset and a likely failure path work; sources/modes are clear; reported checks were observed; the exact current revision and limitations are recorded.

If a feature is unfinished, remove it from the claimed demo scope or label its state clearly. Do not substitute a hard-coded success response and report completion. Deliver partial work honestly when a dependency remains blocked, with the strongest reproducible result and a concrete continuation point.
