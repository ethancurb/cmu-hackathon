/**
 * Verification for T2 (#6). Exercises the CapacitySource contract against the seeded fixture.
 *
 *   npm run seed && npm run smoke:source
 *
 * Not a test framework — the milestone has no runner yet, and this needs to be runnable and
 * readable on the demo laptop. Exits non-zero if any check fails.
 */

import { fileURLToPath } from "node:url";

import { getCapacitySource, resolveDataMode } from "../lib/capacity-source.js";
import { closeMongo } from "../lib/mongo.js";
import { MockMemorySource } from "../lib/sources/mock-memory.js";
import { MockMongoSource } from "../lib/sources/mock-mongo.js";
import { PRTLiveSource } from "../lib/sources/prt-live.js";
import { TIMELINE_START } from "./fixture.js";

function loadEnvLocal(): void {
  const loadEnvFile = (process as NodeJS.Process & {
    loadEnvFile?: (path: string) => void;
  }).loadEnvFile;
  if (typeof loadEnvFile !== "function") return;
  try {
    loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url)));
  } catch {
    /* ambient env */
  }
}

let failures = 0;

function check(label: string, passed: boolean, detail = ""): void {
  if (!passed) failures += 1;
  console.log(`  ${passed ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const MOREWOOD = "7105"; // Fifth Ave & Morewood — the rider's boarding stop in the demo.
const NEVILLE = "7104";
const AIKEN = "7101";
const RUN_9001 = "mock:71D:v9001:trip-a:2026-09-12";

const minutes = (n: number) => new Date(TIMELINE_START.getTime() + n * 60_000);

async function main(): Promise<void> {
  loadEnvLocal();

  console.log("Factory");
  check('resolveDataMode("mock")', resolveDataMode("mock") === "mock");
  check("mock -> MockMemorySource (demo path)", getCapacitySource("mock") instanceof MockMemorySource);
  check("mongo -> MockMongoSource", getCapacitySource("mongo") instanceof MockMongoSource);
  check("live -> PRTLiveSource", getCapacitySource("live") instanceof PRTLiveSource);
  check("no DATA_MODE defaults to mock", getCapacitySource(undefined) instanceof MockMemorySource);

  let threwOnUnknown = false;
  try {
    getCapacitySource("nonsense");
  } catch {
    threwOnUnknown = true;
  }
  check("unknown DATA_MODE throws", threwOnUnknown);

  let threwOnHybrid = false;
  try {
    getCapacitySource("hybrid");
  } catch {
    threwOnHybrid = true;
  }
  check("hybrid throws (not implemented)", threwOnHybrid);

  console.log("\nPRTLiveSource (stub)");
  const live = new PRTLiveSource();
  check("arrivalsForStop returns []", (await live.arrivalsForStop(MOREWOOD, new Date())).length === 0);
  check("runFuture returns []", (await live.runFuture("anything", new Date())).length === 0);
  check("stop returns null", (await live.stop(MOREWOOD)) === null);

  // Exercises whichever source DATA_MODE selects, so the same checks prove either path.
  const mock = getCapacitySource();
  console.log(`\nsource under test: ${mock.name}`);

  console.log("\nstop lookup");
  const morewood = await mock.stop(MOREWOOD);
  check("Morewood resolves", morewood?.name === "Fifth Ave & Morewood Ave", morewood?.name);
  check(
    "routesServing includes the shell route 71B",
    morewood?.routesServing.includes("71D") === true && morewood?.routesServing.includes("71B") === true,
    JSON.stringify(morewood?.routesServing),
  );
  check("unknown stop resolves to null", (await mock.stop("9999")) === null);

  console.log("\narrivalsForStop — Morewood at timeline start");
  const arrivals = await mock.arrivalsForStop(MOREWOOD, TIMELINE_START);
  check("three 71D arrivals", arrivals.length === 3, `got ${arrivals.length}`);
  check(
    "ordered earliest first",
    arrivals.every(
      (a, i) => i === 0 || Date.parse(arrivals[i - 1].expectedAtStop) <= Date.parse(a.expectedAtStop),
    ),
  );
  check("all 71D", arrivals.every((a) => a.routeLabel === "71D"));
  check("first is vehicle 9001", arrivals[0]?.vehicleId === "9001", arrivals[0]?.vehicleId);

  console.log("\n  current observation is separate from the forecast");
  const bus9001 = arrivals[0];
  check(
    "9001 current = 14/60, observed at Aiken (the stop it has actually reached)",
    bus9001?.current.reading.kind === "count" &&
      bus9001.current.reading.passengers === 14 &&
      bus9001.current.observedAtStopId === AIKEN,
    `${JSON.stringify(bus9001?.current.reading)} @ ${bus9001?.current.observedAtStopId}`,
  );
  check(
    "9001 atStop = forecast of 56, not presented as observed",
    bus9001?.atStop.kind === "forecast" &&
      bus9001.atStop.reading.kind === "count" &&
      bus9001.atStop.reading.passengers === 56,
    JSON.stringify(bus9001?.atStop.kind === "forecast" ? bus9001.atStop.reading : bus9001?.atStop),
  );
  check(
    "current and forecast genuinely differ",
    bus9001?.current.reading.kind === "count" &&
      bus9001.atStop.kind === "forecast" &&
      bus9001.atStop.reading.kind === "count" &&
      bus9001.current.reading.passengers !== bus9001.atStop.reading.passengers,
  );

  console.log("\n  a run that has not started reports unknown, never zero");
  const notStarted = arrivals.filter((a) => a.current.observedAtStopId === null);
  check("9002 and 9003 have not reached any stop", notStarted.length === 2, `got ${notStarted.length}`);
  check(
    "their current reading is unknown with source none",
    notStarted.every((a) => a.current.reading.kind === "unknown" && a.current.source === "none"),
    JSON.stringify(notStarted.map((a) => [a.vehicleId, a.current.reading.kind, a.current.source])),
  );
  check(
    "no unknown reading carries a passenger count",
    notStarted.every((a) => !("passengers" in a.current.reading)),
  );

  console.log("\narrivalsForStop — Morewood 10 minutes in (9001 is already full)");
  const midway = await mock.arrivalsForStop(MOREWOOD, minutes(10));
  const midway9001 = midway.find((a) => a.vehicleId === "9001");
  check(
    "9001 current = 55/60 observed at Neville",
    midway9001?.current.reading.kind === "count" &&
      midway9001.current.reading.passengers === 55 &&
      midway9001.current.observedAtStopId === NEVILLE,
    `${JSON.stringify(midway9001?.current.reading)} @ ${midway9001?.current.observedAtStopId}`,
  );
  check("9001 current state is fresh", midway9001?.current.state === "fresh");
  check(
    "9002 has now started and reports a real count",
    midway.find((a) => a.vehicleId === "9002")?.current.reading.kind === "count",
  );

  console.log("\narrivalsForStop — simNow filtering and empty results");
  const late = await mock.arrivalsForStop(MOREWOOD, minutes(15));
  check(
    "past arrivals excluded",
    late.length < arrivals.length && late.every((a) => Date.parse(a.expectedAtStop) > minutes(15).getTime()),
    `${late.length} remain of ${arrivals.length}`,
  );
  check("unknown stop returns []", (await mock.arrivalsForStop("9999", TIMELINE_START)).length === 0);
  check("after the last bus returns []", (await mock.arrivalsForStop(MOREWOOD, minutes(600))).length === 0);

  console.log("\nrunFuture — 71D bus 9001");
  const future = await mock.runFuture(RUN_9001, TIMELINE_START);
  check("four remaining stops", future.length === 4, `got ${future.length}`);
  check(
    "ordered and strictly after `from`",
    future.every(
      (e, i) =>
        e.arrivalAt.getTime() > TIMELINE_START.getTime() &&
        (i === 0 || future[i - 1].arrivalAt.getTime() <= e.arrivalAt.getTime()),
    ),
  );
  check(
    "occupancy climbs 31 -> 56 and ends full",
    future[0]?.occupancyAfter === 31 &&
      future.at(-1)?.occupancyAfter === 56 &&
      future.at(-1)?.psgldCategory === "full",
    future.map((e) => e.occupancyAfter).join(" -> "),
  );
  check("runFuture respects `from`", (await mock.runFuture(RUN_9001, minutes(10))).length === 1);
  check("unknown run returns []", (await mock.runFuture("mock:71X:v0:trip-z:2026-09-12", TIMELINE_START)).length === 0);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(`\nSmoke run failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(closeMongo);
