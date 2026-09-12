# LoadLine overnight report

## Approved direction
Nate approved predictive Transit Pressure on 2026-09-12 (#19). The model estimates relative travel demand/service pressure, never actual occupancy. This replaces the earlier capacity-first milestone while preserving maps, location search, visual tokens and reusable controls.

## Baseline
Clean natepaulo at 8bd5333. Existing `npm run lint` and production build passed. Foreground production server ready on port 3100. The earlier sandbox `spawn EPERM` was resolved with a foreground build outside the sandbox. No daemon/detachment attempted. Existing browser script expects obsolete fixture arrivals and needs replacement.

## Running decisions
- Deterministic model and source adapters; no LLM or new routing engine.
- Separate `/api/pressure` and `lib/pressure` contract, leaving capacity/Mongo tickets isolated.
- Existing seat estimates and mock planning claims must be removed from user-facing paths.
- Keep provider status and age separate from model confidence; missing events are not evidence of no events.
