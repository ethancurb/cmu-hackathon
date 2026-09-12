# Overnight implementation — #19

Approved by Nate: predictive Transit Pressure replaces capacity-first delivery. Preserve existing map and visual system. No passenger counts, occupancy percentages, LLM dependency, or detached servers.

## Milestones

- [x] P0 inspect repository; baseline test/typecheck/lint/build and foreground production start pass.
- [x] Data research: MLB, NHL, ESPN (NFL), Open-Meteo and PRT GTFS-RT (vehicles/trips/alerts, protobuf) all verified live and key-free. Ticketmaster optional via key.
- [ ] P1 engine v2: readable, config-centralized model; corridor proximity; smooth event curves with estimated-end widening; alert weighting by effect; realtime evidence decay; HIGH/MEDIUM/LOW confidence; structured recommendation; event impact summaries. Sanity tests green.
- [ ] P2–P3 events + weather already feed the engine (live). Dedupe events; keep ends labeled as assumptions.
- [ ] P4–P6 surge window, best window, WHY and recommendation exposed by `/api/pressure`.
- [ ] P7 frontend: pressure module on home (dots, score, level, confidence, surge, WHY, recommendation); real timeline on `/plan`; mock seats/walk claims removed; mobile scroll restored.
- [ ] P8 three deterministic scenarios + staged comparison (`/demo` presenter page; `?demo=` on home) through the same engine.
- [ ] P9 PRT realtime: verified; graceful UNAVAILABLE/STALE handling in UI.
- [ ] Final: tests/typecheck/lint/build, responsive Playwright QA (mobile/tablet/desktop), judge review, README + env docs, overnight report, ledger, issue #19.

## Current priority
P1 engine v2, then P7 frontend integration.

## Blocked
Nothing blocked. Ticketmaster concerts need `TICKETMASTER_API_KEY` (optional; absence is reported as UNAVAILABLE, never as "no events").

P10 natural language and P11 visual novelty are optional and deferred. Single writer: Nate, branch natepaulo. Track scope/publication in issue #19.
