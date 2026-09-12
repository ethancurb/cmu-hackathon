/**
 * Write the fixture out as plain JSON for anyone who doesn't want to import TypeScript.
 *
 *   npm run export:json
 *
 * data/fixture.ts stays the source of truth — this file is generated, never hand-edited.
 * Dates serialise to ISO UTC strings.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { EXPECTED_COUNTS, SERVICE_DATE, TIMELINE_START, runs, stopEvents, stops } from "./fixture.js";

const out = fileURLToPath(new URL("./fixture.json", import.meta.url));

writeFileSync(
  out,
  JSON.stringify(
    {
      generatedFrom: "busappfrontend/data/fixture.ts",
      note: "Authored demo data. Not real PRT observations. Stop IDs are stpid-shaped placeholders.",
      serviceDate: SERVICE_DATE,
      timelineStart: TIMELINE_START.toISOString(),
      counts: EXPECTED_COUNTS,
      stops,
      runs,
      stopEvents,
    },
    null,
    2,
  ) + "\n",
);

console.log(`wrote ${out}`);
console.log(`  stops ${stops.length}  runs ${runs.length}  stopEvents ${stopEvents.length}`);
