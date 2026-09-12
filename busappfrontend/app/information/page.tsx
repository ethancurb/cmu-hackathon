"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { Divider } from "@/components/Divider";
import { useAppState } from "@/lib/app-context";
import { useDeviceLocation } from "@/lib/geolocation";
import { usePressure } from "@/lib/pressure/use-pressure";
import { clock, sourcesSummary, confidenceNote } from "@/lib/pressure/format";
import { SCENARIO_DEFINITIONS } from "@/lib/pressure/demo";
import type { PressureResult } from "@/lib/pressure/types";

export default function InformationPage() {
  const router = useRouter();
  const { demo, destination, manualOrigin, departureAt, arriveBy, riderSignals } = useAppState();
  const device = useDeviceLocation();
  const scenario = demo ? SCENARIO_DEFINITIONS[demo.scenario] : null;
  const origin = scenario?.location ?? manualOrigin ?? device;
  const tripEnd = scenario?.destination ?? destination;
  const { data, loading, error } = usePressure({
    origin,
    destination: tripEnd,
    at: arriveBy ? null : departureAt,
    demo,
    riderSignals,
  });

  return (
    <div className="mobile-screen flex min-h-dvh flex-col bg-canvas">
      <NavBar backLabel="Home" onBack={() => router.push("/")} />
      <div className="flex flex-col gap-4 px-gutter pb-6 pt-4">
        <div>
          <h1 className="font-display text-wordmark text-ink">Information</h1>
          <p className="mt-2 text-body text-blue opacity-footnote">The data behind Transit Pressure, its freshness and what it can cover.</p>
        </div>
        <Divider />
        <section aria-labelledby="sources-heading" aria-live="polite" className="break-words">
          <h2 id="sources-heading" className="text-label text-blue">Sources</h2>
          {loading ? <p className="mt-2 text-body text-blue">Checking source availability…</p> : null}
          {error ? <p className="mt-2 text-body text-blue">{data ? "Refresh failed; showing the last result." : "Source information unavailable."} {error}</p> : null}
          {data ? (
            <>
              <p className="mt-2 text-body text-blue">{data.mode === "DEMO" ? "Demo · " : ""}{sourcesSummary(data.freshness)}</p>
              <p className="mb-3 mt-1 text-footnote text-blue opacity-footnote">{scenario ? scenario.location.label : manualOrigin?.label ?? (device.source === "device" ? "Your location" : "Carnegie Mellon (default)")}{tripEnd ? ` → ${tripEnd.label}` : ""} · model run {clock(data.generatedAt)}</p>
              <SourcesList data={data} note={confidenceNote(data.freshness)} />
            </>
          ) : null}
        </section>
        <Divider />
        <p className="text-footnote text-blue opacity-footnote">Transit Pressure is a heuristic 0–100 model index, not occupancy or a passenger count. Missing signals lower confidence. Estimated event end times are assumptions.</p>
      </div>
    </div>
  );
}

function SourcesList({ data, note }: { data: PressureResult; note: string | null }) {
  return (
    <div>
      {note ? <p className="text-footnote text-blue">{note}</p> : null}
      <ul className="mt-1 flex flex-col gap-1">
        {data.freshness.map((f) => (
          <li key={f.source} className="text-footnote text-blue">
            <span className="font-bold">{f.source}</span> · {f.status.toLowerCase()}
            {f.updatedAt ? ` · feed ${clock(f.updatedAt)}` : f.fetchedAt ? ` · ${clock(f.fetchedAt)}` : ""} · <span className="opacity-footnote">{f.detail}</span>
          </li>
        ))}
      </ul>
      {data.coverageGaps.length ? (
        <>
          <p className="mt-2 text-footnote text-blue">Not covered this run (absence is not evidence of quiet):</p>
          <ul className="flex flex-col">
            {data.coverageGaps.map((gap) => (
              <li key={gap} className="text-footnote text-blue opacity-footnote">
                · {gap}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-2 text-footnote text-blue opacity-footnote">{data.coverage}</p>
    </div>
  );
}
