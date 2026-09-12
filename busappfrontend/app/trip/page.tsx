import { NavBar } from "@/components/NavBar";
import { LocationField } from "@/components/LocationField";
import { TimeRow } from "@/components/TimeRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BusIcon, WalkIcon } from "@/components/icons/filled";
import { ClockIcon } from "@/components/icons/stroked";
import { RouteMap } from "./RouteMap";
import { ArrivalCards } from "./ArrivalCards";

const CARDS = [
  { route: "71", time: "8:46", seats: "17 free" },
  { route: "61", time: "8:49", seats: "6 free", selected: true },
  { route: "54", time: "8:55", seats: "24 free" },
];

export default function TripPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <NavBar />

      <div className="mt-4 px-gutter">
        <LocationField value="Morewood Avenue" />
      </div>

      <div className="mt-[14px]">
        <TimeRow left="Leave now" right="By 9:00" />
      </div>

      <div className="mt-4 px-gutter">
        <RouteMap />
      </div>

      <div className="mt-4">
        <ArrivalCards cards={CARDS} />
      </div>

      <div className="mt-3 flex items-center justify-between px-gutter">
        <span className="flex items-center gap-2">
          <BusIcon className="h-4 w-4" />
          <span className="flex flex-col">
            <span className="text-emphasis-number font-bold text-blue">2 min</span>
            <span className="text-descriptor text-blue">Bus arrives</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-descriptor text-blue">
          <ClockIcon className="h-4 w-4" />
          3 min late
        </span>
      </div>

      <div className="mt-auto px-gutter pb-4 pt-4">
        <PrimaryButton
          label="Walk to stop"
          value="1 min"
          icon={<WalkIcon className="h-4 w-4" style={{ color: "var(--on-ink)" }} />}
        />
      </div>
    </div>
  );
}
