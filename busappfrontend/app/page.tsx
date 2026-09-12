"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { LocationField } from "@/components/LocationField";
import { TimeRow } from "@/components/TimeRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BusIcon, WalkIcon } from "@/components/icons/filled";
import { ClockIcon } from "@/components/icons/stroked";
import { RouteMap } from "./RouteMap";
import { RouteListView } from "./RouteListView";
import { ArrivalCards } from "./ArrivalCards";
import { useAppState } from "@/lib/app-context";
import { ROUTES } from "@/lib/mock-data";
import { useArrivalTimes } from "@/lib/arrivals";
import { loadCachedDestination, saveCachedDestination } from "@/lib/destination-cache";
import type { AddressResult } from "@/lib/geocode";
import type { Destination } from "./MapCanvas";

const DEFAULT_LOCATION = "Morewood Avenue";

export default function HomePage() {
  const router = useRouter();
  const { selectedRouteId, setSelectedRouteId, departureTime, viewMode, setViewMode, weatherDismissed, dismissWeather } =
    useAppState();

  // Location editing isn't part of the shared app state (not in the STATE
  // list) — it's purely local to this screen.
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  // Only set once a real address is picked from the search dropdown — the
  // map falls back to its fixed decorative pin until then rather than
  // guessing a coordinate for freehand text.
  const [destination, setDestination] = useState<Destination>(null);
  const arrivals = useArrivalTimes();

  // Reads the cached address after mount, not during the initial render —
  // matching server and client on first paint avoids a hydration mismatch;
  // this swaps in a moment later if a prior search was cached.
  useEffect(() => {
    // Deferred a tick (rather than reading localStorage synchronously in
    // the effect body) to satisfy the set-state-in-effect lint rule —
    // matching the same pattern already used in lib/geocode.ts.
    queueMicrotask(() => {
      const cached = loadCachedDestination();
      if (cached) {
        setLocation(cached.label);
        setDestination({ lat: cached.lat, lng: cached.lng });
      }
    });
  }, []);

  function handleSelectAddress(address: AddressResult) {
    setDestination({ lat: address.lat, lng: address.lng });
    saveCachedDestination(address);
  }

  const selectedRoute = ROUTES.find((r) => r.id === selectedRouteId)!;
  const liveArrival = arrivals?.[selectedRouteId];

  return (
    <div className="mobile-screen home-screen flex min-h-dvh flex-col bg-canvas">
      <NavBar menuDisabled />

      <div className="mt-4 px-gutter">
        <LocationField value={location} onChange={setLocation} onSelectAddress={handleSelectAddress} />
      </div>

      <div className="mt-[14px]">
        <TimeRow left="Leave now" right={departureTime} onClick={() => router.push("/plan")} />
      </div>

      <div className="route-panel mt-4 px-gutter">
        {viewMode === "map" ? (
          <RouteMap
            activeRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            destination={destination}
            weatherDismissed={weatherDismissed}
            onDismissWeather={dismissWeather}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
          />
        ) : (
          <RouteListView
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            arrivals={arrivals}
          />
        )}
      </div>

      <div className={`mt-4 ${viewMode === "list" ? "list-arrivals" : ""}`}>
        <ArrivalCards selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} arrivals={arrivals} />
      </div>

      <div className="arrival-summary mt-3 flex items-center justify-between gap-3 px-gutter">
        <span className="flex items-center gap-2">
          <BusIcon className="h-4 w-4" />
          <span className="flex flex-col">
            <span className="text-emphasis-number font-bold text-blue">
              {liveArrival?.status === "live" ? `${liveArrival.minutesFromNow} min` : arrivals === null ? "…" : "—"}
            </span>
            <span className="text-descriptor text-blue">Bus arrives</span>
          </span>
        </span>
        {/* Right slot shows which real stop this prediction is for — not a
            fabricated on-time/delay judgment. PRT's live feed gives a
            predicted time, not a scheduled-vs-actual delta, so there's no
            verified "status" to report; the stop name is real and useful
            instead of leaving this side blank. */}
        <span className="min-w-0 flex items-center gap-2 text-right text-body text-blue">
          <ClockIcon className="h-4 w-4" />
          {liveArrival?.status === "live" ? liveArrival.stopName : "No live prediction"}
        </span>
      </div>

      <div className="mt-auto px-gutter pb-4 pt-4">
        <PrimaryButton
          label="Walk to stop"
          value={selectedRoute.walkTime}
          icon={<WalkIcon className="h-4 w-4" style={{ color: "var(--on-ink)" }} />}
        />
      </div>
    </div>
  );
}
