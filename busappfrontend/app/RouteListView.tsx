import { ListRow } from "@/components/ListRow";
import { ROUTES, type RouteId } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/app-context";
import { formatClockTime } from "@/lib/arrivals";
import type { ArrivalTimes } from "@/app/api/arrival-times/route";
import type { Journey } from "@/lib/journey/types";
import { legDetail, legTitle } from "@/lib/journey/format";
import { ViewToggle } from "./ViewToggle";

type RouteListViewProps = {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  arrivals: ArrivalTimes | null;
  /** When a journey is selected, list mode shows its legs instead of the tracked routes. */
  journey?: Journey | null;
};

/** List-mode alternative to RouteMap: the selected journey's legs as rows, or —
 * before any trip exists — the three tracked routes with their live PRT times. */
export function RouteListView({ selectedRouteId, onSelectRoute, viewMode, onSetViewMode, arrivals, journey = null }: RouteListViewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded border border-border-soft bg-surface pb-[11px]">
      <ViewToggle viewMode={viewMode} onChange={onSetViewMode} />
      {/* Clears the ViewToggle's button (54px) + gap (3px) + indicator (8px),
          measured from its own 11px inset, plus a little breathing room. */}
      <div className="flex flex-col pt-[84px]">
        {journey
          ? journey.legs.map((leg, i) => (
              <ListRow key={i} title={legTitle(leg)} subtitle={legDetail(leg)} checked={leg.mode !== "WALK"} role="checkbox" />
            ))
          : ROUTES.map((route) => {
              const live = arrivals?.[route.id];
              const timeLabel = live?.status === "live" ? formatClockTime(live.epochSeconds) : arrivals === null ? "…" : "—";
              const subtitle = live?.status === "live" ? `${live.minutesFromNow} min · ${live.stopName}` : arrivals === null ? "Loading live prediction" : "No live trip in progress";
              return (
                <ListRow
                  key={route.id}
                  title={`${route.id} · ${timeLabel}`}
                  subtitle={subtitle}
                  checked={route.id === selectedRouteId}
                  onToggle={() => onSelectRoute(route.id)}
                  onClick={() => onSelectRoute(route.id)}
                  role="radio"
                />
              );
            })}
      </div>
    </div>
  );
}
