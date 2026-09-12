import { cn } from "@/lib/cn";
import { Badge } from "@/components/Badge";
import { SeatIcon } from "@/components/icons/filled";
import { ROUTES, type RouteId } from "@/lib/mock-data";

type ArrivalCardsProps = {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
};

/**
 * Row of three equal-width cards, 16px gap (12px × 1.354). Unselected:
 * --surface fill, 1px --border-soft. Selected: --canvas fill, 1px
 * --ink-deep border, plus an 11px (8px × 1.354) --lime square inset in the
 * top-right corner. A radio group — exactly one route is selected.
 *
 * Time uses "emphasis-number" (solved). Capacity text uses "descriptor" — an
 * assumption, not an empirical solve: no target string was measured for it,
 * but it follows the same bold-value/regular-subtext pairing pattern that
 * "descriptor" was empirically confirmed for in the crowding chart, so it's
 * a reasoned extension rather than a guess pulled from nowhere. Flagged.
 */
export function ArrivalCards({ selectedRouteId, onSelectRoute }: ArrivalCardsProps) {
  return (
    <div>
      <div className="flex justify-between px-gutter">
        <span className="text-label text-blue">Arrival</span>
        <span className="text-label text-blue">Seats estimated</span>
      </div>
      <div role="radiogroup" aria-label="Select a route" className="mt-2 flex gap-4 px-gutter">
        {ROUTES.map((route) => {
          const selected = route.id === selectedRouteId;
          return (
            <button
              key={route.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Route ${route.id}, arrives ${route.scheduledTime}, ${route.seats}`}
              onClick={() => onSelectRoute(route.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded border py-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
                selected ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface"
              )}
            >
              {selected ? <span className="absolute right-[11px] top-[11px] h-[11px] w-[11px] bg-lime" aria-hidden /> : null}
              <Badge label={route.id} />
              <span className="text-emphasis-number font-bold text-blue">{route.scheduledTime}</span>
              <span className="flex items-center gap-1">
                <SeatIcon className="h-4 w-4" />
                <span className="text-descriptor text-blue">{route.seats}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
