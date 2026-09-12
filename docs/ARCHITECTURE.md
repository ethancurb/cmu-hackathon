# Architecture: a capacity addition to an existing journey

Read [PROJECT](PROJECT.md) first. Recommended baseline: one Next.js/TypeScript mobile web frontend and API. Reuse Google for routing and PRT for vehicle data. Add shared Postgres only when persistence is needed for reports or forecasting history. This is a proposed interface; no runtime or integration exists yet.

```mermaid
flowchart LR
  Google[Existing Google journey and selected departure] --> Match[Resolve PRT vehicle and current run]
  PRT[PRT stop predictions with vehicle IDs and current occupancy] --> Match
  Phone[Optional consenting phone location] --> Match
  Match --> Capacity[Read capacity for matched vehicle]
  Capacity --> UI[Capacity card beside existing journey]
  History[Later: boarding and alighting data] -.-> Forecast[Optional forecast at boarding stop]
  Capacity -.-> Forecast
  Forecast -.-> UI
```

## Four different facts

| Fact | How to establish it |
| --- | --- |
| Vehicle identity | Agency fleet ID plus trip/service-day context; a route number is insufficient. |
| Total capacity | Verified metadata for that vehicle/configuration, with a defined seating or total-passenger basis. It is not the current passenger count. |
| Current occupancy | Agency passenger-load feed, an actual passenger sensor, or a clearly labeled rider observation. GPS alone does not supply it. |
| Occupancy at the rider's stop | A separate prediction using current occupancy and expected boarding/alighting before that stop. It can change while the bus approaches. |

An exact ratio requires a numerator and denominator with compatible meanings. A capacity category cannot be converted into a passenger count. Rated capacity also does not guarantee how many people a driver can board at a particular stop.

## First feasibility check: real capacity data

PRT's developer portal describes an API access request and real-time feeds. The supplied [BusTime v3 guide](../DeveloperAPIGuide3_0.pdf), Get Vehicles and Get Predictions sections, documents `psgld` categories `FULL`, `HALF_EMPTY`, `EMPTY`, and `N/A`; thresholds are agency-defined and `N/A` means unknown. **Live PRT population of this field is still unverified.** Preserve its raw value; do not interpret HALF_EMPTY as exactly 50% or EMPTY as zero passengers. The passenger-load field in Get Predictions still describes current load, not a forecast of occupancy at arrival. [PRT resources](https://www.rideprt.org/business-center/developer-resources/), [online API guide](https://realtime.portauthority.org/bustime/apidoc/docs/DeveloperAPIGuide3_0.pdf).

Start with `getpredictions` for a verified boarding-stop ID and route (`stpid` plus `rt`, with `format=json`). It returns vehicle ID (`vid`), arrival/departure time (`prdtm`), trip context, and current passenger load (`psgld`) together. Use `getvehicles` only when coordinates or additional vehicle context are needed. The guide documents categories, not numeric passenger counts or rated capacity. [BusTime guide](../DeveloperAPIGuide3_0.pdf), printed pp. 9–11, 25–28.

Spend the first 20–30 minutes obtaining sanitized authenticated samples for several vehicles: vehicle ID, trip/service date, provider timestamp, and passenger-load values. Check missing-value semantics and coverage across samples; example payloads do not prove live PRT availability. Record the verified API base URL. The guide requires an approved API key and gives a default limit of **10,000 requests per key per day**; access timing and PRT's actual configuration remain unverified. [BusTime guide](../DeveloperAPIGuide3_0.pdf), printed pp. 1–2. A static GTFS schedule or an optional field does not demonstrate live counts. [GTFS-Realtime reference](https://gtfs.org/documentation/realtime/reference/#message-vehicleposition).

Decision: usable counts plus compatible capacity allow a numeric visual; usable categories allow a categorical visual; unavailable or stale data yields an explicit unknown/stale state. If access is blocked, use labeled fixtures to build the card/contract while keeping the unresolved live-data dependency visible. Do not quietly substitute participating-phone counts. Rider observations are a possible explicitly chosen fallback, not an automatic expansion into a reporting platform.

## Map rendering vs. journey routing

