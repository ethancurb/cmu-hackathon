"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { LEVEL_COLOR, LEVEL_WORD, clock, shortHour } from "@/lib/pressure/format";
import type { DemandPrediction, LowWindow, SurgeWindow } from "@/lib/pressure/types";

const CHART_HEIGHT = 97;
const BAR_GAP = 3;
const MARKER = 8;

type PressureTimelineProps = {
  timeline: DemandPrediction[];
  surge: SurgeWindow | null;
  bestWindow: LowWindow;
  selectedIndex: number;
  onSelect: (index: number) => void;
  caption: string;
};

/**
 * Upcoming Transit Pressure per 15-minute sample. Bars are colored by level
 * (low green → surge red); the selected sample carries the lime marker the
 * arrival cards already use for selection. A thin band above the chart marks
 * the surge span, and a bracket below marks the lowest-pressure window.
 * Each column is a full-height radio button (mouse/touch), and the group uses
 * a roving tabindex with arrow keys, Home and End for keyboard selection.
 */
export function PressureTimeline({ timeline, surge, bestWindow, selectedIndex, onSelect, caption }: PressureTimelineProps) {
  const selected = timeline[selectedIndex] ?? timeline[0];
  const n = timeline.length;
  const index = (at: string) => timeline.findIndex((p) => p.at === at);
  const surgeSpan = surge ? [index(surge.start), Math.max(index(surge.start), index(surge.end) - (surge.continues ? 0 : 1))] : null;
  const bestSpan = [index(bestWindow.start), Math.max(index(bestWindow.start), index(bestWindow.end))];
  const tickEvery = n > 20 ? 4 : n > 12 ? 4 : 2;
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(n - 1, selectedIndex + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, selectedIndex - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === null) return;
    e.preventDefault();
    onSelect(next);
    buttonsRef.current[next]?.focus();
  }

  return (
    <div className="flex flex-col items-center px-gutter">
      <p className="text-emphasis-number font-bold text-blue">{clock(selected.at)}</p>
      <p className="text-descriptor text-blue">
        <span style={{ color: LEVEL_COLOR[selected.level] }}>{LEVEL_WORD[selected.level]}</span> · {selected.score} / 100
      </p>

      {/* Surge band */}
      <div className="relative mt-3 h-[14px] w-full">
        {surgeSpan && surgeSpan[0] >= 0 ? (
          <div
            className="absolute top-0 flex h-full items-center justify-center text-footnote"
            style={{
              left: `${(surgeSpan[0] / n) * 100}%`,
              width: `${((surgeSpan[1] - surgeSpan[0] + 1) / n) * 100}%`,
              color: LEVEL_COLOR.SURGE,
              borderTop: `2px solid ${LEVEL_COLOR.SURGE}`,
            }}
          >
            surge
          </div>
        ) : null}
      </div>

      <div
        role="radiogroup"
        aria-label="Select a departure time"
        onKeyDown={onKeyDown}
        className="flex w-full items-end"
        style={{ height: CHART_HEIGHT, gap: BAR_GAP }}
      >
        {timeline.map((sample, i) => (
          <button
            key={sample.at}
            ref={(el) => {
              buttonsRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === selectedIndex}
            tabIndex={i === selectedIndex ? 0 : -1}
            aria-label={`${clock(sample.at)}, pressure ${sample.score} of 100, ${LEVEL_WORD[sample.level]}`}
            onClick={() => onSelect(i)}
            className="group flex h-full min-w-0 flex-1 flex-col justify-end outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <span
              aria-hidden
              className={cn("block w-full rounded-bar", i === selectedIndex ? "" : "opacity-70 group-hover:opacity-100")}
              style={{ height: Math.max(3, (sample.score / 100) * CHART_HEIGHT), background: LEVEL_COLOR[sample.level] }}
            />
          </button>
        ))}
      </div>

      <div className="h-px w-full bg-rule" />

      {/* Selection marker + best-window bracket */}
      <div className="relative mt-[4px] flex w-full" style={{ gap: BAR_GAP, height: MARKER }}>
        {timeline.map((sample, i) => (
          <span key={sample.at} className="relative min-w-0 flex-1">
            {i === selectedIndex ? <span aria-hidden className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 bg-lime" /> : null}
          </span>
        ))}
        {bestSpan[0] >= 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-[3px] border-x border-b border-blue"
            style={{ left: `${(bestSpan[0] / n) * 100}%`, width: `${((bestSpan[1] - bestSpan[0] + 1) / n) * 100}%` }}
          />
        ) : null}
      </div>

      <div className="mt-[3px] flex w-full" style={{ gap: BAR_GAP }}>
        {timeline.map((sample, i) => (
          <span key={sample.at} className="min-w-0 flex-1 text-center text-footnote text-blue">
            {i % tickEvery === 0 ? shortHour(sample.at) : ""}
          </span>
        ))}
      </div>

      <div className="mt-2 flex w-full items-center justify-between gap-3">
        <p className="text-body text-blue opacity-footnote">{caption}</p>
        <p className="shrink-0 text-footnote text-blue">
          <span aria-hidden className="mr-1 inline-block h-[3px] w-3 border-x border-b border-blue align-middle" />
          lowest window
        </p>
      </div>
    </div>
  );
}
