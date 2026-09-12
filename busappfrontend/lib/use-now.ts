"use client";

import { useEffect, useState } from "react";

const TICK_MS = 30_000;

/** The wall clock as React state (epoch ms), refreshed every 30 s. `null` until
 * mounted, so render stays pure and the server/client first paints agree. */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, []);
  return now;
}
