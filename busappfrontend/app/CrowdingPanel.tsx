import { occupancyHeadline, occupancyPeopleCaption, LOAD_LABEL } from "@/lib/crowding/display";
import type { CrowdingState } from "@/lib/crowding/use-crowding";

const CLOCK = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

export function CrowdingPanel({ state }: { state: CrowdingState }) {
  const nearest = state.current?.observations[0] ?? null;
  const latestHistory = state.history.slice(-3).reverse();
  const sourceBadge = state.current === null ? "Checking" : state.current.status === "unavailable" ? "Unavailable" : nearest?.passengerCount !== null || nearest?.passengerLoad ? "Live PRT" : "Not reported";
  const checkedAt = state.current?.fetchedAt ? CLOCK.format(new Date(state.current.fetchedAt)) : null;
  const headline =
    state.current === null
      ? "Checking PRT…"
      : state.current.status === "unavailable"
        ? "Feed unavailable"
        : occupancyHeadline({ passengerCount: nearest?.passengerCount ?? null, passengerLoad: nearest?.passengerLoad ?? null });

  return (
    <section className="rounded border border-border-soft bg-surface p-3" aria-labelledby="crowding-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id="crowding-title" className="text-label text-blue">People on the bus</p>
          <p className="mt-1 text-row-title font-bold text-ink-deep">{headline}</p>
        </div>
        <span className="whitespace-nowrap text-footnote uppercase tracking-loud text-blue">{sourceBadge}</span>
      </div>

      <p className="mt-1 text-descriptor text-blue">
        {nearest
          ? `Live occupancy · ${nearest.route} vehicle ${nearest.vehicleId} · ${nearest.etaLabel} to ${nearest.stopName}`
          : state.current?.message ?? "Loading the current PRT load."}
      </p>
      <p className="mt-1 text-footnote text-blue opacity-footnote">
        {checkedAt ? `Checked ${checkedAt} · ` : ""}
        {nearest
          ? occupancyPeopleCaption({ passengerCount: nearest.passengerCount, passengerLoad: nearest.passengerLoad })
          : "Current observation only. PRT does not timestamp the load measurement."}
      </p>

      <div className="mt-3 border-t border-border-soft pt-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-label text-blue">14-day rolling history</p>
          <span className="text-footnote text-blue opacity-footnote">{state.history.length} checks</span>
        </div>
        {latestHistory.length ? (
          <ul className="mt-1 space-y-1">
            {latestHistory.map((sample) => (
              <li key={`${sample.vehicleId}-${sample.fetchedAt}`} className="flex justify-between gap-2 text-footnote text-blue">
                <span>Vehicle {sample.vehicleId} · {LOAD_LABEL[sample.passengerLoad]}</span>
                <time dateTime={sample.fetchedAt} className="whitespace-nowrap opacity-footnote">{DATE.format(new Date(sample.fetchedAt))}, {CLOCK.format(new Date(sample.fetchedAt))}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-footnote text-blue opacity-footnote">Collection starts when PRT reports a category. Stored on this device while the app is in use.</p>
        )}
      </div>
    </section>
  );
}
