import { IconToggle } from "@/components/IconToggle";
import { MapIcon, ListIcon, BusIcon } from "@/components/icons/filled";
import type { ViewMode } from "@/lib/app-context";

const INSET = 11;

/** Map/list/vehicle controls, shared by every visual view so switching stays in one place. */
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
        icon={<ListIcon className="h-[22px] w-[22px]" />}
        active={viewMode === "list"}
        onClick={() => onChange("list")}
        label="Route list"
      />
      <IconToggle
        icon={<BusIcon className="h-[22px] w-[22px]" />}
        active={viewMode === "vehicle"}
        onClick={() => onChange("vehicle")}
        label="Vehicle model"
      />
    </div>
  );
}
