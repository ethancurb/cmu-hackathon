import { ListRow } from "@/components/ListRow";
import { ROUTES, type RouteId } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/app-context";
import { ViewToggle } from "./ViewToggle";

type RouteListViewProps = {
  selectedRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
};

/** List-mode alternative to RouteMap: the same routes as ListRow rows, reusing
 * the existing primitive rather than a bespoke layout. No reference render
 * covers this mode — it's the same panel treatment as the map for consistency. */
export function RouteListView({ selectedRouteId, onSelectRoute, viewMode, onSetViewMode }: RouteListViewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded border border-border-soft bg-surface pb-[11px]">
      <ViewToggle viewMode={viewMode} onChange={onSetViewMode} />
      {/* Clears the ViewToggle's button (54px) + gap (3px) + indicator (8px),
          measured from its own 11px inset, plus a little breathing room. */}
      <div className="flex flex-col pt-[84px]">
        {ROUTES.map((route) => (
          <ListRow
            key={route.id}
            title={`${route.id} · ${route.scheduledTime}`}
            subtitle={route.seats}
            checked={route.id === selectedRouteId}
            onToggle={() => onSelectRoute(route.id)}
            onClick={() => onSelectRoute(route.id)}
            role="radio"
          />
        ))}
      </div>
    </div>
  );
}
