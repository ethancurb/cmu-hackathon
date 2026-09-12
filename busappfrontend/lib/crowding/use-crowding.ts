"use client";

import { useEffect, useState } from "react";
import { HISTORY_KEY, parseHistory, updateHistory } from "./history";
import type { CrowdingHistorySample, CrowdingResponse } from "./types";

const POLL_MS = 20_000;

export type CrowdingState = {
  current: CrowdingResponse | null;
  history: CrowdingHistorySample[];
};

export function useCrowding(): CrowdingState {
  const [current, setCurrent] = useState<CrowdingResponse | null>(null);
  const [history, setHistory] = useState<CrowdingHistorySample[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHistory(parseHistory(window.localStorage.getItem(HISTORY_KEY)));
      } catch {
        // Private browsing may deny even reads; live data should still render.
      }
    });
    let cancelled = false;
    const controller = new AbortController();

    async function poll() {
      try {
        const response = await fetch("/api/crowding", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error(`crowding returned ${response.status}`);
        const data = (await response.json()) as CrowdingResponse;
        if (cancelled) return;
        setCurrent(data);
        if (data.status !== "live") return;
        setHistory((previous) => {
          const next = updateHistory(previous, data.observations);
          try {
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
          } catch {
            // The live reading remains useful when private mode or storage quota blocks history.
          }
          return next;
        });
      } catch {
        if (cancelled) return;
        setCurrent({ status: "unavailable", fetchedAt: null, observations: [], source: null, message: "PRT passenger-load data is unavailable right now." });
      }
    }

    void poll();
    const interval = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  return { current, history };
}
