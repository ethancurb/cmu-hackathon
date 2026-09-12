# Domain glossary

Shared vocabulary for the project. Terms are defined here; interfaces and field-level types live in [ARCHITECTURE](docs/ARCHITECTURE.md). Product decisions live in [PROJECT](docs/PROJECT.md). Architectural decisions live in [docs/adr](docs/adr/).

This file is a glossary only. It contains no implementation detail, no schema, no code.

## Active route

A route whose bus runs have authored `StopEvent`s in the mock world. Their capacity cards render with a populated `CapacityReading`. In the current build: 71D and 71A. See also **Shell route**.

## Boarding stop

The stop the rider will board the bus at. Distinct from the bus's current stop and from the rider's destination stop. The rider stands at their boarding stop; the bus travels through earlier stops on its route before arriving there.

## CapacityCard

The object presented to the rider describing one bus arrival's capacity state. Includes the current reading, its source, and observation age. Full field-level definition in ARCHITECTURE.md. A card is always labeled `mode: "live" | "demo"`; live and demo data never mix inside a single card.

## CapacityReading

The capacity value carried on a `CapacityCard`. May be a count (with total capacity), a percentage, a category (`low` / `some_space` / `full`), or `unknown`. Categorical values preserve the provider's raw string; a category is never converted to a numeric count.

## CapacitySource

The abstraction all consumers (arrivals API, commute agent, UI) read from. Hides whether the underlying data is mock, live PRT, or a mix. Selecting a source is a configuration decision, not a code change. Interface defined in ADR-0001.

## Commute agent

The AI role that decides for the rider and adapts to changing conditions. Given a rider destination and the current `simNow`, it reads the near-future `StopEvent` window across candidate runs, picks a plan (which bus to catch, from which stop), and emits a `Recommendation`. Re-runs on each state change; may revise the plan if a bus fills up. Introduced in ADR-0002.

## Feed updated at

The provider timestamp indicating when the source feed last emitted this record. Distinct from **Observed at**. A fresh feed timestamp does not imply fresh occupancy: the feed may be reporting an old measurement.

## Live mode

The application is reading from live PRT (or another agency) data. `CapacityCard.mode = "live"`. Not populated in the current build; reserved for the swap when live data becomes available.

## Mock mode

The application is reading from authored mock data. `CapacityCard.mode = "demo"`. All demo runs use this.

## Observed at

The time the occupancy was actually measured. Distinct from **Feed updated at**. May be unknown, in which case the card carries an `age_unknown` state.

## Recommendation

The commute agent's output for the rider. Names the action to take (which bus, from which stop, by when) and includes a short reasoning trace. Regenerated when relevant `StopEvent`s change. The recommendation card is the hero UI surface; the map is the canvas the plan is drawn on.

## Route

A named PRT service (e.g. 71D). A route label alone does not identify a specific bus; multiple runs can share a route label at the same time. Route labels are never treated as `Run` identifiers.

## Run

One bus's traversal of one route in one direction on one service date. The atomic unit of "a bus you might catch." Identified by an opaque `runKey` derived from provider + vehicle ID + trip ID + service date; the exact format is in ARCHITECTURE.md. Two adjacent 71Ds are two runs.

## Service date

The operating calendar day a run belongs to. May differ from wall-clock date across the midnight boundary; use the agency's service-day rule when it exists.

## Shell route

A route visible in the arrivals panel but with no authored data. Renders as `CapacityReading = { kind: "unknown" }` with `source: "none"`. Demonstrates the interface handles multi-route stops honestly. In the current build: 71B (paired with 71D) and 71C (paired with 71A).

## Sim clock

The presenter-driven controls (Play / Pause / Next stop / Reset) that advance `simNow` during the demo. Not a wall clock. See also **simNow**.

## simNow

The demo timeline's current instant. All mock-mode reads take `simNow` as an input; the API treats it as "now." Advances only when the presenter acts on the sim clock. There is no wall-clock notion of "now" in the mock data layer.

## Source

The origin of a `StopEvent`. Values: `mock` (authored), `prt` (real PRT feed). A field on every event so mixed reads can be filtered. Extensible to additional agencies later.

## StopEvent

The atomic mock-data unit. Records one bus's visit to one stop on one run: which run, which stop, arrival time, boardings, alightings, resulting occupancy. Mock events carry all fields; live PRT events carry only what the feed emits (typically a capacity category plus timestamps).