`app/RouteMap.tsx`'s basemap (previously a hand-drawn SVG placeholder, flagged in issue #8 as needing a decision) now renders a real, key-free MapLibre GL canvas (`app/MapCanvas.tsx`) centered on the rider's actual browser-geolocated coordinate, falling back to a fixed CMU/Oakland coordinate (`lib/geolocation.ts`) when location is denied or unavailable. It uses Esri's "World Light Gray Base" raster tiles (OpenStreetMap-derived, no API key/billing signup), recolored via `raster-contrast`. Vector tiles (OpenFreeMap, which would allow full per-layer palette recoloring) were tried first but their worker-based tile pipeline didn't come up reliably in this environment; a raster basemap has no such dependency and is the safer choice for a live demo regardless.

This basemap is a static, non-interactive backdrop only — it does not replace Google's routing role described below.

The weather chip (same file) now calls Open-Meteo (`lib/weather.ts`, also key-free) for the resolved coordinate instead of showing a fixed "Ends in 18m" string, showing an explicit "Weather unavailable" state on fetch failure rather than a stale/fabricated reading.

### Route geometry: real PRT shapes, not illustration

`app/RouteMap.tsx`'s three route paths and badges were originally hand-drawn bezier curves at fixed pixel coordinates — deliberately fake, per the old code comment. They're now real PRT route geometry: `public/route-shapes.geojson` (checked in, ~105KB) holds one `LineString` per route, extracted from PRT's published GTFS static feed (`https://www.rideprt.org/developerresources/GTFS.zip`, key-free, ~22MB zipped, `shapes.txt`/`trips.txt`/`routes.txt` only — the extraction script itself wasn't kept, since the output is a small static asset, not something the app needs to regenerate at build or request time). PRT's Developer License Agreement permits reproduction/redistribution with an attribution sentence, carried in `MapCanvas.tsx`'s footnote `title` attribute (visible label truncates at this width; full sentence is in the DOM).

**Route-ID substitution, not yet confirmed with the team:** the mock UI's route labels ("71"/"61"/"54") don't all match real PRT route IDs. Checked each candidate's distance from CMU (40.4443, -79.9428) against the June 2026 feed: bare route "71" runs ~4.1km away in Edgewood/Wilkinsburg, nowhere near Oakland, so the map instead renders **71D** (~340m from CMU) — "71" as a bare route_id no longer exists in PRT's system; only lettered branches (71A/B/C/D) do, matching issue #8's earlier note that some fixture already used the letter branches. **61** has the same issue (no bare route_id); all four 61-branches pass within ~35m of CMU on the shared Forbes Ave trunk, so **61A** was picked arbitrary-but-reasonably among equals. **54** (North Side–Oakland–South Side) is a real bare route and was kept as-is (~600m from CMU). If the team intended specific branches (e.g. matching real boarding stops used elsewhere in the product), swap `GTFS_ROUTE_ID` in `lib/prt-routes.ts` (moved there from `MapCanvas.tsx` once `app/api/arrival-times/route.ts` needed the same mapping — both now import it, rather than keeping two copies that could drift).

Rendering avoids MapLibre's native GeoJSON *source* — adding one as a real map layer went through the same worker-based tile pipeline that silently failed to render vector basemap tiles in this dev sandbox (see above). Instead, `MapCanvas.tsx` fetches the GeoJSON once, projects each coordinate to screen pixels via `map.project()` (synchronous, main-thread, no Worker involved) on load/resize/`moveend`, and draws the result as a plain SVG overlay — the same approach the old illustrative paths used, just with real coordinates now. The "current bus position" lime marker that existed on the old illustrative paths was dropped rather than carried over: pinning a fake vehicle position onto an accurate real map crossed a line the old illustrative-grid version didn't (no real vehicle-position source exists yet — see the capacity contract above).

`recompute()`'s projections are re-run on `load`/`moveend`/resize, but those MapLibre event handlers are attached exactly once (in the mount effect) — they must not close over stale props across re-renders (e.g. the geolocation fallback→resolved-device-location swap), so current `lat`/`lng`/`destination` live in a ref (`latestRef`) that every render updates, not in the handler's original closure.

**Known Esri gotcha:** `World_Light_Gray_Base` has no real imagery past z16 in this area — it silently returns a placeholder *tile image* with "Map data not yet available" baked into the pixels (HTTP 200, not an error) rather than failing. The raster source declares `maxzoom: 16` so MapLibre overzooms the last real tile instead of requesting a nonexistent one; any future zoom/fitBounds change should keep the effective camera zoom ≤ 16, or re-verify against this service directly (`curl` a `.../tile/{z}/{y}/{x}` URL and inspect the PNG — a ~2.5KB file is the placeholder, real tiles here run 13–17KB).

