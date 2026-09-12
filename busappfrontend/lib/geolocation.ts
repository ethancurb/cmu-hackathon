"use client";

import { useEffect, useState } from "react";

/** CMU's Oakland, Pittsburgh campus — used only when the browser can't (or
 * won't) supply a real device position. Matches "Morewood Avenue" already
 * shown in the mock location field. */
export const CMU_FALLBACK = { lat: 40.4443, lng: -79.9428 } as const;

export type LocationResult = {
  lat: number;
  lng: number;
  source: "device" | "fallback";
};

/** Requests the rider's real position via the browser Geolocation API and
 * falls back to CMU_FALLBACK when permission is denied, the API times out,
 * or the page isn't in a secure context. Never blocks initial render — the
 * fallback is the first value returned. */
export function useDeviceLocation(): LocationResult {
  const [location, setLocation] = useState<LocationResult>({ ...CMU_FALLBACK, source: "fallback" });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "device" });
      },
      () => {
        // Denied, unavailable, or timed out — the fallback set above stands.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
