import type { CrowdingState } from "@/lib/crowding/use-crowding";
import type { PassengerLoad } from "@/lib/crowding/types";

const LEVELS: PassengerLoad[] = ["not_crowded", "somewhat_crowded", "crowded"];

const LOAD_LABEL: Record<PassengerLoad, string> = {
  not_crowded: "Not crowded",
  somewhat_crowded: "Somewhat crowded",
  crowded: "Crowded",
};

const LOAD_COLOR: Record<PassengerLoad, string> = {
  not_crowded: "var(--pressure-low)",
  somewhat_crowded: "var(--pressure-moderate)",
  crowded: "var(--pressure-surge)",
};

/**
 * Verified PRT passenger-load category for 71B, shown as a filled bar with a
 * dot per level rather than a percentage — the feed reports one of three
 * categories, never a count or occupancy fraction (lib/crowding/types).
 */
export function CrowdingPanel({ state }: { state: CrowdingState }) {
  const nearest = state.current?.observations[0] ?? null;
  const level = nearest?.passengerLoad ?? null;
  const index = level ? LEVELS.indexOf(level) : -1;
  const color = level ? LOAD_COLOR[level] : "var(--border-soft)";
  const label =
    state.current === null ? "Checking…" : state.current.status === "unavailable" ? "Unavailable" : level ? LOAD_LABEL[level] : "Not reported";

  return (
    <div className="rounded border border-border-soft bg-surface px-3 py-2" aria-label={`71B passenger load: ${label}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-footnote uppercase tracking-loud text-blue">71B capacity</span>
        <span className="text-footnote font-bold" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="relative mt-[7px] h-[3px] rounded-full bg-border-soft">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
          style={{ width: index >= 0 ? `${((index + 1) / LEVELS.length) * 100}%` : "0%", backgroundColor: color }}
        />
        {LEVELS.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-canvas"
            style={{ left: `${((i + 1) / LEVELS.length) * 100}%`, backgroundColor: i <= index ? color : "var(--border-soft)" }}
          />
        ))}
      </div>
      <p className="mt-1 text-footnote text-blue opacity-footnote">Category only, not a passenger count.</p>
    </div>
  );
}
