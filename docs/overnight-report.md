# LoadLine overnight report (2026-09-12, issue #19)

Approved direction: predictive **Transit Pressure** replaces the capacity-first milestone. This report is the morning handoff.

# WHAT I BUILT

- **Transit Pressure engine v2** (`busappfrontend/lib/pressure`): an interpretable weighted model that turns time patterns, events, weather, PRT realtime evidence and scheduled service into a 0–100 index with named, capped contributions (the WHY), a level (LOW/MODERATE/HIGH/SURGE), three-level confidence, a 15-minute timeline, surge and lowest-pressure windows, per-event impact summaries and a structured recommendation.
- **Live adapters** (server-side, key-free, cached, coalesced): MLB Stats API (Pirates home games), NHL API (Penguins), ESPN (Steelers), Open-Meteo hourly forecast, PRT GTFS-Realtime vehicles/trips/alerts decoded from protobuf with a minimal bounded reader, and a PRT GTFS static snapshot (56 sampled stops near CMU, PNC Park, PPG Paints Arena and Acrisure Stadium with calendar/exception handling). Optional Ticketmaster concerts behind `TICKETMASTER_API_KEY`.
- **`GET /api/pressure`** LIVE and DEMO modes, input validation, 400/503 errors, no-store caching.
- **Home screen** pressure module: dots, score, level, confidence, expected surge window, top-3 WHY, advice + detail, event impact (venue, distance from the trip, start / estimated end / surge window), provenance footnote with expandable sources. The primary button is the recommendation. Live next-bus cards keep PRT arrival times; all mock seat/walk claims were removed.
- **Plan screen**: real pressure timeline (4 h / 8 h, Today / Tomorrow 7 AM), surge band, lowest-window bracket, departure-window options derived from the model, "Use selected time" feeds the chosen departure back to the home module.
- **Demo**: `/demo` presenter console (three scenarios, stages side by side) and `/?demo=<scenario>&stage=<n>` which drops the real home screen into a scenario with a stage stepper. Same engine, deterministic inputs.
- **Map**: origin/destination fit, real PRT route shapes (existing), plus a venue marker for the event driving pressure.
- **Layout**: mobile scrolls again as content grows; desktop renders a centered phone-width column on the page surround, matching the reference frames.

# THE DIFFERENTIATOR

Route planners answer "how do I get there". LoadLine answers "what will transit feel like when I go, what is causing it, and when should I leave" by fusing events, weather, time patterns and service evidence into one explained index with a surge window and a departure recommendation.

# ARCHITECTURE

```
destination + time ──► /api/pressure ──► service.ts assembles SignalBundle
                                          ├─ providers/events.ts   (MLB · NHL · ESPN · Ticketmaster?)
                                          ├─ providers/weather.ts  (Open-Meteo hourly)
                                          ├─ providers/schedule.ts (GTFS snapshot → departures near origin)
                                          └─ providers/transit.ts  (GTFS-RT protobuf → delays, alerts, vehicles)
                     demo.ts scenarios ──► same SignalBundle shape
SignalBundle ──► engine.ts (pure) ──► PressureResult ──► usePressure() ──► PressureModule / PressureTimeline / DemoBar
```

Providers never reach React; React only sees `PressureResult`. Weights live in `config.ts`. Freshness (`LIVE | STALE | FALLBACK | UNAVAILABLE | DEMO`) travels with every result.

# HOW TRANSIT PRESSURE IS CALCULATED

`score = clamp(0, 100, temporal + Σevents(≤50) + weather(≤20) + transit(≤24) + service(≤10))`, rounded, evaluated every 15 minutes across the horizon (default 4 h, max 8 h).

- **Temporal baseline**: hourly profiles (weekday / weekend) linearly interpolated so there are no cliffs; Friday/Saturday 10 PM–1:30 AM adds +6. Range roughly 8 (3 AM) to 34 (8 AM weekday).
- **Event**: `magnitude × exp(−(d/1.6 km)²) × timeShape`, cut off at 4 km. `d` is the distance from the venue to the straight corridor between origin and destination, so an event anywhere along the trip counts. `timeShape` = max(inbound×0.75, outbound, during 0.1) where inbound ramps from −150 min to −20 min before start and fades by +45 min; outbound ramps from 45 min before the end, plateaus for 10 min after it, and decays over 80 min (110 for football). Estimated ends widen the outbound wave by 20 min on both sides. Sum of events capped at 50.
- **Weather** (hour matching the sample): precipitation probability up to +12, measurable rain floor +10, snow +6, extreme temperature (<−5 °C or >32 °C) +5, thunderstorm (WMO ≥ 95) or wind ≥ 60 km/h +6; cap 20.
- **Transit realtime**: 1.5 points per minute of the largest explicit delay at nearby stops (≤18) plus alert points by GTFS-RT effect (NO_SERVICE 14, SIGNIFICANT_DELAYS 12, REDUCED_SERVICE 10, DETOUR 6, MODIFIED 4, STOP_MOVED 3, OTHER 3); cap 24; full weight for 15 min after observation, fading to zero at 60 min; excluded entirely when the feed is STALE/UNAVAILABLE.
- **Service**: the shortest gap between the next two scheduled departures on the same stop+route+direction within 2 h; (gap − 15) / 3 points, cap 10.
- **Levels**: LOW < 25 ≤ MODERATE < 50 ≤ HIGH < 75 ≤ SURGE.

