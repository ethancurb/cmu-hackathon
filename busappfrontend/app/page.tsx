"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { LocationField } from "@/components/LocationField";
import { TimeRow } from "@/components/TimeRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ClockIcon } from "@/components/icons/stroked";
import { RouteMap } from "./RouteMap";
import { RouteListView } from "./RouteListView";
import { ArrivalCards } from "./ArrivalCards";
import { PressureModule } from "./PressureModule";
import { DemoBar } from "./DemoBar";
import { useAppState, type DemoSelection } from "@/lib/app-context";
import { useArrivalTimes } from "@/lib/arrivals";
import { useDeviceLocation } from "@/lib/geolocation";
import { usePressure } from "@/lib/pressure/use-pressure";
import { SCENARIOS, SCENARIO_DEFINITIONS, stageCount, type Scenario } from "@/lib/pressure/demo";
import { clock, weekdayShort, buttonLabel } from "@/lib/pressure/format";
import { loadCachedDestination, saveCachedDestination } from "@/lib/destination-cache";
import type { AddressResult } from "@/lib/geocode";
import type { Destination } from "./MapCanvas";

const DEFAULT_LOCATION = "Morewood Avenue";

/** `/?demo=pirates&stage=2` puts the home screen into a deterministic scenario
 * (see lib/pressure/demo.ts). Read after mount so server and client first
 * paints agree; the presenter strip then mirrors any change back to the URL. */
function readDemoParam(): DemoSelection | null {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get("demo");
  if (!scenario || !SCENARIOS.includes(scenario as Scenario)) return null;
  const stage = Number(params.get("stage") ?? stageCount(scenario as Scenario) - 1);
  return { scenario: scenario as Scenario, stage: Number.isInteger(stage) ? Math.max(0, Math.min(stageCount(scenario as Scenario) - 1, stage)) : 0 };
}

function writeDemoParam(demo: DemoSelection | null) {
  const url = new URL(window.location.href);
  if (demo) {
    url.searchParams.set("demo", demo.scenario);
    url.searchParams.set("stage", String(demo.stage));
  } else {
    url.searchParams.delete("demo");
    url.searchParams.delete("stage");
  }
  window.history.replaceState(null, "", url.toString());
}

export default function HomePage() {
  const router = useRouter();
  const { selectedRouteId, setSelectedRouteId, departureAt, viewMode, setViewMode, weatherDismissed, dismissWeather, demo, setDemo } =
    useAppState();

  const [location, setLocation] = useState(DEFAULT_LOCATION);
  // Only set once a real address is picked from the search dropdown — the map
  // keeps its fixed decorative pin until then rather than guessing a coordinate.
  const [destination, setDestination] = useState<Destination>(null);
  const device = useDeviceLocation();
  const arrivals = useArrivalTimes();

  // Reads the cached address and any demo URL parameter after mount, deferred a
  // tick to satisfy the set-state-in-effect lint rule (same pattern as lib/geocode.ts).
  useEffect(() => {
    queueMicrotask(() => {
      const cached = loadCachedDestination();
      if (cached) {
        setLocation(cached.label);
        setDestination({ lat: cached.lat, lng: cached.lng });
      }
      const fromUrl = readDemoParam();
      if (fromUrl) setDemo(fromUrl);
    });
    // setDemo is stable for the provider's lifetime; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectAddress(address: AddressResult) {
    setDestination({ lat: address.lat, lng: address.lng });
    saveCachedDestination(address);
  }

  function changeDemo(next: DemoSelection | null) {
    setDemo(next);
    writeDemoParam(next);
  }

  const scenario = demo ? SCENARIO_DEFINITIONS[demo.scenario] : null;
  const origin = scenario ? { lat: scenario.location.lat, lng: scenario.location.lng } : { lat: device.lat, lng: device.lng };
  const tripEnd = scenario ? { lat: scenario.destination.lat, lng: scenario.destination.lng } : destination;
  const pressure = usePressure({ origin, destination: tripEnd, at: departureAt, demo });

  const now = pressure.data?.generatedAt ?? null;
  const whenLabel = departureAt ? `at ${clock(departureAt)}` : scenario && now ? `${weekdayShort(now)} ${clock(now)}` : "leaving now";
  const timeLeft = departureAt ? "Leave at" : "Leave now";
  const timeRight = departureAt ? clock(departureAt) : scenario && now ? clock(now) : "Now";
  const recommendation = pressure.data?.recommendation;
  const majorEvent = pressure.data?.eventImpacts.find((i) => i.role === "MAJOR")?.event ?? null;
  const eventMarker = majorEvent ? { lat: majorEvent.lat, lng: majorEvent.lng, label: majorEvent.venue } : null;
  const demoRain = demo ? demo.stage >= (scenario?.event ? 2 : 1) : false;

  return (
    <div className="mobile-screen home-screen flex min-h-dvh flex-col bg-canvas">
      <NavBar />

      {demo ? (
        <div className="mt-2">
          <DemoBar demo={demo} onChange={changeDemo} />
        </div>
      ) : null}

      <div className="mt-4 px-gutter">
        <LocationField
          value={scenario ? scenario.destination.label : location}
          onChange={setLocation}
          onSelectAddress={handleSelectAddress}
        />
      </div>

      <div className="mt-[14px]">
        <TimeRow left={timeLeft} right={timeRight} onClick={() => router.push("/plan")} />
      </div>

      <div className="route-panel mt-4 px-gutter">
        {viewMode === "map" ? (
          <RouteMap
            activeRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            destination={tripEnd}
            origin={scenario ? origin : null}
            weatherOverride={scenario ? { label: demoRain ? "Rain beginning" : "Clear", icon: demoRain ? "cloud" : "sun" } : null}
            eventMarker={eventMarker}
            onOpenTimeline={() => router.push("/plan")}
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

      <div className="mt-4">
        <PressureModule state={pressure} whenLabel={whenLabel} />
      </div>

      {/* Live next-bus predictions cover the three tracked routes near CMU;
          a scenario elsewhere in the city would make them misleading. */}
      {!demo && viewMode === "map" ? (
        <div className="mt-4">
          <ArrivalCards selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} arrivals={arrivals} />
        </div>
      ) : null}

      <div className="mt-auto px-gutter pb-4 pt-4">
        <PrimaryButton
          label={recommendation ? buttonLabel(recommendation) : pressure.loading ? "Checking conditions" : "See timeline"}
          icon={
            <span className="flex text-on-ink">
              <ClockIcon className="h-4 w-4" />
            </span>
          }
          onClick={() => router.push("/plan")}
        />
      </div>
    </div>
  );
}
