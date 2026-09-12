import { IconToggle } from "@/components/IconToggle";
import { MapIcon, BusIcon } from "@/components/icons/filled";
import type { ViewMode } from "@/lib/app-context";

const INSET = 11;

/** Map/list icon-toggle pair, shared by RouteMap and RouteListView so both render it identically. */
export function ViewToggle({ viewMode, onChange }: { viewMode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="absolute flex" style={{ right: INSET, top: INSET, gap: 3 }}>
      <IconToggle
        icon={<MapIcon className="h-[22px] w-[22px]" />}
        active={viewMode === "map"}
        onClick={() => onChange("map")}
        label="Map view"
      />
      <IconToggle
        icon={<BusIcon className="h-[22px] w-[22px]" />}
        active={viewMode === "list"}
        onClick={() => onChange("list")}
        label="List view"
      />
    </div>
  );
}
