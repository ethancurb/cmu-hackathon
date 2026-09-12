# PRT data without API-key approval

Ethan's [issue #2](https://github.com/ethancurb/cmu-hackathon/issues/2) verifies the first data dependency. The team cannot wait for BusTime API approval during the hackathon. Use the public feed for bus identity/location; occupancy still needs a source.

## Run the diagnostic

Requires Node.js 22+; tested with 26.8.1. No package install, account, or API key is required.

```sh
node scripts/probe-prt.mjs
node --test scripts/probe-prt.test.mjs
```

The command makes one request, times out after eight seconds, and prints JSON containing physical vehicle IDs, trip/route IDs when present, positions, feed/position timestamps, and occupancy-field coverage. Missing occupancy remains null, and position timestamps never become occupancy observation times. An empty or failed feed cannot establish available room.

For saved **debug text** from the same endpoint, run `node scripts/probe-prt.mjs --file saved-debug-feed.txt`. This output is marked `mode: "file"`; it is not a live request.

## Evidence captured September 12, 2026

| Check | Observed result |
| --- | --- |
| Public feed, 04:27:28 UTC | HTTP 200; 172 vehicle entities; feed timestamp 04:27:13 UTC; zero occupancy status/percentage fields. |
| Script live run, 04:36:20 UTC | 168 valid vehicle records, zero rejected; feed timestamp 04:36:14 UTC; zero occupancy status/percentage fields. |
| BusTime `gettime` without a key | HTTP 200 with an embedded missing-key error. HTTP success alone does not prove API access. |
| `node --test scripts/probe-prt.test.mjs` | Eight tests passed: identity, missing/explicit occupancy, carriage isolation, invalid records, malformed feeds, key-free requests, failure handling, and CLI help. |

These are two overnight snapshots, not proof that all PRT feeds always omit occupancy. Vehicle access is verified; current capacity, Google journey matching, and a working user interface are not established by this probe.

## Proposed workaround for capacity

Keep Google for journey planning. Use public PRT vehicles to identify candidate buses. Let an onboard rider confirm the specific bus and report **seats available / standing room / full**. Associate each report with the physical vehicle and verified current run, record its observation time, and expire it; show unknown when evidence is absent or stale. A report is a rider observation, not a verified passenger count. Phone location can help select the bus but cannot count everyone onboard.

This is the next proposed product slice, not implemented by this diagnostic. Sparse participation and wrong-bus reports remain the main risks. A demo can show one device submitting a report and another seeing the update; label any simulated trip clearly. Forecasting at the boarding stop remains later work.

The script deliberately inspects PRT's current pretty-printed debug format. It is a feasibility tool, not a general protobuf parser, app contract, or production feed adapter. For the app, use a standard GTFS-realtime decoder and preserve optional-field presence; missing occupancy must not inherit an enum default of EMPTY.

Sources: [PRT developer resources](https://www.rideprt.org/business-center/developer-resources/), [official public-feed index](https://truetime.portauthority.org/gtfsrt-bus/), [vehicle debug endpoint](https://truetime.portauthority.org/gtfsrt-bus/vehicles?debug=), [GTFS-realtime vehicle reference](https://gtfs.org/documentation/realtime/reference/#message-vehicleposition). The existing [architecture](ARCHITECTURE.md) describes the capacity contract; these findings do not silently change its fields.
