import { occupancyHeadline, occupancyPeopleCaption } from "@/lib/crowding/display";
import type { OccupancyObservation } from "@/lib/pressure/types";

export function OccupancyLine({ occupancy }: { occupancy: OccupancyObservation }) {
  const headline = occupancyHeadline(occupancy);
  const caption = occupancyPeopleCaption(occupancy);
  const vehicle = occupancy.vehicleId ? `Vehicle ${occupancy.vehicleId}` : occupancy.route;
  const badge =
    occupancy.status === "DEMO" ? "Demo" : occupancy.status === "LIVE" || occupancy.category || occupancy.passengerCount !== null ? "Live PRT" : "Not reported";

  return (
    <div className="flex items-start justify-between gap-3 py-[9px]" aria-label="Live occupancy, people on the bus">
      <div className="min-w-0">
        <p className="text-label text-blue">People on the bus</p>
        <p className="mt-1 text-row-title font-bold text-ink-deep">{headline}</p>
        <p className="mt-1 text-footnote text-blue opacity-footnote">
          {caption}
          {occupancy.vehicleId || occupancy.stopName ? ` · ${vehicle}${occupancy.stopName ? ` · ${occupancy.route} ${occupancy.stopName}` : ""}${occupancy.etaLabel ? ` · ${occupancy.etaLabel}` : ""}` : ""}
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap text-footnote uppercase tracking-loud text-blue">{badge}</span>
    </div>
  );
}