### Address search updates the map and the selected route

`components/LocationField.tsx` is a live address autocomplete now, not a plain text field: typing 3+ characters debounces (350ms) into Photon (`lib/geocode.ts`, `https://photon.komoot.io/api/`) — free, key-free, explicitly built for typeahead (unlike Nominatim, whose usage policy discourages that pattern), biased toward CMU so a query like "Forbes" ranks the local street first. Photon's public instance throttles "extensive usage" with no published hard limit; the debounce plus a 3-character minimum keeps this well clear of that.

Picking a suggestion calls back with a real `{lat, lng}` (not just the label) which `app/page.tsx` holds as `destination` and passes down through `RouteMap` to `MapCanvas`. MapCanvas responds to a new destination two ways: `map.fitBounds()` on the origin+destination pair (visibly "moves" the map — capped at `maxZoom: 16`, the same Esri ceiling above), and `nearestRouteId()` — a flat-plane nearest-vertex distance check against the three loaded route geometries — picks whichever tracked route passes closest and reports it back up as the newly selected route (real, computed, not guessed: verified against two different real Pittsburgh addresses resolving to two different correct routes — a Squirrel Hill address to 61, a North Shore address to 54). Until a destination is picked, the map keeps the old fixed decorative pin/label; once one exists, `MapCanvas` draws the real projected pin instead and the fixed one steps aside.

The picked address (label + coordinate) is cached in `localStorage` (`lib/destination-cache.ts`, key `loadline:destination`) and reapplied on the next load — a per-browser "last search wins" cache, not shared state, cleared only by picking a new address. Read happens in a `useEffect` after mount, not in the `useState` initializer, so the server-rendered first paint and the client's first paint agree (both show the plain default) before the cached value swaps in a moment later; reading `localStorage` during the initial render would disagree between server (no `window`) and client, which is a real hydration-mismatch bug, not just a style preference.

### Real arrival predictions, not mock times

`app/ArrivalCards.tsx`, `app/RouteListView.tsx`, and the home screen's bottom summary (`app/page.tsx`) no longer read `Route.scheduledTime`/`arrivesIn`/`status` from `lib/mock-data.ts` — those fields were removed (dead once nothing read them; `Route.seats` stays mock, since real occupancy is the separate, unimplemented capacity feature in docs/PROJECT.md and this change never touches it). Times now come from PRT's live GTFS-realtime **TripUpdate** feed — a second feed alongside the VehiclePositions one `docs/PRT-DATA.md` already verified key-free access to, same debug-text format, listed at `https://truetime.portauthority.org/gtfsrt-bus/` (`.../trips?debug=`). `lib/prt-trip-updates.ts` parses it (same diagnostic-text-parsing approach as `scripts/probe-prt.mjs`, not a protobuf decoder); `lib/prt-routes.ts` holds, per tracked route, a handful of real PRT stop_ids within ~700m of CMU (extracted once from PRT's GTFS static feed's `stops.txt`/`stop_times.txt`/`trips.txt` — the extraction script wasn't kept, only its small static output).

This feed has no CORS headers, so it's fetched server-side: `app/api/arrival-times/route.ts` (a plain Next.js Route Handler, in-memory-cached 15s to coalesce every client's poll into one upstream read) returns, per tracked route, either `{status:"live", stopName, epochSeconds, minutesFromNow}` or `{status:"unavailable"}`. **Named deliberately differently from the `/api/arrivals` (`CapacityCard`) contract in issue #7/T3** — that's a separate, larger CapacitySource-backed contract that also carries occupancy; this endpoint only ever reports a predicted time, never a seat count, and shouldn't be confused with or block that ticket. `lib/arrivals.ts`'s `useArrivalTimes()` polls it client-side every 20s.

