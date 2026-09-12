"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JOURNEY_DEFAULTS, type Journey, type JourneyResponse, type LatLng } from "./types.ts";

const NOW_POLL_MS = 60_000;

export type JourneyQuery = {
  from: LatLng | null;
  to: LatLng | null;
  /** ISO time, or null for "leave now". */
  at: string | null;
  arriveBy: boolean;
  maxWalkMinutes: number;
  maxTransfers: number | null;
};

export type JourneyState = {
  data: JourneyResponse | null;
  /** True until the first response for the current query arrives. */
  loading: boolean;
  error: string | null;
  /** Re-runs the current query (used by "Leave now", whose URL does not change). */
  refresh: () => void;
};

export function journeyUrl(q: JourneyQuery): string | null {
  if (!q.from || !q.to) return null;
  const params = new URLSearchParams({
    flat: q.from.lat.toFixed(5),
    flng: q.from.lng.toFixed(5),
    tlat: q.to.lat.toFixed(5),
    tlng: q.to.lng.toFixed(5),
  });
  if (q.at) params.set("at", q.at);
  if (q.arriveBy) params.set("arriveBy", "1");
  if (q.maxWalkMinutes !== JOURNEY_DEFAULTS.maxWalkMinutes) params.set("maxWalk", String(q.maxWalkMinutes));
  if (q.maxTransfers !== null) params.set("maxTransfers", String(q.maxTransfers));
  return `/api/journey?${params.toString()}`;
}

export type Loaded = { url: string; seq: number; data: JourneyResponse | null; error: string | null };

/** Pure "latest request wins" rule: a response is applied only when it belongs
 * to the most recent request, so a slow older search never overwrites a newer
 * selection. Exported for tests. */
export function acceptResponse(prev: Loaded, incoming: Loaded, latestSeq: number): Loaded {
  if (incoming.seq !== latestSeq) return prev;
  if (incoming.error && !incoming.data) return { ...incoming, data: prev.url === incoming.url ? prev.data : null };
  return incoming;
}

/** The journey to show for a selection: the selected id when it is still in the
 * fresh result, else the first option. Exported for tests. */
export function pickJourney(journeys: Journey[], selectedId: string | null): Journey | null {
  return journeys.find((j) => j.id === selectedId) ?? journeys[0] ?? null;
}

export function useJourneys(query: JourneyQuery): JourneyState {
  const url = journeyUrl(query);
  const isNow = query.at === null;
  const [loaded, setLoaded] = useState<Loaded>({ url: "", seq: 0, data: null, error: null });
  const [tick, setTick] = useState(0);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!url) return;
    const seq = ++seqRef.current;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(url!, { cache: "no-store", signal: controller.signal });
        const body = (await res.json().catch(() => null)) as JourneyResponse | null;
        if (!body || typeof body !== "object" || !("status" in body)) throw new Error(`Routing request failed (${res.status})`);
        const error = body.status === "error" ? body.error : null;
        setLoaded((prev) => acceptResponse(prev, { url: url!, seq, data: body.status === "error" ? null : body, error }, seqRef.current));
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Routing unavailable";
        setLoaded((prev) => acceptResponse(prev, { url: url!, seq, data: null, error: message }, seqRef.current));
      }
    }

    load();
    const interval = isNow ? setInterval(() => setTick((t) => t + 1), NOW_POLL_MS) : null;
    return () => {
      controller.abort();
      if (interval) clearInterval(interval);
    };
  }, [url, isNow, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return useMemo(
    () => ({
      data: url ? loaded.data : null,
      error: url ? loaded.error : null,
      loading: !!url && loaded.url !== url,
      refresh,
    }),
    [loaded, url, refresh],
  );
}
