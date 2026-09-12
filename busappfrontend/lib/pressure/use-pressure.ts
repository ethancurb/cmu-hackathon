"use client";

import { useEffect, useMemo, useState } from "react";
import type { Point, PressureResult, RiderSignal } from "./types";
import type { DemoSelection } from "@/lib/app-context";

const LIVE_POLL_MS = 60_000;

export type PressureQuery = {
  origin: Point;
  destination: Point | null;
  /** Departure time (ISO) or null for now. */
  at: string | null;
  horizonMinutes?: number;
  demo: DemoSelection | null;
  /** Rider-reported causes; sent as a POST body and labeled unverified by the engine. */
  riderSignals?: RiderSignal[];
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

type Loaded = { key: string; data: PressureResult | null; error: string | null };

/** Fetches a PressureResult for the query; live queries re-poll every minute.
 * A failed refresh keeps the previous result visible and reports the error. */
export function usePressure(query: PressureQuery): PressureState {
  const url = pressureUrl(query);
  const isDemo = !!query.demo;
  const body = !isDemo && query.riderSignals?.length ? JSON.stringify({ riderSignals: query.riderSignals }) : null;
  const key = body ? `${url}#${body}` : url;
  const [loaded, setLoaded] = useState<Loaded>({ key: "", data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(url, body ? { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body } : { cache: "no-store" });
        const payload: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : `Pressure request failed (${res.status})`;
          throw new Error(message);
        }
        if (!cancelled) setLoaded({ key, data: payload as PressureResult, error: null });
      } catch (error) {
        if (!cancelled) setLoaded((prev) => ({ key, data: prev.data, error: error instanceof Error ? error.message : "Pressure unavailable" }));
      }
    }

    load();
    const interval = isDemo ? null : setInterval(load, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [url, body, key, isDemo]);

  return useMemo(() => ({ data: loaded.data, error: loaded.error, loading: loaded.key !== key }), [loaded, key]);
}
