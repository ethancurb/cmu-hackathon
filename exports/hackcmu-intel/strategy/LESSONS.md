# What the replacement team should learn from this project

This captures the source conversation through September 12, 2026 and the repository evidence available at export. The humans were reconsidering the bus concept; no contest result established that it had lost or could not win. Other teammates had active implementation tickets and published design work. The export is not an audit of all their private or unmerged code.

## Preserve the user's priorities

The user wanted four humans and their coding agents to work quickly toward a competitive final product. They repeatedly rejected overengineering, unnecessary approval loops, permanent person-to-component assignments, and spending the clock rebuilding existing functionality. They wanted every agent to understand both strategy and execution, with a short human overview and deeper reference material available on demand.

The team ultimately selected GitHub Issues for current tasks and personal ledgers for published work. The old `ethan`, `alex`, `bigmike`, and `nate` ledger names were human identities, not component assignments. Carry the lightweight coordination principle into the receiving repo; use its tracker and actual human roster. The replacement idea, track, stack, and permission boundaries come from the new prompt.

## Specific lessons and corrective actions

| What happened / risk exposed | What the new agents should do |
| --- | --- |
| The bus feature was initially framed as adding fullness to an existing Google journey. Later primary sources showed existing crowding and boarding-stop prediction features. | Research close substitutes before describing the central feature as distinctive. Compare the mechanism and result, including less familiar local tools. |
| The core was narrowed toward a capacity display, reducing work but also weakening the technical story. | Cut supporting scope while preserving a substantive centerpiece. Small and reliable is necessary; it is not sufficient evidence of originality. |
| A generic BusTime guide documented passenger load, but live PRT occupancy was not established. | Separate a schema's capability from a provider's deployed population of that field. Test the actual dependency before planning around it. |
| One public vehicle feed returned no occupancy. Other official pages described capacity services and raw data access; a different public feed later supplied live arrivals. | Bound negative conclusions to the endpoint/sample. Search for alternative official access paths before declaring an entire capability absent. |
| Phone tracking was considered as a source of total passenger count. | Separate a participation signal from a population measurement. State the coverage assumptions and validate them before using an estimate as a count. |
| Route labels, physical vehicles, trips, capacity metadata, current load, and arrival forecasts were initially easy to conflate. | Define domain facts and identifier lifetimes before dividing components. A human-friendly label is often not a unique key. |
| An existing consumer Google Maps journey was treated as if it could simply be imported into our app. | Verify the actual product/API boundary. An API integration has different access, fields, identity, and costs from a familiar consumer screen. |
| The routing base layer began competing with the differentiated feature for implementation time. | Use a narrow fixture or provider adapter for commodity context when it preserves the demo's claim. Do not build a general planner just to demonstrate another mechanism. |
| A backend request or database could be mistaken for proof of functionality. | Make an input change shared state, trigger computation, or produce a verified useful result. Network activity and storage alone do not establish depth. |
| A scripted world can make a replan happen on cue. | Distinguish authored inputs, computed outputs, and predictions. A computation over known future events is not evidence of forecasting them. |
| Adding an LLM explainer was considered a differentiator. | State the model's actual job. An explanation can improve usability, but it does not validate the planner or automatically establish technical novelty. |
| More agents, documentation, or panels can create the appearance of progress while interfaces diverge. | Timebox reviews, appoint one integration authority for the run, assign bounded writes, and require a shared working path early. |
| Branches contained different versions of the plan while teammates continued building. | Read published branch decisions and current tasks; distinguish a branch proposal from integrated main. Do not overwrite work or represent stale main as the whole team's state. |
| Impressive claims about scale, indexes, cloud tiers, and future source swaps appeared in architectural reasoning. | Verify exact tier support and query behavior. Recompute arithmetic. An adapter does not solve missing data, schema semantics, freshness, or evaluation. |

## How the strategic concern evolved

1. **User problem:** full buses can pass waiting riders. The initial desired contribution was capacity on the specific bus, then potential capacity when it reached a stop. This was a user-reported need, not a measured frequency or time-savings claim.
2. **Boundary correction:** the user explicitly did not want to rebuild Google routing, walking instructions, or destination planning. They also removed fixed human task assignments.
3. **Data reality:** the guide's categorical field was promising but unverified; API approval was an unacceptable blocking dependency during the hackathon. Public feeds offered another path for vehicle identity and eventually arrival updates.
4. **Prototype choice:** the user was willing to hard-code routes and simulate capacity. The event materials did not establish a mandatory live external API or database. A real capacity/reporting or decision loop was a strategic recommendation, not an event rule.
5. **Competitor correction:** TrueTime, Room2Ride, and Transit undermined an assumption that a fullness display itself was new. Transit documentation also described stop-level crowding forecasts. Current local coverage still had gaps in our verification.
6. **Potential deeper mechanisms:** deadline-aware recommendations, alternate boarding stops, reported pass-up recovery, coordinated riders, surge simulations, confidence handling, transfer recovery, and a door-counter prototype were brainstormed. They were not automatically accepted scope or demonstrated global firsts.
7. **Replacement request:** the user chose to prepare a separate project's agent environment using this intelligence. This pack preserves lessons and evidence without choosing that project's idea or freezing the other team's work.

Details and timestamped observations are in [TRANSIT_CASE](../reference/TRANSIT_CASE.md). Do not treat this narrative as an implementation status board.

## Keep the distinctions visible

| Distinction | General lesson |
| --- | --- |
| Identifier vs measurement | Having a record key does not mean the underlying property is known. |
| Category vs quantity | Preserve units and semantics; an approximate label is not a precise number. |
| Current vs future | Define the event and prediction horizon; do not relabel a current observation as a forecast. |
| Feed freshness vs measurement freshness | Updating a record does not prove every field was measured then. |
| Historical aggregate vs present state | A two-week average does not tell you what is happening now. |
| Missing vs zero | Unknown is a useful state; silently filling it can reverse the user's decision. |
| Model output vs validated result | Fluency and a confidence number are not evidence of accuracy. |
| Synthetic evaluation vs field validation | A simulator proves behavior within its world and assumptions. |
| API access vs application integration | A request can succeed while the identity join, UI, and useful outcome remain unimplemented. |
| Published branch vs shared main | Work can exist and be valuable before integration; readers must know which revision they saw. |

## What should not transfer as a default

- The bus idea, its Traveling track recommendation, LoadLine naming, pilot routes, or transport-specific endpoints/types.
- The old Next.js/TypeScript suggestion, optional Postgres plan, or later MongoDB/commute-agent branch decisions. They were choices for that product; no stack is mandated by this pack.
- Exact stale-threshold, polling, or provider-quota numbers as generic architecture defaults.
- Old GitHub issues, branch names, personal task assignments, incomplete TODOs, or another person's ledger claims as the new queue.
- The old proposal that Google integration must be a first milestone. That was team planning, not organizer policy.
- Unimplemented feature expansions as requirements, guarantees about winning, assumptions of production accuracy, or a claim that the old project never had working code anywhere.

## Use these lessons without creating another process problem

The receiving lead should summarize the new thesis and hardest assumption, run the smallest decisive experiment, and move into implementation. The case study is reference material, not mandatory transit homework for every worker. Read the [brief](../AGENT_BRIEF.md), the receiving project's own contract, and the task-specific evidence; pull the rest only when it changes a decision.

If a concern has a bounded fix, fix it. If a premise fails, propose a smaller promise with evidence and full cost. Do not cycle through panels until everyone says the idea is excellent. Agreement is not proof; a tested result is useful evidence.
