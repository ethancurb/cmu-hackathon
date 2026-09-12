import { cn } from "@/lib/cn";
import { Badge } from "@/components/Badge";
import { SeatIcon } from "@/components/icons/filled";

type Card = {
  route: string;
  time: string;
  seats: string;
  selected?: boolean;
};

/**
 * Row of three equal-width cards, 16px gap (12px × 1.354). Unselected:
 * --surface fill, 1px --border-soft. Selected: --canvas fill, 1px
 * --ink-deep border, plus an 11px (8px × 1.354) --lime square inset in the
 * top-right corner.
 *
 * Time uses "emphasis-number" (solved). Capacity text uses "descriptor" — an
 * assumption, not an empirical solve: no target string was measured for it,
 * but it follows the same bold-value/regular-subtext pairing pattern that
 * "descriptor" was empirically confirmed for in the crowding chart, so it's
 * a reasoned extension rather than a guess pulled from nowhere. Flagged.
 */
export function ArrivalCards({ cards }: { cards: Card[] }) {
  return (
    <div>
      <div className="flex justify-between px-gutter">
        <span className="text-label text-blue">Arrival</span>
        <span className="text-label text-blue">Seats estimated</span>
      </div>
      <div className="mt-2 flex gap-4 px-gutter">
        {cards.map((card) => (
          <div
            key={card.route}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded border py-3",
              card.selected ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface"
            )}
          >
            {card.selected ? (
              <span className="absolute right-[11px] top-[11px] h-[11px] w-[11px] bg-lime" aria-hidden />
            ) : null}
            <Badge label={card.route} />
            <span className="text-emphasis-number font-bold text-blue">{card.time}</span>
            <span className="flex items-center gap-1">
              <SeatIcon className="h-4 w-4" />
              <span className="text-descriptor text-blue">{card.seats}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
