"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type InsightCard = {
  id: string;
  label: string;
  title: string;
  summary?: string;
  meta?: string;
  icon: ReactNode;
  detail?: ReactNode;
  action?: () => void;
  actionLabel?: string;
  recommended?: boolean;
};

const focusRing = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

/** A swipeable row of square snapshots, with one optional detail panel. */
export function InsightCards({ cards, label, currentId }: { cards: InsightCard[]; label: string; currentId?: string | null }) {
  const row = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const detailId = useId();
  const active = cards.find((card) => card.id === expanded);

  function showCurrent() {
    const target = row.current?.querySelector<HTMLElement>('[aria-current="step"]');
    if (target && row.current) row.current.scrollTo({ left: target.offsetLeft - row.current.offsetLeft - 4, behavior: "instant" });
  }

  useEffect(() => {
    if (currentId) showCurrent();
  }, [currentId]);

  function scroll(direction: number) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.current?.scrollBy({ left: direction * 176, behavior: reduced ? "instant" : "smooth" });
  }

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        {currentId ? <button type="button" onClick={showCurrent} className={`text-footnote text-blue underline ${focusRing}`}>Back to current step</button> : <span className="text-footnote text-blue opacity-footnote">Swipe to explore · tap for more</span>}
        {cards.length > 1 ? (
          <div className="flex gap-1">
            <button type="button" aria-label={`Previous ${label}`} onClick={() => scroll(-1)} className={`h-8 w-8 border border-border-soft bg-surface text-blue ${focusRing}`}>←</button>
            <button type="button" aria-label={`Next ${label}`} onClick={() => scroll(1)} className={`h-8 w-8 border border-border-soft bg-surface text-blue ${focusRing}`}>→</button>
          </div>
        ) : null}
      </div>
      <div ref={row} role="region" aria-label={label} className="flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-3 pt-1">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            aria-label={`${card.label}: ${card.title}${card.actionLabel ? `, ${card.actionLabel}` : ""}`}
            aria-expanded={card.detail ? expanded === card.id : undefined}
            aria-controls={card.detail ? detailId : undefined}
            aria-current={card.id === currentId ? "step" : undefined}
            onClick={() => card.action ? card.action() : setExpanded((id) => id === card.id ? null : card.id)}
            className={cn("relative flex h-[168px] w-[168px] shrink-0 snap-start flex-col items-start border p-3 text-left text-blue", focusRing,
              card.recommended || expanded === card.id || card.id === currentId ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface",
              card.id === currentId && "border-[3px]")}
          >
            <span className="flex w-full items-center gap-2">
              <span aria-hidden className="shrink-0">{card.icon}</span>
              <span className="text-footnote uppercase tracking-wide">{card.label}</span>
              {card.recommended || card.id === currentId ? <span aria-hidden className="ml-auto h-2 w-2 shrink-0 bg-lime" /> : null}
            </span>
            <span className="mt-2 line-clamp-2 text-row-title font-bold leading-snug">{card.title}</span>
            {card.summary ? <span className="mt-1 line-clamp-2 text-body leading-snug opacity-footnote">{card.summary}</span> : null}
            <span className="mt-auto w-full pt-2 text-footnote">
              {card.meta ? <span className="block truncate opacity-footnote">{card.meta}</span> : null}
              <span className="block">{card.actionLabel ?? (expanded === card.id ? "Less −" : "Details →")}</span>
            </span>
          </button>
        ))}
      </div>
      <div id={detailId} hidden={!active?.detail}>
        {active?.detail ? (
          <div className="mb-2 border-l-2 border-border-soft py-1 pl-3 text-body text-blue">
            <p className="mb-1 font-bold">{active.title}</p>
            <div className="break-words opacity-footnote">{active.detail}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
