# Demo: predict the surge, then beat it

Target Traveling. **Three-minute presentation/demo; Google Form due September 12, 4 p.m. EDT.** [Opening deck](../HackCMU%202026%20Opening%20Ceremony.pdf), pp. 33, 51. Task progress belongs in GitHub Issues; this file records the demo and delivery evidence. Run `cd busappfrontend && npm run build && npm start -- --port 3100` and open `http://localhost:3100` on a phone-sized window.

## Three-minute proof

- **0:00–0:25:** Home screen, live mode. "How should I get there, when should I leave, and what could make it busier?" Tap **Ask LoadLine** and type "CMU to the North Shore by 7". The reply lists real walking + PRT itineraries (Transitous over PRT GTFS) with estimated arrivals and the Transit Pressure advice; tap a journey card → **Show on map**: the map draws the walk, the boarding stop, the bus and the final walk; the summary shows arrival (estimate, realtime/scheduled) and total duration. Say "the museum" to show the clarification chips. If no `ANTHROPIC_API_KEY` is set, say so: the sheet is labeled "Guided planner"; the routes and pressure are real either way.
- **0:25–0:45:** Pan and zoom the map (two fingers / Ctrl+scroll keep the page scrollable), tap **Fit route**. Press **Leave now**: the itinerary and the ETA on the button refresh together. Expand **Advice** and **Sources**: WHY, event impact, every feed's status, and the listed coverage gaps ("Model index, not occupancy" stays visible).
- **0:45–1:40:** `/?demo=pirates&stage=0`. Step **Normal → + Game → + Rain → + Delay**. Narrate: score climbs 31 → 62 → 73 → 91, "Pirates vs Cubs · estimated exit wave" enters WHY, PNC Park marker appears, the surge window appears, advice flips from "Leave now" to "Wait until 10:25 PM".
- **1:40–2:15:** Tap the stats button → `/plan`: the timeline with the surge band and lowest-window bracket. Tap the peak bar (or use ← →): **What's happening today** opens with that bar's evidence — Pirates vs Cubs, PNC Park, 6:30–9:30 PM with "end is an estimate", the source, weather and PRT delay detail, and the model's advice. Tap a quiet bar: "No specific event is known… not covered: concerts (needs Ticketmaster key)…". "Use selected time" returns home; the journey search re-runs for that time.
- **2:15–2:40:** Rider benefit and Traveling fit: decide *when* to travel and *how*, with the reasons on screen and nothing invented.
- **2:40–3:00:** buffer and close.

If the network fails, stay in demo mode: the scenarios run through the same engine offline (itinerary search is off in scenarios, by design).

## Evidence to record

- Model tests, typecheck, lint, build, Playwright screen + flow QA: passing at the revision named in the [overnight report](overnight-report.md) and Nate's ledger.
- Live sources observed LIVE on 2026-09-12: MLB, NHL, ESPN, Open-Meteo, PRT GTFS-RT vehicles/trips/alerts. Ticketmaster: UNAVAILABLE without a key.
- Occupancy: none is displayed anywhere; the index is a model value. Do not describe it as seats or percent full on stage.
- Physical-phone check, judging slot/room, form fields and submission receipt: not yet recorded.

Rehearse a complete real-data path before calling it live. Clearly label synthetic bus scenarios, manually selected journey inputs, cached readings, rider reports, and recorded fallbacks. A moving marker or a visual capacity gauge does not validate the number displayed. A category from the feed must not become an invented `42/60` display.

Internal targets: freeze extra features by 10 a.m., rehearse by 1 p.m., submit by 3:30 p.m. Check the form's track-rationale requirement and write the short explanation around the capability actually demonstrated. Respect the actual post-submission code policy.
