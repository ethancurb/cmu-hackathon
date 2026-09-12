# LoadLine frontend + API

Next.js 16 / React 19 / TypeScript / Tailwind. One app serves the mobile-first UI and the `/api/pressure` model endpoint.

```sh
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start -- --port 3100
npm test                     # node --test: model sanity + adapter parsing
npm run typecheck && npm run lint
node scripts/qa-screens.mjs  # Playwright screenshots/overflow/console check (server on :3100)
node scripts/qa-flow.mjs     # primary journey + demo stepping + tomorrow plan
node scripts/probe-signals.mjs  # read-only reachability check of every live source
```

## Where things live

| Path | Role |
| --- | --- |
| `lib/pressure/types.ts` | Canonical contracts: `SignalBundle`, `DemandPrediction`, `PressureResult`, `EventSignal`, `DataFreshness`… |
| `lib/pressure/config.ts` | Every model weight/threshold, documented. |
| `lib/pressure/engine.ts` | Pure model: temporal baseline, event curves, weather, realtime, service, confidence, surge/best windows, recommendation. |
| `lib/pressure/providers/*` | Server-side adapters: sports schedules, Open-Meteo, PRT GTFS-RT (protobuf), GTFS snapshot. Each returns signals + freshness; failures degrade, never fabricate. |
| `lib/pressure/demo.ts` | Three deterministic scenarios with stages, run through the same engine. |
| `lib/pressure/service.ts` | Assembles live signals into a bundle. |
| `app/api/pressure/route.ts` | `GET /api/pressure` LIVE (`lat,lng[,dlat,dlng][,at][,horizon]`) or DEMO (`mode=DEMO&scenario&stage[&at]`). |
| `lib/pressure/use-pressure.ts` | Client hook (polls live results every minute; keeps the last good result on failure). |
| `app/PressureModule.tsx`, `app/PressureDots.tsx` | Home pressure surface. |
| `app/plan/PressureTimeline.tsx` | Timeline bars with surge band and lowest-window bracket. |
| `app/demo/page.tsx`, `app/DemoBar.tsx` | Presenter console and the on-home stage strip. |
| `app/MapCanvas.tsx`, `app/RouteMap.tsx` | MapLibre raster basemap, real PRT route shapes, origin/destination/event-venue markers. |
| `app/api/arrival-times/route.ts` | Live PRT next-bus predictions for the three tracked routes near CMU. |

## Environment variables

None required. Optional, all in `.env.local` (never in Git):

- `ANTHROPIC_API_KEY` — enables the Claude-backed chat planner (`lib/chat/model.ts`, model `claude-opus-5`, server-side only). Without it `/api/chat` runs the deterministic guided parser and the sheet says so; the model is never faked.
- `TICKETMASTER_API_KEY` — concerts, theater, festivals and other ticketed events within 15 miles (venue coordinates from the feed). Without it those causes are listed as coverage gaps.
- `DATA_MODE=DEMO` — default `/api/pressure` to the deterministic scenarios.

Routing (`/api/journey`) uses the public Transitous (MOTIS) instance over PRT GTFS: key-free, identified by User-Agent, cached 45 s per request. Geocoding uses Photon (key-free).

## Rules that keep the product honest

- Scores are 0–100 **model indices**. Never render them as seats, passengers or percent full.
- Event end times are duration assumptions and are labeled "est. end".
- A provider failure produces `UNAVAILABLE`/`STALE` freshness and lower confidence, never an invented observation. Missing events are not evidence of no events.
- Preserve the visual system: warm canvas, serif display type, mono utilities, thin borders, square controls, restrained pressure colors only on pressure glyphs.
