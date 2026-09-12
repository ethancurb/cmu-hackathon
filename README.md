# LoadLine: predictive Transit Pressure for Pittsburgh

**Google Maps answers "how do I get there?". LoadLine answers "what will transit be like when I go, why, and when should I leave?"**

Enter a destination and a time. LoadLine combines Pittsburgh sports schedules (Pirates, Steelers, Penguins), hourly weather, time-of-day patterns, PRT scheduled service and PRT GTFS-Realtime delays/alerts into one explained **Transit Pressure** index (0–100), finds the upcoming **surge window**, tells you **why**, and recommends a **better departure** ("Leave before 9:20 PM", "Wait until 10:25 PM").

Scores are a relative model index, never a passenger count or an occupancy percentage. Every prediction lists its reasons and its data sources; missing or stale sources lower confidence instead of being faked.

Recommended track: **Traveling**. Read the [overnight report](docs/overnight-report.md) for what was built, how the model works and the 60-second demo script. Product decisions live in [PROJECT](docs/PROJECT.md); interfaces in [ARCHITECTURE](docs/ARCHITECTURE.md).

## Run it

```sh
git clone https://github.com/ethancurb/cmu-hackathon.git
cd cmu-hackathon/busappfrontend
npm install
npm run build
npm start -- --port 3100      # production, http://localhost:3100
# or: npm run dev              # development server
```

Checks: `npm test` (model + adapter tests), `npm run typecheck`, `npm run lint`, `npm run build`. Runtime QA against a running server (Playwright): `node scripts/qa-screens.mjs`, `node scripts/qa-flow.mjs`, `node scripts/qa-fail.mjs`, `node scripts/qa-menu.mjs`.

No API keys are required. Everything live is key-free: MLB Stats API, NHL API, ESPN NFL schedule, Open-Meteo, PRT GTFS-RT and GTFS static, Photon geocoding, Esri raster tiles.

| Variable | Required | Purpose |
| --- | --- | --- |
| `TICKETMASTER_API_KEY` | no | Adds concert coverage for Pittsburgh venues. Without it, the concert source reports `UNAVAILABLE` (never "no events"). |
| `DATA_MODE` | no | `DEMO` makes `/api/pressure` default to the deterministic scenarios when the request has no `mode`. Default `LIVE`. |

## Demo

- `/` home: destination, time, map, Transit Pressure module, live next-bus times, recommendation.
- `/plan` timeline: 15-minute pressure bars for the next 4 or 8 hours, surge band, lowest window, departure options.
- `/demo` presenter console: three deterministic scenarios (PNC Park game night, PPG Paints Arena concert, CMU weekday morning) stepped one signal at a time through the real engine. Each stage opens on the home screen as `/?demo=pirates&stage=3`.

## Shared context

| Need | File |
| --- | --- |
| Winning strategy | [STRATEGY](docs/STRATEGY.md) |
| Product goals, scope, decisions | [PROJECT](docs/PROJECT.md) |
| Data sources, interfaces, verification | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| Overnight build handoff, model, demo script | [overnight report](docs/overnight-report.md), [overnight plan](docs/overnight-plan.md) |
| Demo and submission | [DEMO](docs/DEMO.md) |
| Detailed research, read as needed | [RESEARCH](docs/RESEARCH.md) |
| Current tasks and claims | [GitHub Issues](https://github.com/ethancurb/cmu-hackathon/issues) |
| Published work by person | [Ethan](ledgers/ethan-ledger.md), [Alex](ledgers/alex-ledger.md), [BigMike](ledgers/bigmike-ledger.md), [Nate](ledgers/nate-ledger.md) |

Agents start from `AGENTS.md`. People choose tasks in GitHub Issues and record pushed work in their ledger. The [opening deck](HackCMU%202026%20Opening%20Ceremony.pdf) sets a three-minute presentation/demo and Saturday **September 12, 4 p.m. EDT** submission.
