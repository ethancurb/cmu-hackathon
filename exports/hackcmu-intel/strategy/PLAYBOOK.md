# Strategy for a competitive working project

This is a decision framework, not a formula for guaranteed victory. Official criteria are in [FACTS](../event/FACTS.md); supporting research and historical examples are in [prior research](../sources/prior-research.md). The human supplies the replacement idea. Improve that idea before proposing a different product.

## Establish the competition thesis

Write a short product brief with:

- One user in one specific situation.
- The useful action they can complete by the demo.
- The current workaround and its concrete limitation.
- The mechanism this team will build that changes the result.
- One main track and a concise explanation of fit.
- At most three must-have outcomes, explicit cuts, and the hardest unknown.
- A visible proof for each claimed advantage.

The thesis should survive removal of framework names, model brands, and sponsor logos. If it becomes "show existing data in a nicer interface," either establish a substantial interaction improvement or reconsider the mechanism. A design improvement can be valuable, but do not describe it as a new predictive algorithm.

Treat the weakest major criterion as a bottleneck. A useful but familiar concept needs differentiation; a novel but unreliable prototype needs proof; an impressive backend hidden behind a confusing flow needs a better demonstration. Adding features is rarely the direct repair.

## Compare with what already exists

Before a large implementation, timebox a focused competitor check, initially about 10-15 minutes if the remaining clock permits. Review the incumbent and two close alternatives using current primary product documentation or the product itself.

Compare the **mechanism and user result**, not just the screen or category. Record what each already does, what you tested, what remains unknown, and the one improvement you can demonstrate. Do not equate "our team has not seen it" with novelty. Do not claim a local service is absent from one incomplete feed.

A useful comparison can show fewer steps, better decisions under stated constraints, a new interaction, a new way to acquire information, or a meaningful outcome previously unavailable to the target user. The advantage must be specific enough for a judge to inspect. Avoid claiming global novelty without research supporting it.

If the central feature already exists, compare the supplied idea with at most two narrower variants. Choose once using evidence and remaining cost. Reopen the choice only when a consequential assumption fails or a materially cheaper path preserves the goal.

## Convert the rubric into proof

| Criterion | Evidence to build into the product |
| --- | --- |
| Originality | A recognizable difference from the current workaround, visible in the interaction or result. |
| Technical difficulty | One substantive challenge solved by your code or integration, demonstrated with a changed input or condition. |
| Demo quality | A readable, repeatable sequence with an immediate result and a rehearsed reset, inside three minutes. |
| Usefulness | A completed action for a specific user, with a credible comparison or clearly bounded benefit. |
| Track relevance | A theme that is essential to the core action and clear in the submission explanation. |

These proof suggestions are our strategy. The event supplies no numeric weights. Do not invent a weighted score and present it as the judges' rubric, estimate victory probabilities from entrant counts, or interpret a sponsor's logo as an extra criterion.

## Select a technical centerpiece

Useful sources of depth include constrained optimization, uncertainty-aware decisions, meaningful shared state, synchronization, perception tied to a real action, data acquisition with validation, or an interaction that makes a difficult task possible. They are candidates, not requirements to add every category.

Choose a mechanism that fits the available inputs, skill, equipment, and clock. A small deterministic algorithm can be appropriate. Its substance comes from the problem it solves and evidence of its result. An LLM can be central when its contribution is necessary and visible; narration attached to another system does not establish a new decision mechanism.

Ask what happens if the centerpiece is removed. If the user outcome barely changes, it is probably not the centerpiece. Avoid auth, queues, microservices, native apps, hardware, multi-model orchestration, or databases unless their absence prevents a required behavior.

## Probe before promising

Define one cheap experiment for the riskiest dependency. State the required output, scope, acceptable latency, and failure behavior before running it. An initial 20-30 minute timebox is a planning default, not permission to spend that long on every lookup.

