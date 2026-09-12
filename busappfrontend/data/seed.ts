/**
 * Drop and re-insert the demo world from data/fixture.ts. Idempotent: running it twice
 * leaves identical counts, because it drops before it writes.
 *
 *   npm run seed
 *
 * Creates `stopEvents` as a MongoDB time-series collection (ADR-0001). Time-series
 * collections must be created explicitly — an implicit insert would create a regular
 * collection and silently lose the property the whole storage argument rests on.
 */

import { fileURLToPath } from "node:url";

import type { CollectionInfo } from "mongodb";

import { COLLECTIONS, closeMongo, getDb } from "../lib/mongo.js";
import { EXPECTED_COUNTS, runs, stopEvents, stops } from "./fixture.js";

/** Load .env.local if present. Built into Node 20.12+; absent in older runtimes. */
function loadEnvLocal(): void {
  const loadEnvFile = (process as NodeJS.Process & {
    loadEnvFile?: (path: string) => void;
  }).loadEnvFile;

  if (typeof loadEnvFile !== "function") {
    console.warn("! process.loadEnvFile unavailable (Node < 20.12) — relying on the ambient env.");
    return;
  }
  try {
    loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url)));
  } catch {
    console.warn("! No busappfrontend/.env.local found — relying on the ambient env.");
  }
}

async function seed(): Promise<void> {
  loadEnvLocal();
  const db = await getDb();
  console.log(`Seeding database "${db.databaseName}"\n`);

  // Regular collections: deleteMany is enough and avoids churning indexes.
  await db.collection(COLLECTIONS.stops).deleteMany({});
  await db.collection(COLLECTIONS.runs).deleteMany({});
  await db.collection(COLLECTIONS.stops).insertMany(stops.map((s) => ({ ...s })));
  await db.collection(COLLECTIONS.runs).insertMany(runs.map((r) => ({ ...r })));

  // Time-series: drop the whole collection so it is always recreated with the right options.
  // A time-series collection cannot be converted in place if it was created as a regular one.
  const existing = await db.listCollections({ name: COLLECTIONS.stopEvents }).toArray();
  if (existing.length > 0) {
    await db.collection(COLLECTIONS.stopEvents).drop();
  }
  await db.createCollection(COLLECTIONS.stopEvents, {
    timeseries: {
      timeField: "arrivalAt",
      metaField: "metadata",
      granularity: "seconds",
    },
  });
  await db.collection(COLLECTIONS.stopEvents).insertMany(stopEvents.map((e) => ({ ...e })));

  // The auto-generated time-series index is on the whole `metadata` subdocument, which does
  // not serve equality predicates on sub-fields. Both read paths in MockMongoSource filter on
  // metadata.stopId / metadata.runId plus an arrivalAt range, so index those explicitly —
  // this is the "one index we explicitly create" ADR-0001 refers to.
  await db.collection(COLLECTIONS.stopEvents).createIndexes([
    { key: { "metadata.stopId": 1, arrivalAt: 1 }, name: "stopId_arrivalAt" },
    { key: { "metadata.runId": 1, arrivalAt: 1 }, name: "runId_arrivalAt" },
  ]);

  // Verify what actually landed rather than what we intended to write.
  const counts = {
    stops: await db.collection(COLLECTIONS.stops).countDocuments(),
    runs: await db.collection(COLLECTIONS.runs).countDocuments(),
    stopEvents: await db.collection(COLLECTIONS.stopEvents).countDocuments(),
  };

  console.log("Document counts");
  let mismatched = false;
  for (const [name, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = counts[name as keyof typeof counts];
    const ok = actual === expected;
    if (!ok) mismatched = true;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${name.padEnd(11)} ${actual} (expected ${expected})`);
  }

  const info = await db
    .listCollections<CollectionInfo>({ name: COLLECTIONS.stopEvents }, { nameOnly: false })
    .toArray();
  console.log(`\nstopEvents type: ${info[0]?.type ?? "unknown"}`);
  console.log(`stopEvents options: ${JSON.stringify(info[0]?.options?.timeseries ?? {})}`);

  console.log("\nstopEvents indexes");
  for (const index of await db.collection(COLLECTIONS.stopEvents).indexes()) {
    console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
  }

  if (mismatched) {
    throw new Error("Seed finished with unexpected document counts — see FAIL rows above.");
  }
  console.log("\nSeed complete.");
}

seed()
  .catch((error: unknown) => {
    console.error(`\nSeed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(closeMongo);
