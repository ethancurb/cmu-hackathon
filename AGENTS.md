# Every agent starts here

Help four humans win a HackCMU track with a distinctive, working project. Strategy and execution are both your job. Keep changes small. Main protection, mandatory PRs, custom task tooling, and process-only CI are not required.

## Required onboarding — once per session or after losing context

1. Read [STRATEGY](docs/STRATEGY.md), [PROJECT](docs/PROJECT.md), [ARCHITECTURE](docs/ARCHITECTURE.md), and your assigned [team handoff](team/). Load full research only when relevant.
2. Check `git status --short --branch`. Refresh from the latest published team revision when available; inspect before merging. Never overwrite another writer's work.
3. State in at most five lines: track/win thesis; outcome/owned paths; contract/dependencies; verification; next action. Identify unknowns. Proceed with assigned work without waiting for approval of this summary.

For idea selection, track changes, or disputed assumptions, consult [RESEARCH](docs/RESEARCH.md) and its sources. Current official instructions govern event rules; `PROJECT` records team decisions. History and generic advice never become current rules. Resolve consequential contradictions; continue unaffected work.

## Make every task serve the competition

- Tie each task to a criterion, differentiator, submission requirement, or demo reliability, with observable proof.
- Improve the selected idea within your assignment. A scope/track change needs benefit, evidence, total cost, and what it replaces; the lead resolves shared decisions.
- Build the smallest implementation proving the claim. Use the chosen stack; cut speculative features, services, dependencies, refactors, and repeated documentation.
- Test unproven dependencies first. After ten blocked minutes or two failed approaches, report evidence and the smallest request; continue independent work.

## Work independently within clear boundaries

- `PROJECT` assigns owners/write areas. Use separate checkouts/worktrees; one active writer per file. Pause AI before manual edits. Isolate ports/data where needed.
- Own your slice, verification, and handoff. Decide routine implementation autonomously; coordinate shared interfaces/files, ownership changes, and product/track decisions.
- Read actual producers/consumers and canonical contracts. Reuse fields, types, examples, and errors; never invent an interface. Live and fixture paths share the contract.
- The lead coordinates dependencies/lockfiles, migrations, entry points, environment names, deployment, and shared instructions. Request one small shared change instead of racing other agents to patch it.
- Edit only your own `team/<role>.md`; keep it under 120 words: task, revision, result, blocker, next step. Update at start, blockage, or handoff. Read others' handoffs when dependent. Unpublished files are not shared truth or locks; relay urgent changes through your human owner.

## Finish working increments

- Integrate small verified changes frequently. The lead serializes integration/deployment; PRs are optional. Use actual commands from `ARCHITECTURE`.
- Verify affected behavior and component boundaries; preserve meaningful checks. Report exact command/result/revision and untested areas. Stubs, empty suites, and fabricated outputs do not prove a working product.
- If main breaks, one named person fixes or reverts it. Others keep changes isolated.
- Validate external/model outputs and relevant loading/empty/slow/failure states. Keep secrets out of Git/logs/prompts. Verify unfamiliar APIs against installed code or primary documentation.
- Handoff: outcome → evidence → risk/next step. After the agreed feature freeze, prioritize correctness, proof, clarity, and submission. Rehearse using [DEMO](docs/DEMO.md).

Keep shared state current and communicate collisions quickly. These instructions do not enforce file locks.
