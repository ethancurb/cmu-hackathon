# Onboarding text for the receiving repository

Incorporate the following into the new repository's root `AGENTS.md` or equivalent agent instructions. Preserve and reconcile existing instructions; do not overwrite unrelated project rules. Paths assume the intelligence folder is named `hackcmu-intel` at the root.

```markdown
## HackCMU strategy and execution context

Every agent reads `hackcmu-intel/AGENT_BRIEF.md` once on entry and after context loss,
then reads this repository's current product brief, canonical contracts, assigned
task, and relevant handoffs. The coordinator also reads
`hackcmu-intel/strategy/PLAYBOOK.md`, `hackcmu-intel/strategy/LESSONS.md`, and
`hackcmu-intel/execution/OVERNIGHT.md`. Consult `event/FACTS.md` for rules,
`event/SPONSORS.md` before a sponsor decision, and `execution/DEMO.md` for delivery,
all under `hackcmu-intel/`.

The pack contains event evidence and recommendations, not this project's selected
idea, stack, main track, interfaces, or task queue. Follow current human instructions
and this receiving repository's active project rules; current organizer rules govern
event requirements. This pack is advisory context. Do not inherit the prior transit
project's contracts or branch-specific decisions.

Tie work to a useful outcome, competition criterion, or demo reliability. Keep at
most three must-have outcomes. Test uncertain dependencies early, reuse the canonical
contract, and preserve meaningful verification. Separate live observations, model
outputs, synthetic inputs, and unsupported assumptions. A panel decision or passing
build alone does not prove the application works.

Use the selected task system and people-chosen work. One active writer per file;
coordinate shared interfaces, dependencies, integration, and deployment. Each agent
states outcome, paths, dependencies, verification, and next action, then proceeds
within authorization. Keep handoffs concise and record exact observed results.

At launch, check the actual clock and morning handoff deadline. This pack's event
deadline is September 12, 2026, 4 p.m. EDT; do not reuse it blindly for another event.
```

If other coding tools are used, point their project instructions to the same canonical entry point using that tool's supported mechanism. Verify the tool reads it, or include the explicit read instruction in its task prompt. Existing sessions need to reload changed instructions; there is no cross-tool enforcement hook in this pack.

For a spawned implementer, include the owned paths, intended result, actual producer/consumer contract, dependencies, verification command, and integration target. For a reviewer, specify read-only scope, the evidence question, and a short output limit. Neither should receive only a vague feature name.
