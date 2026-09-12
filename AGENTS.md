# Every agent starts here

Help four humans win a HackCMU track with a distinctive, working project. Strategy and execution are both your job. Keep changes small. Main protection, mandatory PRs, custom task tooling, and process-only CI are not required.

## Required onboarding

1. Check `git status --short --branch` and fetch the latest published revision when available. Inspect before integrating; never overwrite another writer's work. After a pull, merge, or branch switch, reread any changed agent instructions before editing.
2. Read [STRATEGY](docs/STRATEGY.md), [PROJECT](docs/PROJECT.md), and [ARCHITECTURE](docs/ARCHITECTURE.md) once per session or after losing context. Read open GitHub Issues, your current issue, your human's ledger, and recent entries relevant to your dependencies in the other [ledgers](ledgers/). Load detailed research only when relevant.
3. State in at most five lines: track/win thesis; task and changed paths; contract/dependencies; verification; next action. Identify unknowns and proceed with authorized work.

## Product boundary

- **Current capacity on the specific bus comes first.** Reuse the existing Google routing/ETA workflow; build the capacity addition described in `PROJECT`.
- Phone location can help match a rider to a bus. Participating phones are not a passenger census. A vehicle ID, rated capacity, current occupancy, and forecast occupancy are distinct facts.
- Keep current observations separate from forecasts for arrival at the rider's stop. Never invent counts, infer a percentage from a category, or display missing data as available space.
- Tie each task to a criterion, visible product outcome, or delivery reliability. Cut speculative features, services, dependencies, and generic refactors. Test uncertain data access before building around it.
- Scope or architecture changes need evidence, full cost, and what they replace. Record agreed product decisions in `PROJECT` and interfaces in `ARCHITECTURE`; no independent product pivots.

## Tasks and collaboration

- [GitHub Issues](https://github.com/ethancurb/cmu-hackathon/issues) is the single source for current tasks, chosen owners, blockers, and completion status. People choose their own work; there are no permanent roles or people-to-component assignments. Personal ledgers record published history, not current task reservations.
- Before non-trivial implementation, run `gh issue list --state open --limit 100` and inspect relevant issues with `gh issue view <number> --comments`. Create or update a short issue spec: criterion/outcome, changed paths, contracts/dependencies, and verification. Record the human who chose the task as its assignee; do not mistake a shared CLI login for that human.
- Publish the intended scope and claim before editing, then recheck for overlaps. Resolve competing claims, shared paths, and contract changes with the affected people. An issue assignment is not a file lock. If GitHub access fails, report the failure and coordinate the same scope through your human before overlapping work begins; reconcile the issue when access returns.
- Keep one shippable increment per ticket; split work larger than a few hours. Small in-scope refinements stay in the existing task. Changes to shared files, contracts, or entry points must be recorded and coordinated even when small.
- Reference the issue number in commits and handoffs. Agents may create, update, and close their own task issues using `gh issue create`, `gh issue edit`, `gh issue comment`, and `gh issue close`; use `--body-file` for multiline specs/comments. Close work only after integration into main with the change link and observed verification result. Do not reassign another human's work without their agreement.
- Use separate checkouts/worktrees and one active writer per file. Pause AI before manual edits; isolate ports/data where needed.
- Reuse canonical types, examples, errors, and fixtures. Coordinate shared contracts, dependencies/lockfiles, migrations, entry points, environment names, and deployment through the affected tickets before simultaneous edits diverge.
- Update the issue when scope changes, a blocker appears, or work is handed off or completed. After ten blocked minutes or two failed approaches, report the smallest useful request and continue independent work.

## Personal ledgers — update with the work you push

- Use your human's file: [Ethan](ledgers/ethan-ledger.md), [Alex](ledgers/alex-ledger.md), [BigMike](ledgers/bigmike-ledger.md), or [Nate](ledgers/nate-ledger.md). Establish that identity from the task/session; if unknown, ask before writing a ledger. After initial setup, edit only your human's ledger. Agents sharing one human must serialize their writes.
- Before pushing new work, append one brief entry to your ledger and commit it with the corresponding changes: **UTC timestamp → issue link → changes → exact verification/result → remaining risks or handoff**. Include partial work honestly; a branch push does not mean integration or completion. Retrying the same push needs no duplicate entry.
- Keep entries about five lines, oldest to newest. Record observed facts, not intended work or copied issue status. Do not backfill claims for another person. Git history supplies the revision; do not try to embed a commit's own hash inside itself. Preserve entries when integrating another person's work.
- After the push succeeds, report the actual revision and branch in the issue; close it only when the task is integrated and verified. Failed pushes remain unpublished. Onboarding reads the latest published history; unpublished ledger edits cannot coordinate the team.
- These are agent instructions, not an installed Git hook. Before finishing, verify the ledger entry is included in the published commit. Use Issues for live coordination and the ledgers for durable handoffs; neither enforces locks.

## Finish verified increments

- Integrate small verified changes frequently; coordinate integrations and deployments so they do not race. PRs are optional. Use actual commands from `ARCHITECTURE`.
- Verify affected behavior and boundaries. Report exact command/result/revision and untested areas in the task record. Stubs, empty suites, and fabricated outputs do not prove a working product.
- Coordinate a single repair if main breaks; avoid competing fixes. Validate external outputs and relevant loading/empty/slow/failure states. Keep secrets out of Git/logs/prompts; check unfamiliar APIs against primary documentation.
- After the agreed feature freeze, prioritize correctness, proof, clarity, and submission. Rehearse using [DEMO](docs/DEMO.md).

For strategy disputes, consult [RESEARCH](docs/RESEARCH.md). Current official instructions govern event rules; historical winners and generic advice never override them. These instructions communicate coordination expectations and do not enforce locks.
