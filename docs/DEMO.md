# Demo: add capacity to the journey

Target Traveling. **Three-minute presentation/demo; Google Form due September 12, 4 p.m. EDT.** [Opening deck](../HackCMU%202026%20Opening%20Ceremony.pdf), pp. 33, 51. Task progress belongs in the separate ticket system; this file records the demo and delivery evidence.

## Three-minute proof

- **0:00–0:20:** show the existing Google journey: origin, destination, route, walking time, and departure. State the missing question: how full is this specific bus?
- **0:20–1:15:** reveal the matched PRT vehicle and current capacity card. Show the actual source and measurement age when known; label feed updates separately and disclose unknown occupancy age. Numeric, percentage, and categorical displays must reflect the available data.
- **1:15–1:55:** switch to another selected departure or show a newly reported reading. Demonstrate that capacity follows the physical vehicle/run, including when two buses share a route label.
- **1:55–2:25:** show unknown/stale data or an ambiguous match. Explain the matching/data challenge. Demonstrate phone-assisted matching only if implemented; never describe phone count as total passengers.
- **2:25–2:40:** explain the rider benefit and Traveling fit. A future-at-stop forecast is presented only if it exists and has supporting evaluation.
- **2:40–3:00:** buffer and close.

## Evidence to record

- Existing journey integration and pilot bus/stop/run IDs: unverified.
- Authenticated occupancy sample, numeric versus categorical support, and freshness: unverified.
- Verified per-vehicle rated capacity if a ratio is shown: unavailable.
- Google-to-PRT match, wrong-bus/ambiguous-match checks: not implemented.
- Forecast observations, model, and validation: unavailable; display prediction unavailable.
- Candidate commit/deployment/devices, tested result, reset/recovery: not available.
- Actual form/link requirements, judging slot/room, and submission receipt: not recorded.

Rehearse a complete real-data path before calling it live. Clearly label synthetic bus scenarios, manually selected journey inputs, cached readings, rider reports, and recorded fallbacks. A moving marker or a visual capacity gauge does not validate the number displayed. A category from the feed must not become an invented `42/60` display.

Internal targets: freeze extra features by 10 a.m., rehearse by 1 p.m., submit by 3:30 p.m. Check the form's track-rationale requirement and write the short explanation around the capability actually demonstrated. Respect the actual post-submission code policy.
