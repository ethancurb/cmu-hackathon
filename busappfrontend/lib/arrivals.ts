"use client";

import { useEffect, useState } from "react";
import type { ArrivalTimes } from "@/app/api/arrival-times/route";

const POLL_MS = 20_000;

const CLOCK_FORMAT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

/** Formats a live prediction's epoch seconds as a clock time in PRT's own
 * timezone (Pittsburgh), not the viewer's local one — the two usually
 * match, but shouldn't silently drift if a demo runs from elsewhere. */
export function formatClockTime(epochSeconds: number): string {
  return CLOCK_FORMAT.format(new Date(epochSeconds * 1000));
}

/** Polls the server-side arrival-times endpoint (which itself coalesces
 * upstream PRT reads — see app/api/arrival-times/route.ts) for live
 * predictions at the three tracked routes' nearby stops. Returns null only
 * before the first response arrives; a transient poll failure after that
 * leaves the previous value in place rather than flashing to empty. */
export function useArrivalTimes(): ArrivalTimes | null {
  const [arrivals, setArrivals] = useState<ArrivalTimes | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/arrival-times");
        if (!res.ok) throw new Error(`arrival-times returned ${res.status}`);
        const data: ArrivalTimes = await res.json();
        if (!cancelled) setArrivals(data);
      } catch {
        // Leave whatever value is already showing — a dropped poll isn't
        // the same fact as the feed having no prediction.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return arrivals;
}
