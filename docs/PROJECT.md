# Project: is this bus worth waiting for?

The user has selected the problem. This is the recommended execution baseline for the team; no application is implemented yet. The lead records changes here once, so four agents do not independently redesign the product.

## Problem and win thesis

A CMU rider can know when a PRT bus will arrive and still be passed by a full bus. Our product helps the rider judge whether to wait for that specific arrival by showing recent crowding/pass-up evidence and the next comparable departure. This pain comes from the team's experience; its frequency and any time savings are not yet measured.

**Recommended primary track: Traveling.** Travel decisions are the direct outcome. Optimization is a secondary framing only if we demonstrate an actual objective, constraints, and measured improvement. Choose one main track. Sponsor entries remain optional and must strengthen this same flow.

**Competitive thesis:** a focused CMU boarding decision with vehicle/trip-specific evidence, visible freshness, explicit uncertainty, and a useful comparison. Transit already offers agency and rider crowding reports; that mechanism alone is not our originality claim. Validate the current local experience and demonstrate a concrete improvement. [Transit documentation](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line).

## Three must-have outcomes

1. **See the actual arrival:** select one pilot CMU-area origin/destination pair and direction; see the next two comparable buses, vehicle identity, ETA, and data freshness. Live availability is a feasibility gate, not an existing capability.
2. **Contribute specific evidence:** a rider confirms their bus and reports seats / standing / full in one tap. A waiting rider can report a pass-up separately; that observation does not prove the cause was capacity. A second phone sees the update within ten seconds under demo conditions.
3. **Make an informed choice:** compare these departures with recent evidence and its source. Missing, stale, conflicting, or ambiguous information remains explicit. Never display invented occupancy percentages or promise that boarding is guaranteed.

The centerpiece is **correctly joining a report to a vehicle's current run, applying freshness/conflict rules, and changing the waiting rider's decision screen**. Use AI to accelerate development; keep the decision logic deterministic and inspectable.

## Scope and proof

Start with one route/direction and a verified stop pair; select actual IDs from the feed. Both compared departures must serve the destination. Add a second route only after its destination compatibility is verified. No guessed stop IDs, city-wide planner, native app, background location collection, passenger counting from app-user counts, custom model training, payments, unrelated login, or operator dashboard.

Location is an optional aid to selecting a stop/bus. It cannot reveal all passengers, and nearby vehicles can be ambiguous. The rider confirms the match. Exact capacity needs an actual occupancy source; our MVP offers categorical evidence.

| Opening-deck criterion | Our concrete proof |
| --- | --- |
| Originality | Show the precise boarding/pass-up decision improvement over the current local workflow; acknowledge existing crowding apps. |
| Technical difficulty | Live arrival-to-run matching, persisted reports across two clients, and tested expiry/conflict handling. |
| Usefulness | A rider compares the arriving bus with the next usable departure; observe whether teammates can explain and use the result unaided. |
| Demo quality | Two ready phones and one readable screen; input → changed result → uncertainty example within three minutes. |
| Track relevance | Every core interaction helps a traveler decide which bus to wait for. |

[Opening deck](../HackCMU%202026%20Opening%20Ceremony.pdf), pp. 16–21, 33–35. Presentation/demo is three minutes total. Google Form submission is **September 12, 2026, 4 p.m. EDT** (p. 51; [official schedule](https://hack-cmu-2026.devpost.com/details/dates)). Form URL/fields, judging slot, Q&A, and post-submission coding rules still need recording.

## First actions and cutoffs

- **First 20–30 minutes:** lead tests PRT access and captures a real arrival with vehicle/run identity, timestamps, and any occupancy fields; demo owner checks the existing rider workflow. Obtain the required API access through the official developer portal. Do not wait indefinitely for credentials.
- **Next two hours:** integrate the board and report flow against the same contract. If live access is blocked, use explicitly synthetic runs to verify the software; keep the live-data gap visible and continue resolving it. A simulated screen is not proof of PRT capacity coverage.
- **By Saturday 10 a.m.:** stop adding features. The technical centerpiece and complete flow should work together; cut extra routes/maps first.
- **By 1 p.m.:** rehearse the live candidate, honest fallback, and three-minute pitch. **3:30 p.m. internal submission target**, leaving thirty minutes before the official deadline.

These are internal targets. Use the time remaining; do not restart the clock. Pilot coverage needs observations: initially seed a disclosed campus trial with teammates and verify a real report when feasible. No users and no agency occupancy means unknown capacity. Do not manufacture city-wide coverage.

## Four independent lanes

Paths below are reserved for the proposed scaffold; they do not exist yet. Assign a human to each lane and a backup integrator before concurrent writes. The lead creates the shared shell, schema, and first fixture; builders then work independently. Each agent updates only its own handoff from this current assignment.

| Role | Deliverable and owned paths | Boundary |
| --- | --- | --- |
| lead | PRT feasibility/adapter, API integration, shared types/schema, package/config/deploy: `src/lib/transit/`, `src/lib/contracts.ts`, `src/lib/server/`, `src/app/api/`, `db/`, app shell | Publish normalized runs and shared fixture first. Coordinate shared-file edits. |
| build-a | Waiting-rider board: `src/components/board/` and colocated tests | Consume board response; handle unknown/stale/conflict/error visibly. |
| build-b | Rider reporting UI plus pure evidence rules: `src/components/report/`, `src/lib/evidence/` and colocated tests | Submit the exact report contract; test run isolation, expiry, and contradictions. Lead wires handlers/storage. |
| demo | `docs/DEMO.md`, `public/demo/`, `tests/e2e/` | Two-device verification, pilot observation, comparison with existing tools, pitch and submission. |

Humans and backup integrator: unassigned. Recommended stack and exact component contract: [ARCHITECTURE](ARCHITECTURE.md). Product choice is settled; PRT live occupancy, credentials, pilot IDs, and the deployed implementation remain unverified.
