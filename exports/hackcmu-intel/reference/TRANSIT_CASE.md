# Prior transit project: evidence and limits

Optional reference, not the replacement project's architecture. This is a snapshot of what the source session actually established through September 12, 2026. It separates documentation, observed requests, and proposed work. Recheck anything reused.

## Problem and scope

The team reported that full Pittsburgh Regional Transit buses sometimes pass waiting riders. The intended addition was current capacity for the specific bus in an existing journey, with capacity at the boarding stop considered later. The user wanted to reuse route/walking/arrival information, not implement another general journey planner.

The frequency of pass-ups and any real-world time savings were not measured. A route label such as 71D can identify multiple physical buses. Vehicle identity, trip/run identity, total capacity, current occupancy, and occupancy at a future stop are separate facts.

## Verified public access

Source endpoints: [public feed index](https://truetime.portauthority.org/gtfsrt-bus/), [vehicle debug feed](https://truetime.portauthority.org/gtfsrt-bus/vehicles?debug=), [trip-update debug feed](https://truetime.portauthority.org/gtfsrt-bus/trips?debug=). They are linked from [PRT developer resources](https://www.rideprt.org/business-center/developer-resources/).

| Session observation, UTC | Result | Limit |
| --- | --- | --- |
| 2026-09-12 04:27:28 | Public vehicle feed HTTP 200; 172 entities; zero occupancy status/percentage fields | One overnight snapshot |
| 2026-09-12 04:36:20 | Public vehicle diagnostic: 168 valid records, no rejected records, zero occupancy fields | Identity/location access, not occupancy acquisition |
| 2026-09-12 05:35:49 | Public vehicle feed: 100 valid records, zero occupancy fields; feed updated 05:35:20 | Does not establish that every PRT interface omits load |
| 2026-09-12 06:20:02 | Public trip feed HTTP 200; feed age about 22 seconds; a fresh 71B update associated vehicle 6733, trip 13228020, stop 3262, and arrival 06:20:12 | A specific vehicle/stop timing sample, not citywide coverage or a complete planner |
| Earlier unauthenticated BusTime `gettime` check | HTTP 200 carried an embedded missing-API-key error | Transport success did not establish API access |

The public feed requests needed no account/key. These observations do not guarantee future uptime, populated fields on every trip, or permission terms beyond the publisher's actual license. Feed freshness is not evidence that any missing occupancy was measured.

The old repo contains a dependency-free vehicle diagnostic and eight passing tests at source revision `f81be93670964068cb509ceeda84d1e227623d24`. It inspects the provider's debug-text format; it is not a production protobuf decoder or an implemented application. No diagnostic code is installed by this export.

## PRT capacity and passenger counters

- [Room2Ride](https://www.rideprt.org/room2ride/) describes historical crowding from a rolling two weeks of trips, refreshed weekly. It distinguishes that from live data and points to TrueTime for real-time capacity. We did not verify current crowding coverage for the target buses in the TrueTime UI.
- The same page says PRT's bus fleet has door-mounted automatic passenger counters that count boarding and exiting passengers. This establishes the agency's stated collection method, not direct public access to the sensors.
- PRT explicitly offers raw APC ridership datasets on request through its [performance/data page](https://www.rideprt.org/inside-Pittsburgh-Regional-Transit/transparency/performance-metrics-and-system-data/). No response time or live-stream availability was promised there.
- The supplied [BusTime v3 guide](https://realtime.portauthority.org/bustime/apidoc/docs/DeveloperAPIGuide3_0.pdf) documents `psgld` for vehicles and predictions: FULL, HALF_EMPTY, EMPTY, N/A. Thresholds are agency-defined; N/A is unknown. These are categories, not exact passenger counts. An approved key is required, and the guide gives a default 10,000 requests/key/day. PRT's authenticated load population and actual account configuration were not tested.
- A `getpredictions` load field is current occupancy, not an occupancy prediction at the rider's stop. Prediction/GPS timestamps are not automatically occupancy-observation timestamps.

These sources corrected an overly broad inference from the first empty-occupancy samples. Do not say "PRT has no capacity information" on this evidence. Equally, do not say "we have live passenger counts" because an official page describes counters.

## Existing alternatives

[Transit](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line) documents agency-sourced and rider-reported crowding where supported. Its [partner documentation](https://resources.transitapp.com/article/274-show-real-time-vehicle-crowding-in-transit) also describes predictions at the boarding stop using historical and real-time data. PRT advertises [Transit integration](https://www.rideprt.org/GoMobile).

Current feature coverage on the exact Pittsburgh routes was not verified. The existence of these documented mechanisms still undermined a claim that showing or predicting fullness itself was a new invention. A meaningful local usability/data gap could remain, but needed proof.

## Google and the base layer

[Google Routes transit routing](https://developers.google.com/maps/documentation/routes/transit-route) can supply walking/transit legs, boarding/alighting stops, line/headsign details, and timing; the documented transit vehicle information does not supply a PRT fleet identifier. Joining to a physical bus is a separate problem. Alternative routes are not the same as a complete stop departure board.

Application integration requires the relevant API setup and [billing/access configuration](https://developers.google.com/maps/documentation/routes/usage-and-billing). The consumer Google Maps app does not automatically hand its selected journey to another app. Any reuse of Google results must follow its actual [display/caching policies](https://developers.google.com/maps/documentation/routes/policies).

Public PRT trip updates offered a key-free path to observed bus timing. Static GTFS supplies schedule/route/stop context; assembling origin/destination/walking journeys still requires work. For a narrow prototype, authored route scenarios were a reasonable alternative to a general planner, with their source disclosed.

## Architecture ideas that were proposed, not established by the probe

Current-capacity cards, rider reports, phone-assisted vehicle matching, occupancy prediction, deadline-aware replanning, coordinated passengers, surge simulations, transfer recovery, and a camera counter were explored. GPS participation alone could not count every passenger. A current category could not become an exact ratio, and an authored future value could not become a validated forecast.

At export, published `alex` revision `397730f3edd50470eeda7863234563c88758303e` contained design decisions for a MongoDB mock event store and a deterministic commute planner with an LLM explainer. Source main was `44900bd7b5423c63240c5d05563c53f4a6d987d1`. These branch decisions were reviewed as context, not adopted for the new project or independently verified as working code.

A shared `CapacitySource` interface was a useful proposed boundary, but a live provider missing the richer mock fields would still require changed behavior, missing-value handling, and evaluation. A source switch alone cannot supply absent boarding/alighting counts or future observations. A planner's score and a template/LLM explanation are separate contributions.

## Generalizable conclusion

Retain early dependency probes, correct identity, source semantics, meaningful uncertainty, and a working input-to-result loop. Test novelty and the data needed for that loop before large parallel implementation. The revised project's core mechanism must stand on its own; this case does not mandate keeping transit, Google, MongoDB, or any brainstormed expansion.
