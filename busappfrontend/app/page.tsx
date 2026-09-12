"use client";

import { useState } from "react";
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
import type { AddressResult } from "@/lib/geocode";
import type { Destination } from "./MapCanvas";

export default function HomePage() {
  const router = useRouter();
  const { selectedRouteId, setSelectedRouteId, departureTime, viewMode, setViewMode, weatherDismissed, dismissWeather } =
    useAppState();

  // Location editing isn't part of the shared app state (not in the STATE
  // list) — it's purely local to this screen.
  const [location, setLocation] = useState("Morewood Avenue");
  // Only set once a real address is picked from the search dropdown — the
  // map falls back to its fixed decorative pin until then rather than
  // guessing a coordinate for freehand text.
  const [destination, setDestination] = useState<Destination>(null);

  const selectedRoute = ROUTES.find((r) => r.id === selectedRouteId)!;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <NavBar menuDisabled />

      <div className="mt-4 px-gutter">
        <LocationField
          value={location}
          onChange={setLocation}
          onSelectAddress={(address: AddressResult) => setDestination({ lat: address.lat, lng: address.lng })}
        />
      </div>

      <div className="mt-[14px]">
        <TimeRow left="Leave now" right={departureTime} onClick={() => router.push("/plan")} />
      </div>

      <div className="mt-4 px-gutter">
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
          />
        )}
      </div>

      <div className="mt-4">
        <ArrivalCards selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
      </div>

      <div className="mt-3 flex items-center justify-between px-gutter">
        <span className="flex items-center gap-2">
          <BusIcon className="h-4 w-4" />
          <span className="flex flex-col">
            <span className="text-emphasis-number font-bold text-blue">{selectedRoute.arrivesIn}</span>
            <span className="text-descriptor text-blue">Bus arrives</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-descriptor text-blue">
          <ClockIcon className="h-4 w-4" />
          {selectedRoute.status}
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