**"Unavailable" is an expected, honest state, not a bug**: PRT's live feed only carries predictions for trips currently in progress, which was a real, very short list in testing (as few as ~14 route_ids system-wide in one off-peak Saturday-morning snapshot) — a tracked route can legitimately have no live prediction most of the time it's checked. The UI shows "—" for that route's time rather than falling back to the old mock number or a stale cached one. There's no static-schedule fallback (e.g. "Scheduled 8:46" when live is empty) — that would need calendar-aware service-day filtering (`calendar.txt`/`calendar_dates.txt`) to avoid showing next Tuesday's schedule on a Saturday, which wasn't built here; skipping it was a deliberate scope cut, not an oversight, and it's the next thing to add if "unavailable" shows up too often in a real demo run. The bottom summary's right-hand slot shows the real stop name the prediction is for instead of a fabricated on-time/delay judgment — GTFS-RT here gives a predicted time, not a scheduled-vs-actual delta, so there's no verified delay to report.

## Join Google to the correct bus

Google can supply walking/transit legs, stops, departure times, line names, and headsigns. Its documented `TransitVehicle` describes vehicle type/name; do not treat that object or a label like 71D as a PRT fleet ID. [Google transit routes](https://developers.google.com/maps/documentation/routes/transit-route), [TransitVehicle reference](https://developers.google.com/maps/documentation/javascript/reference/route#TransitVehicle).

Consume the selected leg from the existing integration. If the starting point is the consumer Google Maps app, do not assume it exposes its selected trip to our app automatically. The proposed product integration uses Google's routing APIs in our frontend; an initial manual selection from a known journey is a disclosed shortcut. Capacity is rendered in our frontend, not promised as a new control inside the consumer Google Maps app.

Normalize agency, route label, headsign/direction, boarding-stop name/coordinates, and departure time. Match these to PRT stop/route metadata and live departures, preserving the existing journey. Use a verified stop mapping and a time tolerance based on actual samples; never join on route alone. Return candidate vehicles when the match is ambiguous. Two adjacent buses on the same route must remain separate.

Use an opaque run key derived from provider + vehicle ID + provider trip ID + service date, adjusted to verified feed semantics. Never carry occupancy into the vehicle's next trip. If stable identity cannot be established, return unresolved rather than guessing.

## What phone tracking can contribute

An opt-in phone location stream can be compared with candidate bus positions, movement, direction, and timing across multiple samples. It can suggest that the phone is riding a particular vehicle. Require confirmation when buses are close or confidence is insufficient. A bus-ID selection/scan identifies the vehicle but still does not measure its passengers.

Browser location updates require permission and a secure context. Start with an explicitly active foreground session; do not promise continuous background tracking from a web page. Keep raw trajectories out of persistent storage unless a concrete task requires them. [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition).

Ten matched phones means ten participating devices, not necessarily ten passengers. Estimating total riders from participating devices would require a known, validated participation rate and handling duplicate devices and departure detection. That evidence does not exist here. Phone participation may be displayed separately with its correct label; it must never populate the passenger-count field.

## Minimal shared contract

Create `src/lib/contracts.ts` and one matching fixture before independent consumers diverge. That code becomes canonical once implemented; do not independently rename this proposed contract. IDs are strings and timestamps are ISO UTC. Keep live and demo namespaces separate.

```ts
type CapacityReading =
  | { kind: "count"; passengers: number; totalCapacity: number | null }
  | { kind: "percentage"; percent: number }
  | { kind: "category"; value: "low" | "some_space" | "full"; providerValue: string }
  | { kind: "unknown" };

type CapacityCard = {
  mode: "live" | "demo";
  runKey: string;
  vehicleId: string;
  routeLabel: string;
  boardingStopId: string;
  expectedAtStop: string | null;
  current: {
    reading: CapacityReading;
    source: "agency" | "sensor" | "rider" | "none";
    observedAt: string | null;
    feedUpdatedAt: string | null;
    state: "fresh" | "stale" | "age_unknown" | "conflicting" | "unknown";
  };
  atStop:
    | { kind: "unavailable" }
    | {
        kind: "forecast";
        reading: CapacityReading;
        predictedFor: string;
        generatedAt: string;
        modelVersion: string;
        uncertainty: string;
      };
};
```

- `POST /api/capacity/resolve` accepts `{ agency, routeLabel, headsign, boardingStop: { name, lat, lng }, departureAt }`. Return `{ status: "matched" | "ambiguous" | "unavailable", candidates: [{ runKey, vehicleId, routeLabel, headsign, boardingStopId, expectedAtStop }] }`. A matched response has exactly one candidate; an unavailable response has none. This resolves an existing leg; it does not plan a route.
- `GET /api/capacity?runKey=...&boardingStopId=...` returns `CapacityCard` for a verified active run and stop. Pass through provider ETA; do not develop an ETA engine. A present vehicle with no occupancy returns a successful card with unknown capacity.
- Errors: `{ error: { code, message, retryable } }`. Use HTTP 400 for invalid input, 409 for invalid/expired run association, 429 for rate limits, and 503 when the provider is unavailable and no usable cached record exists. Do not mislabel a provider outage as an empty bus.
- `observedAt` is the occupancy measurement time, or null when unknown. BusTime vehicle `tmstmp` is the last positional update; prediction `tmstmp` is prediction generation time. Store these as `feedUpdatedAt`, never as occupancy measurement time or local fetch time. Label them "Feed updated" in the UI. A reported load with unknown measurement age uses `age_unknown`; retain the category but qualify its age. A fresh feed timestamp does not prove fresh occupancy. [BusTime guide](../DeveloperAPIGuide3_0.pdf), printed pp. 10, 26–27.
- Start with a 90-second stale threshold, a prototype constant to validate. An old feed or known old occupancy observation marks a reading stale; only a verified recent occupancy observation can mark it fresh. Missing load remains unknown; conflicting reports remain conflicting. Stale, conflicting, or unverified-age readings never imply guaranteed available room. Unknown provider codes remain unknown.
- Initial adapter mapping: EMPTY → low, HALF_EMPTY → some_space, FULL → full, N/A/missing/unrecognized → unknown. Retain the agency code. Numeric values require real numeric fields; never manufacture them from these categories or session counts.
- Ratio display is enabled only for verified count plus positive compatible capacity. With count alone, display the count and unknown total; with percentage/category alone, show that representation. Unsupported numbers are absent, not zero.

## Forecasting is a separate, later capability

Conceptually: occupancy at arrival = current occupancy + boardings − alightings before the rider's stop. GPS/ETA can identify the intervening time/stops; they do not supply those passenger flows. Current load cannot simply be relabeled a future prediction.

Only enable `atStop.kind = "forecast"` after obtaining suitable observations/history, defining the predicted event/time, and evaluating against held-out trips or observed arrivals. Compare with a last-reading baseline and disclose uncertainty. Otherwise return `unavailable` and show only the timestamped current load. Keep this out of the first capacity milestone.

## Runtime and verification

Poll our capacity endpoint about every five seconds; never translate each browser poll into a provider call. Coalesce upstream reads across clients at an initial 20-second cadence and bound requests to five seconds. Two provider requests every 20 seconds already consume 8,640 of the default 10,000 daily requests; budget across all routes, stops, and callers. Batch up to 10 stop IDs per `getpredictions` request, optionally filtered by route, or up to 10 vehicle IDs; do not combine `stpid` with `vid`. `getvehicles` accepts up to 10 vehicle IDs or route IDs, not both. Request `tmres=s`; predictions also support `unixTime=true` for UTC epoch milliseconds. These are guide capabilities, to verify against PRT. [BusTime guide](../DeveloperAPIGuide3_0.pdf), printed pp. 2, 9, 25–28.

Match cache/storage to the deployment model; process memory is not shared across serverless instances. Add shared Postgres when reports/history/shared cache require persistence, without queues or a separate orchestration service.

Keep API keys server-side. Planned settings: verified `PRT_API_BASE_URL`, required `PRT_API_KEY`, `GOOGLE_MAPS_API_KEY` for the server routing adapter when used, and `DATA_MODE`. Database settings are needed only if persistence is selected. Runtime pins, install/dev/check/deploy commands, credentials, and hosting are not configured yet. Publish actual commands when the scaffold exists.

Tests to implement: same-route buses do not share load; an ambiguous match stays unresolved; a trip change clears prior association; N/A and unknown codes never render empty; categorical data never becomes a numeric ratio; stale/failed feeds stay visible; a fresh prediction or GPS timestamp cannot establish fresh occupancy; browser polls share quota-bounded provider reads; phone sessions never become passenger counts; arrival forecasts stay unavailable without a predictor; selecting another journey selects its matched vehicle; live/demo data never mix. These are acceptance criteria, not tests already passed.
