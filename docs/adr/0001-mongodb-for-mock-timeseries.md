# ADR 0001 — MongoDB with time-series collections for the mock capacity store

Status: accepted, 2026-09-12.

## Context

The first milestone in [PROJECT](../PROJECT.md) requires a data source for per-bus capacity readings. Live PRT access is unverified (see [#2](https://github.com/ethancurb/cmu-hackathon/issues/2)); we are building against 100% invented data for the hackathon demo. [ARCHITECTURE](../ARCHITECTURE.md) previously recommended "shared Postgres persistence when reports or history require it." That baseline predates two decisions made in the design session:

1. **Discrete-stop event model.** The mock world is a series of `StopEvent`s (see [CONTEXT](../../CONTEXT.md)): one document per bus per stop, with `boardings`, `alightings`, and `occupancyAfter`. Time and identity are the primary access dimensions. This is a naturally timestamped, immutable event stream.
2. **Live-swap readiness.** The team wants the schema to accommodate real PRT data later without a migration. PRT emits capacity as a category (`EMPTY` / `HALF_EMPTY` / `FULL` / `N/A`) with feed and observation timestamps; our mock carries richer per-event counts. A single schema must hold both.

MongoDB is a sponsor at HackCMU 2026. This is a genuine consideration for the sponsor track but is not the driver of the technical choice — a data store that would not otherwise fit should not be adopted for a sponsor logo. The primary criterion is fit to the event model above.

## Decision

Use **MongoDB Atlas (M0 free tier)** with the following collections:

- `stops` — regular collection. One document per PRT stop.
- `runs` — regular collection. One document per bus run. Identified by opaque `runKey` per ARCHITECTURE.md.
- `stopEvents` — **time-series collection** (MongoDB 5.0+). `timeField: arrivalAt`; `metaField: metadata` where `metadata` includes `runId`, `stopId`, `routeLabel`, `vehicleId`, and `source: "mock" | "prt"`. Bucketing granularity: `seconds`.

Reads use `CapacitySource` (see [CONTEXT](../../CONTEXT.md)), which selects a concrete adapter (`MockMongoSource`, `PRTLiveSource`) from a `DATA_MODE` env var. Consumers never call MongoDB directly.

Every `StopEvent` document carries:
- `boardings`, `alightings`, `occupancyAfter` — numbers when authored by the mock, `null` when emitted by a live source that does not report them.
- `psgldCategory`, `psgldProviderValue` — populated when a source emits a category; the raw provider string is preserved verbatim.
- `observedAt`, `feedUpdatedAt` — the two timestamp facts from ARCHITECTURE.md's "Four different facts" table.

`runKey` uses the ARCHITECTURE-defined opaque scheme even for mock runs (e.g. `mock:71D:v9001:trip-a:2026-09-11`). Mock stop IDs use real PRT `stpid` values wherever they are known.

## Consequences

**Positive.**
- Time-series collection matches the event shape: `find` by `metadata.runId` within an `arrivalAt` window is O(log n) in event count. Standard index answers the arrivals query in one hop.
- Live PRT ingestion writes to the same collection with `source: "prt"`. No schema migration. `CapacitySource` swap is one env var.
- The scale argument to a judge is real, not incidental: at PRT-wide scale (~700 buses × one event every ~2 min ≈ 700k events/day) the collection remains index-bounded on the same read pattern.
- Sponsor track eligibility is a byproduct, not the reason.

**Negative.**
- Replaces the "Postgres when needed" line in PROJECT.md. Persistent-store choice is now MongoDB.
- Adds one dependency (`mongodb` driver), one env var (`MONGODB_URI`), and one setup step (Atlas project + M0 cluster + connection string).
- The team learns MongoDB semantics under time pressure. Mitigated by the small surface area: three collections, one index we explicitly create, one query shape from the API.
- No cross-collection joins at query time. At our scale this is a non-issue; `runs` and `stops` are read from memory after seed.

**What this replaces.**
- The optional Postgres path in PROJECT.md § "Decisions and next evidence."
- The "add shared Postgres when reports/history/shared cache require persistence" note in ARCHITECTURE.md § "Runtime and verification."

**Defensibility to a judge.**
- Show `db.stopEvents.getIndexes()` and `db.stopEvents.find(...).explain("executionStats")` on the demo laptop. The plan is a single IXSCAN on the metadata + time index.
- Explain the fit: timestamped, immutable events, high write volume, always queried by run + time window. This is textbook time-series-collection usage.
- Explain what the abstraction gives us: swapping in live PRT is a source-adapter change, not a schema change.

## Non-goals

- No live PRT ingestion in the current milestone. Its stub (`src/lib/sources/prt-live.ts`) exists as a documented no-op; wiring it is a future ticket.
- No cross-run analytics, aggregation pipelines, or materialised views. The read path is a single index scan per stop.
- No use of MongoDB features beyond the time-series collection and standard indexes.