# MODEL ASSUMPTIONS

All weights are heuristics chosen for plausible, explainable behavior and validated by relationship tests, not fitted to PRT ridership. Event magnitudes are venue/category classes (MLB/NFL MAJOR, NHL/concert LARGE), not attendance. Event durations: baseball 180 min, football 210, hockey/concert 150, always flagged `endEstimated`. Corridor proximity is a straight line, not the bus path.

# REAL DATA SOURCES USED

| Source | Access | Status observed |
| --- | --- | --- |
| MLB Stats API schedule (team 134) | key-free JSON | LIVE |
| NHL club-schedule-season PIT | key-free JSON | LIVE |
| ESPN NFL team schedule PIT | key-free JSON | LIVE |
| Open-Meteo hourly forecast | key-free JSON | LIVE |
| PRT GTFS-RT `truetime.rideprt.org/gtfsrt-bus/{vehicles,trips,alerts}` | key-free protobuf, no CORS → server-side | LIVE (feed timestamps within seconds) |
| PRT GTFS static (`GTFS.zip`) | key-free, snapshotted by `scripts/prepare-schedule.py` | FALLBACK (scheduled, not live) |
| Photon geocoding, Esri raster tiles | key-free | existing |

# FALLBACK DATA SOURCES

Three authored scenarios (`lib/pressure/demo.ts`) and the GTFS snapshot. Any live provider failure yields `UNAVAILABLE` (or `STALE` when a cached value ≤ 6× TTL exists) and lowers confidence; the score simply omits that term.

# EVENT MODEL

Home games only, at PNC Park, PPG Paints Arena and Acrisure Stadium (venue coordinates are fixed). Cancelled/postponed/final games are excluded. Duplicate IDs are deduped. Each result lists `eventImpacts` (peak contribution, window where the event contributes ≥ half its peak, distance from the trip, MAJOR ≥ 20 points) so the UI can show "Event impact" only when it matters.

# WEATHER MODEL

See above. Weather is matched to the sample hour, so a rain window later in the timeline raises later bars, not the current one.

# TRANSIT MODEL

Realtime evidence is scoped to sampled stops within 0.8 km of the origin (delays, stop-scoped alerts, route-scoped alerts for routes serving those stops) and vehicles within 1.2 km (counted for provenance only; a vehicle count is never a passenger count). Evidence decays with age because a delay observed now says little about two hours from now.

# SURGE-WINDOW LOGIC

The first contiguous run of samples ≥ 75 gives `surge {start, end, peak, peakAt, continues}`. The lowest two-sample average gives `bestWindow`. Event impact windows come from the event curve alone.

# CONFIDENCE LOGIC

Usable sources counted: events (≥ 2 sports feeds live, or DEMO), weather, PRT realtime, schedule (FALLBACK counts). HIGH needs all four, no STALE source, weather coverage and horizon ≤ 3 h; MEDIUM needs ≥ 2 and horizon ≤ 24 h; otherwise LOW. Stale realtime therefore drops HIGH and its contribution.

# RECOMMENDATION LOGIC

Ordered rules on the timeline: inside a surge → "Lower pressure after <surge end>" if a ≥12-point lower window exists, else "Allow extra time"; surge ahead → "Leave now" (≤15 min away) or "Leave before <surge start>"; climb of ≥8 to HIGH within 60 min → "Leave now"; HIGH now with a ≥12-point lower window within 120 min → "Lower pressure after <window>"; HIGH otherwise → "Allow extra time"; else "Leave now". Timelines anchored in the future say "Leave at <time>" instead of "now".

# DEMO SCENARIOS

