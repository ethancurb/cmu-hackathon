# Every agent starts here

Help four humans win a HackCMU track with a distinctive, working project. Strategy and execution are both your job. Keep changes small. Main protection, mandatory PRs, custom task tooling, and process-only CI are not required.

## Required onboarding

1. Read [STRATEGY](docs/STRATEGY.md), [PROJECT](docs/PROJECT.md), and [ARCHITECTURE](docs/ARCHITECTURE.md) once per session or after losing context. Read the current ticket/task brief. Load detailed research only when relevant.
2. Check `git status --short --branch` and the latest published revision when available. Inspect before integrating; never overwrite another writer's work.
3. State in at most five lines: track/win thesis; task and changed paths; contract/dependencies; verification; next action. Identify unknowns and proceed with authorized work.

## Product boundary

- **Current capacity on the specific bus comes first.** Reuse the existing Google routing/ETA workflow; build the capacity addition described in `PROJECT`.
- Phone location can help match a rider to a bus. Participating phones are not a passenger census. A vehicle ID, rated capacity, current occupancy, and forecast occupancy are distinct facts.
- Keep current observations separate from forecasts for arrival at the rider's stop. Never invent counts, infer a percentage from a category, or display missing data as available space.
- Tie each task to a criterion, visible product outcome, or delivery reliability. Cut speculative features, services, dependencies, and generic refactors. Test uncertain data access before building around it.
- Scope or architecture changes need evidence, full cost, and what they replace. Record agreed product decisions in `PROJECT` and interfaces in `ARCHITECTURE`; no independent product pivots.

## Tasks and collaboration

- People choose work through the team's separate ticket system, which is being built by a teammate. This repo defines no standing roles, people-to-path assignments, or per-person handoff files. Do not create a competing task tracker.
- Use the actual ticket system when its link/integration is supplied; do not invent its API. Until available, use your human's current task brief and coordinate collisions directly.
- Use separate checkouts/worktrees and one active writer per file. Pause AI before manual edits; isolate ports/data where needed.
- Reuse canonical types, examples, errors, and fixtures. Coordinate shared contracts, dependencies/lockfiles, migrations, entry points, environment names, and deployment through the affected tickets before simultaneous edits diverge.
- Keep progress, blockers, completion evidence, and task reservations in the ticket system. After ten blocked minutes or two failed approaches, report the smallest useful request and continue independent work.

## Finish verified increments

- Integrate small verified changes frequently; coordinate integrations and deployments so they do not race. PRs are optional. Use actual commands from `ARCHITECTURE`.
- Verify affected behavior and boundaries. Report exact command/result/revision and untested areas in the task record. Stubs, empty suites, and fabricated outputs do not prove a working product.
- Coordinate a single repair if main breaks; avoid competing fixes. Validate external outputs and relevant loading/empty/slow/failure states. Keep secrets out of Git/logs/prompts; check unfamiliar APIs against primary documentation.
- After the agreed feature freeze, prioritize correctness, proof, clarity, and submission. Rehearse using [DEMO](docs/DEMO.md).

For strategy disputes, consult [RESEARCH](docs/RESEARCH.md). Current official instructions govern event rules; historical winners and generic advice never override them. These instructions communicate coordination expectations and do not enforce locks.
