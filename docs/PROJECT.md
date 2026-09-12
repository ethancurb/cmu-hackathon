# Product: predictive Transit Pressure

## Decision 2026-09-12, afternoon (issue #20, chosen by Nate)

**LoadLine answers how to get there, when to leave, and what could make the trip busier — on one map-centered screen.** Building on #19:

- **Real itineraries.** Origin, destination and departure/arrive-by time drive a provider-backed walking + PRT itinerary (Transitous/MOTIS public API, key-free, verified for Pittsburgh). The map draws walking legs, boarding/alighting stops, route and direction, transfers and the final walk; the summary shows the provider's estimated arrival and total duration (walking + waiting + riding). Arrival is always labeled an estimate and marked realtime or scheduled. No routing engine of our own; no fabricated travel times. The nearest tracked route is never presented as a route to the destination.
- **One shared trip state.** Manual fields, the chat planner, the map, the itinerary, the pressure module and the timeline read and write the same origin/destination/time/journey. Older routing responses never overwrite newer selections.
- **Chat planner replaces the Scenarios page.** "Ask LoadLine" is a sheet on the home screen. With `ANTHROPIC_API_KEY` Claude interprets requests and explains validated results through server-side tools; without it a deterministic guided parser handles common phrasings and says so. Neither can invent routes, schedules, events or ETAs: every action is validated against real results before it changes the trip. The three deterministic scenarios remain via `/?demo=<scenario>&stage=<n>` and the DEMO API mode for verification.
- **Broader causes, honestly scoped.** Event categories now include concerts, festivals, conventions, campus events, theater and other ticketed events (Ticketmaster venue coordinates, optional key), plus verified PRT alerts. Rider-reported causes are accepted from chat as separate, unverified signals with reduced weight and an explicit label. Each result lists its coverage gaps; absence of a known event is never shown as "nothing is happening".
- **Concise home, expandable evidence.** Advice, WHY and event impact are collapsed by default; source freshness and coverage are on the Information page, linked only from the top-right menu; "Model index, not occupancy" stays visible. The timeline's bars are mouse/touch/keyboard selectable and open a "What's happening today/tomorrow/<date>" section built only from that sample's evidence (event name, venue, timing, source, estimated-end label, weather and service detail, model advice).

Unchanged non-negotiables: 0–100 heuristic model index, never occupancy; estimated event ends are labeled; missing sources lower confidence; Pittsburgh local time throughout. Interfaces: [ARCHITECTURE](ARCHITECTURE.md).

## Decision 2026-09-12 (issue #19, approved by Nate)

**LoadLine predicts Transit Pressure.** For a destination and time it combines event timing and proximity (Pirates, Steelers, Penguins; concerts with an optional key), hourly weather, time-of-day patterns, PRT scheduled service and PRT GTFS-Realtime delays/alerts into one explained 0–100 model index, an upcoming surge window, the reasons (WHY) and a departure recommendation. This supersedes the capacity-first milestone below, which stays as history and as the boundary for any future occupancy work.

Non-negotiables: the index is never presented as seats, passengers or percent full; event ends are labeled estimates; missing or stale sources lower confidence rather than being fabricated; deterministic demo scenarios run through the same engine as live data. Existing mapping, geocoding and live PRT arrival times are preserved. Implementation and verification: [overnight report](overnight-report.md); interfaces: [ARCHITECTURE](ARCHITECTURE.md).

| Opening-deck criterion | Concrete proof |
| --- | --- |
| Originality | Fusing events + weather + time + service into one explained prediction with a surge window and advice, which route planners do not expose together. |
| Technical difficulty | Interpretable multi-signal model with distance/time curves, protobuf GTFS-RT decoding, GTFS calendar handling, graceful degradation, relationship tests. |
| Usefulness | A rider sees pressure now and later, why, and a better time to leave. |
| Demo quality | Stage a game, then rain, then a delay; score, WHY, surge window and advice react live; survives API failure via scenarios. |
| Track relevance (Traveling) | Decides when to travel, not only how. |

---

## Superseded: capacity on the specific bus (kept for history)

## Confirmed objective

Keep the existing Google flow: rider location + destination → walking directions, suitable routes/departures, and estimated arrival. **Our addition answers: how full is the specific bus I am considering right now?** The next question is whether it is likely to be full when it reaches the boarding stop.

Current capacity is the first milestone. Route planning, walking-time calculation, destination filtering, and arrival prediction stay with the existing routing providers. A capacity card enriches an already selected journey. This is a proposed build; no routing integration, capacity feed, or application is implemented yet.

