"use client";

import { useEffect, useMemo, useState } from "react";
import type { Point, PressureResult } from "./types";
import type { DemoSelection } from "@/lib/app-context";

const LIVE_POLL_MS = 60_000;

export type PressureQuery = {
  origin: Point;
  destination: Point | null;
  /** Departure time (ISO) or null for now. */
  at: string | null;
  horizonMinutes?: number;
  demo: DemoSelection | null;
};

export type PressureState = {
  data: PressureResult | null;
  error: string | null;
  /** True until the first result for the current query arrives. */
  loading: boolean;
};

export function pressureUrl(q: PressureQuery): string {
  const params = new URLSearchParams();
  if (q.demo) {
    params.set("mode", "DEMO");
    params.set("scenario", q.demo.scenario);
    params.set("stage", String(q.demo.stage));
  } else {
    params.set("lat", q.origin.lat.toFixed(4));
    params.set("lng", q.origin.lng.toFixed(4));
    if (q.destination) {
      params.set("dlat", q.destination.lat.toFixed(4));
      params.set("dlng", q.destination.lng.toFixed(4));
    }
  }
  if (q.at) params.set("at", q.at);
  if (q.horizonMinutes) params.set("horizon", String(q.horizonMinutes));
  return `/api/pressure?${params.toString()}`;
}

type Loaded = { url: string; data: PressureResult | null; error: string | null };

/** Fetches a PressureResult for the query; live queries re-poll every minute.
 * A failed refresh keeps the previous result visible and reports the error. */
export function usePressure(query: PressureQuery): PressureState {
  const url = pressureUrl(query);
  const isDemo = !!query.demo;
  const [loaded, setLoaded] = useState<Loaded>({ url: "", data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const body: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : `Pressure request failed (${res.status})`;
          throw new Error(message);
        }
        if (!cancelled) setLoaded({ url, data: body as PressureResult, error: null });
      } catch (error) {
        if (!cancelled) setLoaded((prev) => ({ url, data: prev.data, error: error instanceof Error ? error.message : "Pressure unavailable" }));
      }
    }

    load();
    const interval = isDemo ? null : setInterval(load, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [url, isDemo]);

  return useMemo(
    () => ({ data: loaded.data, error: loaded.error, loading: loaded.url !== url }),
    [loaded, url]
  );
}
