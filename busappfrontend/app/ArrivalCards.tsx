import { cn } from "@/lib/cn";
import { Badge } from "@/components/Badge";
import { BusIcon } from "@/components/icons/filled";
import { ROUTES, type RouteId } from "@/lib/mock-data";
import { formatClockTime } from "@/lib/arrivals";
import type { ArrivalTimes } from "@/app/api/arrival-times/route";

type ArrivalCardsProps = {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  /** Live PRT predictions, or null before the first poll response arrives. */
  arrivals: ArrivalTimes | null;
  /** Hides the "Next bus / Live PRT" header when the parent already labels the section. */
  compact?: boolean;
};

/**
 * Row of three equal-width cards, one per tracked route. Unselected:
 * --surface fill, 1px --border-soft. Selected: --canvas fill, 1px --ink-deep
 * border, plus an 11px --lime square in the top-right corner. A radio group.
 *
 * Each card shows PRT's live predicted time and minutes-away for that route's
 * nearby stops, or an honest "—" when the feed has no trip in progress. No
 * seat or occupancy figure is shown anywhere: LoadLine has no passenger-count
 * source, and Transit Pressure (above) is a model index, not a load reading.
 */
export function ArrivalCards({ selectedRouteId, onSelectRoute, arrivals, compact = false }: ArrivalCardsProps) {
  return (
    <div>
      {!compact ? (
        <div className="flex justify-between px-gutter">
          <span className="text-label text-blue">Next bus</span>
          <span className="text-label text-blue">Live PRT</span>
        </div>
      ) : null}
      <div role="radiogroup" aria-label="Select a route" className={`arrival-cards flex gap-2 ${compact ? "" : "mt-2 px-gutter"}`}>
        {ROUTES.map((route) => {
          const selected = route.id === selectedRouteId;
          const live = arrivals?.[route.id];
          const timeLabel = live?.status === "live" ? formatClockTime(live.epochSeconds) : arrivals === null ? "…" : "—";
          const subLabel = live?.status === "live" ? `${live.minutesFromNow} min` : arrivals === null ? "loading" : "no live trip";
          const ariaTime = live?.status === "live" ? `arrives ${timeLabel}, in ${live.minutesFromNow} minutes` : "arrival time unavailable";
          return (
            <button
              key={route.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Route ${route.id}, ${ariaTime}`}
              onClick={() => onSelectRoute(route.id)}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded border py-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
                selected ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface"
              )}
            >
              {selected ? <span className="absolute right-[11px] top-[11px] h-[11px] w-[11px] bg-lime" aria-hidden /> : null}
              <Badge label={route.id} />
              <span className="text-emphasis-number font-bold text-blue">{timeLabel}</span>
              <span className="flex items-center gap-1">
                <BusIcon className="h-4 w-4" />
                <span className="text-descriptor text-blue">{subLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