| Scenario | Clock | Trip | Stages → score |
| --- | --- | --- | --- |
| PNC Park game night | Sat 9:10 PM | North Shore → CMU | Normal 31 → +Game 62 → +Rain 73 → +Delay 91 (SURGE) |
| PPG Paints Arena concert | Fri 10:20 PM | Downtown → Shadyside | Normal 25 → +Show 52 → +Rain 63 → +Delay 81 (SURGE) |
| CMU weekday morning | Mon 7:30 AM | CMU → Downtown | Normal 32 → +Rain 43 → +Delay 61 |

Surge window, WHY, event impact and advice change with each stage; nothing is a typed-in number.

# HOW TO RUN

See the root README. `cd busappfrontend && npm install && npm run build && npm start -- --port 3100`. Foreground/session servers only: this host's Job Object blocks detached daemons, which is a host limitation, not an app defect.

# REQUIRED ENVIRONMENT VARIABLES

None. Optional `TICKETMASTER_API_KEY`, `DATA_MODE=DEMO`.

# TEST RESULTS

- `npm test`: 16/16 pass (time of day, magnitude/proximity/corridor, event timing incl. tomorrow/near start/near end/after end/estimated-end widening, staged progressions, weather incl. missing, service disruption + alert weighting + decay, stale/missing realtime, horizon confidence, clamping under extremes, surge/best/impact/recommendation reactions, scenario stability, timezone/DST; adapters: MLB/NHL/NFL parsing, null weather, protobuf rejection, GTFS calendar).
- `npm run typecheck`, `npm run lint`, `npm run build`: clean.
- Runtime: `node scripts/qa-screens.mjs` at 320/390/768/1280 → no horizontal overflow, no console errors, no occupancy wording; `node scripts/qa-flow.mjs` → home → plan → pick bar → apply → home shows "at <time>", demo stage 0→3 raises 31→91, exit demo, Tomorrow/8-hour plan loads 33 bars.
- Live API at CMU (Sat morning): all sports feeds, weather and PRT realtime LIVE; a real PRT "Temp. Stop Move" alert appeared as a small TRANSIT reason.
- `node scripts/qa-fail.mjs`: with `/api/pressure` returning 503 the home module shows "Pressure model unavailable" and no score; with the request aborted the plan screen shows the unavailable state and the apply button stays disabled.
- `node scripts/qa-menu.mjs`: hamburger menu reaches `/demo`; the map's stats button reaches `/plan`.
- Live check for a Steelers Sunday (CMU → Acrisure corridor, tomorrow 11 AM, 8 h): the real ESPN game contributes up to +40, pre-game bars reach 60 and the post-game exit wave 67 with the event impact window 12:00–5:30 PM; confidence LOW because the horizon exceeds 24 h.

# KNOWN LIMITATIONS

- Weights are unfitted heuristics; there is no measured ridership ground truth.
- Concerts need a Ticketmaster key; other events (festivals, university events) are not covered.
- Corridor proximity is a straight line; route-specific effects are approximated by location.
- The GTFS snapshot samples stops around four areas; elsewhere the service term reads UNAVAILABLE.
- Next-bus cards are fixed to three routes near CMU.
- Tested in Chromium emulation only, not on a physical phone.
- No travel-time estimate: "arrive by" is expressed as a departure timeline, not a routing result.

# WHAT I WOULD BUILD NEXT

Route-shape-aware proximity (distance to the selected route's polyline), Ticketmaster + venue calendars, per-route realtime headway from TripUpdates, a "notify me before the surge" timer, and an evaluation harness comparing predicted surges against PRT vehicle bunching on past game nights.

# 60-SECOND HACKATHON DEMO SCRIPT

1. (0–10 s) Open `/`. "Google Maps tells you how to get there. LoadLine tells you what transit will be like when you go." Point at the index, the level, the WHY list.
2. (10–25 s) Open `/?demo=pirates&stage=0`: normal Saturday evening, 31 MODERATE, "Leave now".
3. (25–35 s) Tap **+ Game**: 62 HIGH, "Pirates vs Cubs · estimated exit wave" appears in WHY, PNC Park marker on the map, event impact card with est. end 9:30 PM.
4. (35–45 s) Tap **+ Rain**: 73, rain joins WHY, surge window appears.
5. (45–55 s) Tap **+ Delay**: 91 SURGE, "Expected surge 9:10–10:25 PM", advice flips to "Wait until 10:25 PM".
6. (55–60 s) Tap the button → `/plan`: the timeline shows the surge band and the lowest window. "Every number came from the same model; live mode uses real MLB/NFL/NHL schedules, Open-Meteo and PRT realtime."

LOADLINE DIFFERS FROM GOOGLE MAPS BECAUSE: it predicts and explains how city conditions (events, weather, time, service) will pressure transit before you travel, and tells you when to leave instead of only how to get there.