The problem comes from the team's experience of full buses passing waiting riders. Its frequency, any measured time savings, and PRT's current occupancy coverage have not been established.

## What the first version must prove

1. **Correct bus:** resolve a Google-selected departure to a PRT vehicle and its current run. A route label such as 71D can describe several buses; do not attach one bus's load to every departure on that route.
2. **Current capacity:** obtain actual occupancy data and show a visual capacity indicator with source and observation age when known; distinguish feed update time from occupancy measurement time. Show `passengers / total capacity` only when both are supported; use a reported percentage or category when that is what the source provides. Unknown remains unknown.
3. **Useful integration:** display the capacity card alongside the selected journey, preserving the existing walking/route/ETA information. Changing departures must select the corresponding vehicle's capacity. A route-input shortcut may be used for an early data demo; it does not prove Google integration.

An opt-in phone tracker can help match a rider's movement to a bus and associate a report with that run. It observes participating devices, not all passengers. A unique bus ID references records; it does not inherently encode live occupancy or a verified rated capacity. See [the architecture](ARCHITECTURE.md) for the data distinctions.

## Priority order and limits

- **First:** verify PRT live vehicle identity and occupancy. Build one accurate capacity card for one bus.
- **Then:** attach it to the existing Google journey using a thin adapter. Reuse Google routing APIs where an application integration is needed; do not build another routing engine.
- **Then, if justified:** foreground phone-to-bus matching and explicit rider reports when they close a demonstrated data gap. A report collection feature is an optional source, not a required replacement for agency data.
- **Later:** forecast occupancy at the boarding stop using actual boarding/alighting observations or usable historical data. Present it separately from the current reading and validate it before making reliability claims.

City-wide routing, new arrival predictions, a second trip planner, pass-up reporting, social features, required accounts, a native app, background tracking, and new bus hardware are outside the first milestone. Do not add them simply because a tool can generate them quickly. No passenger count from raw app-session counts, and no capacity forecast based solely on GPS or ETA.

## Competition strategy

**Recommended primary track: Traveling.** We improve the rider's ability to use an existing journey. Optimization becomes a possible alternative only if the finished product demonstrates an actual optimization objective and improvement; the submission selects one main track.

| Opening-deck criterion | Concrete proof |
| --- | --- |
| Originality | Demonstrate the specific improvement to the CMU rider's existing capacity information; validate the local gap instead of claiming crowding displays are new. |
| Technical difficulty | Reliable journey-to-vehicle matching and live capacity normalization; add phone matching or arrival forecasting only when they work and matter. |
| Usefulness | A rider sees whether a selected bus has reported room, is full, or lacks current evidence. |
| Demo quality | Existing journey → correct vehicle → changing capacity visual, with an honest unknown/stale example, within three minutes. |
| Track relevance | Capacity directly affects whether the traveler can use the selected bus. |

[Opening deck](../HackCMU%202026%20Opening%20Ceremony.pdf), pp. 16–21, 33–35. Transit already supports crowding data; check actual local coverage and usability before asserting a novelty advantage. [Transit documentation](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line).

## Decisions and next evidence

Recommended stack remains a small Next.js/TypeScript frontend/API; add shared Postgres persistence when reports or history require it. Data-source verification comes before provisioning extra infrastructure. The developer guide's `getpredictions` can supply specific vehicle identity, ETA, and current crowding together; if populated by PRT, it removes the need for phone tracking in the first milestone. Displaying an existing feed alone offers limited differentiation: prove the capacity-based improvement to the rider's existing journey. The proposed contract, access/quota limits, and first feasibility check are in [ARCHITECTURE](ARCHITECTURE.md).

Open technical facts: authenticated PRT sample, usable occupancy fields, verified per-vehicle capacity metadata if numeric ratios are desired, pilot departure/stop IDs, Google integration credentials, and forecast training/validation data. None is assumed available.

People choose tasks in [GitHub Issues](https://github.com/ethancurb/cmu-hackathon/issues); it holds current scope, ownership, blockers, and completion. Each person records published changes and verification in their own [ledger](../ledgers/) with each push containing new work. Follow [AGENTS](../AGENTS.md) for the workflow. This file records product decisions, not task status.

Delivery: **September 12, 2026, 4 p.m. EDT**, three-minute presentation/demo. [Official schedule](https://hack-cmu-2026.devpost.com/details/dates). Internal targets: freeze extra features by 10 a.m., rehearse by 1 p.m., submit by 3:30 p.m. Use the time remaining. Form URL/fields, judging slot, Q&A, and post-submission coding rules remain unrecorded.
