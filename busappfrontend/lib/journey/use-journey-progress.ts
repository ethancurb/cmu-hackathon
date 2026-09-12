"use client";

import { useEffect, useState } from "react";
import { journeyProgress, type JourneyFix } from "./progress";
import type { Journey } from "./types";

/** Local-only GPS updates, independent of the origin used for route searches.
 * watchPosition/clearWatch: https://www.w3.org/TR/geolocation/#watchposition-method */
export function useJourneyProgress(journey: Journey) {
  const [location, setLocation] = useState<{ fix: JourneyFix | null; unavailable: boolean }>({ fix: null, unavailable: false });
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    let watch: number | null = null;
    const updateClock = () => setNow(Date.now());
    const start = () => {
      updateClock();
      if (!navigator.geolocation) {
        setLocation({ fix: null, unavailable: true });
        return;
      }
      watch = navigator.geolocation.watchPosition((position) => {
        if (!alive) return;
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        setLocation({ fix: { lat, lng, accuracy, timestamp: position.timestamp }, unavailable: false });
        updateClock();
      }, () => {
        if (alive) setLocation({ fix: null, unavailable: true });
      }, { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 });
    };
    const visibility = () => {
      if (watch !== null) navigator.geolocation.clearWatch(watch);
      watch = null;
      setLocation({ fix: null, unavailable: false });
      if (!document.hidden) start();
    };
    // Start after mount; stop watching when the tab is hidden or the trip unmounts.
    const startup = window.setTimeout(() => { if (!document.hidden) start(); }, 0);
    const clock = window.setInterval(updateClock, 15_000);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      alive = false;
      window.clearTimeout(startup);
      window.clearInterval(clock);
      if (watch !== null) navigator.geolocation.clearWatch(watch);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  return now === null ? { status: "locating" as const, index: null } : journeyProgress(journey, location.fix, now, location.unavailable);
}
