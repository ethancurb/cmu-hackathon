# HackCMU intelligence handoff

**Copy this entire `hackcmu-intel` folder into the new repository.** It is a portable briefing for a replacement project, assembled September 12, 2026. It carries event evidence, competition strategy, execution lessons, and an overnight agent workflow. The replacement idea, stack, and selected track are deliberately not chosen here.

## The two-minute human briefing

- Build one distinctive, useful interaction with a real technical mechanism that judges can understand in **three minutes total**.
- **Submission: September 12, 2026, 4 p.m. EDT / 20:00 UTC.** The scheduled hacking start was Friday 9 p.m.; that was 19 hours before submission. A restart does not reset the clock.
- Main tracks: **Optimization, Traveling, Multiplayer, Food**. Choose one. IFM is listed separately as optional; its requirements remain unresolved.
- Judges consider originality, technical difficulty, demo quality, usefulness, and track relevance. We found no published weights or requirement to use live Google data, a specific database, or an external API.
- Test the new idea's hardest dependency and compare its core mechanism with existing products before generating a large codebase. A polished wrapper around an existing capability was the previous project's strategic concern.
- Use synthetic inputs where appropriate, but make the claimed contribution execute. A changing input should produce a computed, inspectable result. Simulation demonstrates behavior under its assumptions; it does not establish field accuracy.
- One coordinator integrates. Reviewers challenge evidence; implementers own bounded files. Limit the panel's deliberation, keep at most three must-have outcomes, and reserve time for a working resettable demo.

Sources and qualifications: [event facts](event/FACTS.md), [strategy](strategy/PLAYBOOK.md), [lessons](strategy/LESSONS.md).

## Put it to work

1. Copy this folder to `<new-repo>/hackcmu-intel/` with its subfolders intact.
2. Open [the launch prompt](prompts/BOOTSTRAP.md), supply your new idea and an explicit morning deadline, and give the prompt to the new lead agent. Stack and track may remain open for that agent to evaluate.
3. Have the lead incorporate [the onboarding snippet](prompts/AGENTS_SNIPPET.md) into the new repo's own agent instructions. It should preserve existing instructions and give every worker the reading path explicitly.

The pack contains instructions and reference material. It does not start an agent runner, provision accounts, keep a sleeping computer awake, or implement the new product. The [overnight workflow](execution/OVERNIGHT.md) covers those launch dependencies and the required morning evidence.

## Reading map

| Reader / decision | Read |
| --- | --- |
| Every agent, before working | [AGENT_BRIEF](AGENT_BRIEF.md), then the new repo's own product brief, contracts, current task, and relevant handoffs |
| Coordinator / overnight lead | [PLAYBOOK](strategy/PLAYBOOK.md), [LESSONS](strategy/LESSONS.md), [OVERNIGHT](execution/OVERNIGHT.md) |
| Event or track decision | [FACTS](event/FACTS.md) |
| Sponsor integration | [SPONSORS](event/SPONSORS.md) |
| Demo / delivery | [DEMO](execution/DEMO.md) |
| Prior evidence or a disputed claim | [source index](sources/README.md), [full prior research](sources/prior-research.md) |
| Reusing any transit work | [TRANSIT_CASE](reference/TRANSIT_CASE.md) |

The included opening PDF is the original supplied document, with a text extraction for agents. Other reference files use relative links. No old application contract, database choice, branch, issue queue, fixed human role, or Traveling-track mandate is installed by copying the folder.

`MANIFEST.sha256` records the packaged files. From inside this folder, `shasum -a 256 -c MANIFEST.sha256` verifies the snapshot. Regenerate the manifest if you intentionally edit it.
