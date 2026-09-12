# Demo: predict the surge, then beat it

Target Traveling. **Three-minute presentation/demo; Google Form due September 12, 4 p.m. EDT.** [Opening deck](../HackCMU%202026%20Opening%20Ceremony.pdf), pp. 33, 51. Task progress belongs in GitHub Issues; this file records the demo and delivery evidence. Run `cd busappfrontend && npm run build && npm start -- --port 3100` and open `http://localhost:3100` on a phone-sized window.

## Three-minute proof

- **0:00–0:20:** Home screen, live mode. "Google Maps answers how to get there. LoadLine answers what transit will be like when you go, why, and when to leave." Point at the index, level, confidence and the WHY list built from real MLB/NFL/NHL schedules, Open-Meteo and PRT realtime.
- **0:20–1:20:** `/?demo=pirates&stage=0` (or `/demo` → Pirates). Step **Normal → + Game → + Rain → + Delay**. Narrate: score climbs 31 → 62 → 73 → 91, "Pirates vs Cubs · estimated exit wave" enters WHY, PNC Park marker appears, the event impact card shows the estimated end, the surge window appears, advice flips from "Leave now" to "Wait until 10:25 PM".
- **1:20–1:50:** Tap the recommendation → `/plan`: the timeline with the surge band and lowest-window bracket; pick a bar; "Use selected time" returns home with pressure at that time.
- **1:50–2:20:** Back in live mode: search a real address (map re-fits, nearest route selected), show "Tomorrow / 8 hours" on `/plan` for a trip near Acrisure Stadium on a Steelers Sunday. Open "sources" in the footnote: every input's status and age; explain that a failed source lowers confidence instead of being faked, and that the index is not occupancy.
- **2:20–2:40:** Rider benefit and Traveling fit: decide *when* to travel, not only how.
- **2:40–3:00:** buffer and close.

If the network fails, stay in demo mode: the scenarios run through the same engine offline.

## Evidence to record

- Model tests, typecheck, lint, build, Playwright screen + flow QA: passing at the revision named in the [overnight report](overnight-report.md) and Nate's ledger.
- Live sources observed LIVE on 2026-09-12: MLB, NHL, ESPN, Open-Meteo, PRT GTFS-RT vehicles/trips/alerts. Ticketmaster: UNAVAILABLE without a key.
- Occupancy: none is displayed anywhere; the index is a model value. Do not describe it as seats or percent full on stage.
- Physical-phone check, judging slot/room, form fields and submission receipt: not yet recorded.

Rehearse a complete real-data path before calling it live. Clearly label synthetic bus scenarios, manually selected journey inputs, cached readings, rider reports, and recorded fallbacks. A moving marker or a visual capacity gauge does not validate the number displayed. A category from the feed must not become an invented `42/60` display.

Internal targets: freeze extra features by 10 a.m., rehearse by 1 p.m., submit by 3:30 p.m. Check the form's track-rationale requirement and write the short explanation around the capability actually demonstrated. Respect the actual post-submission code policy.
