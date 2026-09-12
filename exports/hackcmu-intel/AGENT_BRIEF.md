# Read before working on the replacement project

This is shared intelligence, not the replacement project's specification. Read once on entry and after context loss. Then read the receiving repo's current product decisions, canonical contracts, assigned task, and relevant handoffs. The lead also reads [PLAYBOOK](strategy/PLAYBOOK.md), [LESSONS](strategy/LESSONS.md), and [OVERNIGHT](execution/OVERNIGHT.md).

## Objective and clock

Help a four-person team deliver a distinctive, working HackCMU 2026 project that can compete for one main track. Winning is the user's priority; generated code volume and architectural sophistication are not success criteria.

The event's submission deadline is **2026-09-12 16:00 America/New_York (EDT), 20:00 UTC**. Hacking was scheduled to begin at 9 p.m. Friday, giving 19 hours before submission. At launch, read the actual clock and the human's morning handoff deadline. Never start a fresh fictional 24-hour plan. If this pack is reused after the event, refresh the event facts before applying any date or rule.

## What the event actually evaluates

The supplied opening deck gives **three minutes for presentation plus demo**. Its rubric is originality, technical difficulty, demo quality, usefulness, and track relevance. The main themes are Optimization, Traveling, Multiplayer, and Food; choose one. AI and any programming language are permitted; applications must be built from scratch. See [FACTS](event/FACTS.md) for source pages and unresolved organizer details.

Make one hard, useful mechanism visible through a repeatable interaction. Define a baseline and an observable improvement where a comparison makes sense. A model brand, a database query, a network request, or an animation alone does not establish competitive technical depth. These are strategy judgments, not extra event rules.

We found no explicit general requirement for live third-party data, a production backend, or a particular stack. Sponsor entries can require meaningful use of their technology. Fixtures can support a demo; they must not be represented as live measurements or empirical validation.

## Decisions that carry forward

These are user preferences from the source conversation, subject to newer instructions in the receiving project:

- Speed, reliability, strategic differentiation, and a working final product matter more than feature count. Keep the repo and coordination process lean.
- Four humans may mix AI and manual coding, with only two or three trusted CS engineers available. People choose their own tasks; no permanent `lead/build-a/build-b/demo` human assignments.
- No mandatory main protection, PR process, custom ticket service, or process-only CI. Use the receiving repo's chosen task system. The previous team adopted GitHub Issues for current work and personal ledgers for published history; do not reuse its issue queue.
- Make routine implementation choices independently within agreed scope. Do not repeatedly ask for confirmation already given. Raise consequential product changes and actual blockers while continuing unaffected work.
- Each agent owns an outcome, explicit file boundaries, integration, verification, and a concise handoff. More simultaneous writers create collisions unless their work is isolated.

## Working rules

1. Check Git status and published changes before integrating; preserve others' edits. Use separate worktrees/checkouts when agents independently edit code. One active writer per file; stop AI before a human edits that file.
2. State briefly: target outcome/criterion, owned paths, interface/dependencies, verification, next action and unknowns. Proceed within authorization.
3. Test the hardest dependency before implementing consumers. A sample schema is not proof that a deployed API supplies the needed field. Bound requests and failed approaches.
4. Establish one canonical contract and one meaningful fixture. Match identifiers, units, time semantics, errors, and missing values across producers and consumers. Coordinate changes to shared entry points, schemas, dependencies, lockfiles, and deployment.
5. Use at most three must-have outcomes. An expansion needs evidence, full build/integration/demo cost, and what it replaces. The coordinator resolves shared choices; reviewers do not independently pivot the product.
6. Verify actual behavior across the component boundary. Preserve meaningful tests; do not create empty suites or test a stub as though it proves the product. Exercise the relevant slow, empty, failure, and recovery paths.
7. Record exact commands/results, source mode, revision, and remaining limits. Distinguish observed behavior from a plan, static fixture, model prediction, cached response, or recorded video. Keep credentials out of Git, logs, and prompts.
8. Integrate small increments, serialize shared merges/deployment, and leave a reproducible startup/reset path. When a check fails, identify one repair owner. Avoid competing fixes.

## Lessons that must not be lost

The earlier bus idea encountered a differentiation problem: existing services already described the proposed crowding feature. The useful response is an early competitor test of the mechanism, not adding more technologies to a weak premise.

Our initial public-feed samples lacked occupancy, but another public endpoint later supplied real arrivals and official pages described other capacity sources. **One failed path does not prove no path exists; one successful request does not prove the whole product works.** [Case evidence](reference/TRANSIT_CASE.md).

A common interface cannot create information missing from a provider. A simulation can prove a working algorithm under declared conditions; it cannot establish real-world accuracy. An LLM explaining a deterministic calculation does not make that calculation novel or validate it.

## Completion means evidence

At the morning handoff, provide a runnable candidate, exact startup and reset commands, a demonstrated core flow, check results, known gaps, a three-minute demo outline, and the next delivery actions. A panel consensus, a large diff, a green build, or a screenshot is insufficient by itself.

Use [the demo checklist](execution/DEMO.md) and [source index](sources/README.md). Current organizer instructions govern event rules; newer human instructions govern the product. Archived bus recommendations and historical winners never become current requirements.