Inspect a real response or device observation and its semantics. Check access approval, exact identifiers, units, freshness, missing fields, and whether the runtime can reach it. Test account/tier capabilities where the design depends on them. A vendor example and an installed SDK do not prove usable data.

After two failed approaches or ten minutes stuck on the same blocker, record the evidence and the smallest useful request. Continue independent work. If the blocked input is essential, reduce the promise or use a disclosed experimental input; do not silently replace it and keep the original claim.

## Fixtures and real functionality

The reviewed general event materials do not require every input to be live. Use fixtures to make commodity context and difficult-to-reproduce situations controllable. Separate these four facts:

| Artifact / behavior | What it establishes |
| --- | --- |
| Static screenshot or authored output | Visual design or an intended result |
| Working code operating on synthetic inputs | Implemented behavior for those inputs |
| Working integration using a real service | That service path and observed behavior at the time of the check |
| Evaluation against appropriate unseen or observed outcomes | Evidence for the specific measured performance claim, within the evaluation's limits |

A request that always returns a canned answer adds little technical evidence. A database full of seed data can still support a real application if updates, queries, coordination, or computation work. Choose the smallest backend needed for the behavior, including shared state when the claim involves multiple clients.

For a simulator or predictor, keep decision-time inputs separate from future truth. A planner reading authored future occupancy is using scenario knowledge; it has not predicted that occupancy. Evaluate a policy using only information it is supposed to have. Give competing policies the same conditions, include scenarios where the simple baseline succeeds, and record sensitivity to assumptions. Synthetic evaluation does not establish performance on Pittsburgh streets or any other real population.

For model outputs, validate the structure and relevant constraints, handle bad or slow responses, and attach explanations to actual inputs/results. Do not display invented sources, precise confidence, causal claims, or measurements unsupported by the experiment.

## Proof before expansion

Build a rough complete input-to-result path early. Then run a small evaluation appropriate to the claim: comparison with a simple baseline, a two-client interaction, observed device behavior, or a user completing the task without coaching. Include a relevant non-happy path and a repeatable reset.

Record test conditions and failures as carefully as successes. A baseline chosen to fail, future information leaked into the algorithm, or a handpicked successful scene can exaggerate capability. Rehearsed scenarios are useful for presentation; wider claims require wider evidence.

For each proposed addition, record benefit, proof, total cost, dependencies, risk, and the work it replaces. If it does not improve a criterion or delivery reliability, cut it. One core mechanism plus one supporting interaction usually gives a clearer story than a menu of unrelated features.

## Main track and sponsor strategy

Choose the strongest natural main-track fit after the mechanism is clear. Optimization needs a defined objective and defensible comparison; Multiplayer needs essential multi-person behavior; Traveling and Food need concrete outcomes in those domains. These are strategic interpretations of broad themes.

A less populated track does not automatically offer better odds: prize depth and competitor strength vary. Sponsor integrations should strengthen this same project and have a verified access/proof path. Use [SPONSORS](../event/SPONSORS.md); do not spend the final hours collecting logos.

## Historical lessons, with limits

The [research archive](../sources/prior-research.md#historical-projects) distinguishes organizer-confirmed awards from teams' own claims. Examples include Medicly's visible movement-feedback story, GEOVID's campus crowd visualization, and MAGC Map's collaborative interaction. Read their sources before borrowing details.

The surviving sample is small and biased. It does not show what caused a win, validate medical or operational performance, or establish a preference for a particular model or stack. The transferable pattern is an identifiable user action and an inspectable technical result.

## Finish toward the actual clock

Use the human's morning deadline as the first delivery target and the event submission as the hard outer boundary. Protect time for another person's cold run, final fixes, rehearsal, form completion, and a receipt. The old suggested 10 a.m. freeze / 1 p.m. rehearsal / 3:30 p.m. submission targets are useful defaults only if they fit the current schedule.

A written promise, an agent's completion message, a successful build, and an accessible page each prove different things. Require the actual end-to-end behavior and use the [morning and demo checklist](../execution/DEMO.md) to hand off what exists.
