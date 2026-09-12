"use client";

import { useEffect, useRef, useState } from "react";
import { CloseXIcon } from "@/components/icons/stroked";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Select } from "@/components/Select";
import { cn } from "@/lib/cn";
import { localDate, localHourMinute, localToIso, shiftDays } from "@/lib/chat/time";

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";
const MODES = ["Leave at", "Arrive by"] as const;
const DAYS = ["Today", "Tomorrow"] as const;

type TimeSheetProps = {
  onClose: () => void;
  /** null = leave now. */
  departureAt: string | null;
  arriveBy: boolean;
  onApply: (at: string | null, arriveBy: boolean) => void;
};

function initialState(departureAt: string | null, arriveBy: boolean) {
  const at = departureAt ?? new Date().toISOString();
  const day: (typeof DAYS)[number] = localDate(new Date(at)) === localDate(new Date()) ? "Today" : "Tomorrow";
  const { hour, minute } = localHourMinute(at);
  return { mode: (arriveBy ? "Arrive by" : "Leave at") as (typeof MODES)[number], day, time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

/**
 * Direct clock-time control for the home screen's time row. Mounted only
 * while open (the caller renders it conditionally), so its form always seeds
 * fresh from the current trip time with no reset effect needed. "Arrive by"
 * sets the shared arriveBy flag (lib/app-context), which lib/journey already
 * threads to the provider as a real arrival deadline — the itinerary search
 * then returns the trip that gets there by that time, not just the earliest one.
 */
export function TimeSheet({ onClose, departureAt, arriveBy, onApply }: TimeSheetProps) {
  const [{ mode: initialMode, day: initialDay, time: initialTime }] = useState(() => initialState(departureAt, arriveBy));
  const [mode, setMode] = useState(initialMode);
  const [day, setDay] = useState(initialDay);
  const [time, setTime] = useState(initialTime);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  function apply() {
    const [h, m] = time.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;
    const date = day === "Tomorrow" ? shiftDays(localDate(new Date()), 1) : localDate(new Date());
    onApply(localToIso(date, h, m), mode === "Arrive by");
    onClose();
  }

  function leaveNow() {
    onApply(null, false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-gutter" role="presentation">
      <button type="button" aria-label="Close time picker" onClick={onClose} className="absolute inset-0 bg-ink-deep/30 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label="Choose a time" className="relative flex w-full max-w-[360px] flex-col rounded border border-border-soft bg-canvas">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-gutter py-3">
          <span className="font-display text-wordmark text-ink">Choose a time</span>
          <button type="button" onClick={onClose} aria-label="Close" className={`flex shrink-0 items-center text-blue ${FOCUS_RING}`}>
            <CloseXIcon className="h-[19px] w-[19px]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-gutter py-3">
          <div role="radiogroup" aria-label="Time mode" className="flex gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded border px-3 py-[9px] text-center text-body font-bold text-blue",
                  mode === m ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface",
                  FOCUS_RING
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex gap-[11px]">
            <div className="min-w-0 flex-1">
              <Select value={day} options={[...DAYS]} onChange={(v) => setDay(v as (typeof DAYS)[number])} variant="primary" label="Day" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex h-control items-center rounded border border-border bg-surface px-4 text-descriptor text-blue">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-label="Time"
                  className={cn("w-full min-w-0 bg-transparent outline-none", FOCUS_RING)}
                />
              </div>
            </div>
          </div>

          <p className="text-footnote text-blue opacity-footnote">
            {mode === "Arrive by"
              ? "Finds the trip that gets you there by this time."
              : "Finds the trip leaving at this time."}
          </p>
        </div>

        <div className="flex flex-col gap-2 px-gutter pb-4">
          <PrimaryButton label={mode === "Arrive by" ? "Set arrival time" : "Set departure time"} onClick={apply} disabled={!time} />
          {departureAt ? (
            <button type="button" onClick={leaveNow} className={`text-center text-footnote text-blue underline ${FOCUS_RING}`}>
              Leave now instead
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
