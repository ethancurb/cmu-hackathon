"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { LocationField } from "@/components/LocationField";
import { TimeRow } from "@/components/TimeRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ClockIcon } from "@/components/icons/stroked";
import { RouteMap } from "./RouteMap";
import { ArrivalCards } from "./ArrivalCards";
import { PressureModule } from "./PressureModule";
import { JourneyPanel } from "./JourneyPanel";
import { ChatSheet } from "./ChatSheet";
import { DemoBar } from "./DemoBar";
import { VehicleModelView } from "./VehicleModelView";
import { CrowdingPanel } from "./CrowdingPanel";
import { useAppState, type DemoSelection } from "@/lib/app-context";
import { useArrivalTimes } from "@/lib/arrivals";
import { useCrowding } from "@/lib/crowding/use-crowding";
import { CMU_FALLBACK, useDeviceLocation } from "@/lib/geolocation";
import { useNow } from "@/lib/use-now";
import { usePressure } from "@/lib/pressure/use-pressure";
import { pickJourney, useJourneys } from "@/lib/journey/use-journeys";
import { distanceKm } from "@/lib/pressure/geo";
import { SCENARIOS, SCENARIO_DEFINITIONS, stageCount, type Scenario } from "@/lib/pressure/demo";
import { clock, weekdayShort } from "@/lib/pressure/format";
import type { AddressResult } from "@/lib/geocode";

const DEFAULT_ORIGIN_LABEL = "Carnegie Mellon (default)";
const NEARBY_CARDS_KM = 1.5;

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
  const {
    selectedRouteId,
    setSelectedRouteId,
    destination,
    setDestination,
    manualOrigin,
    setManualOrigin,
    departureAt,
    arriveBy,
    applyDepartureAt,
    prefs,
    selectedJourneyId,
    selectJourney,
    viewMode,
    setViewMode,
    weatherDismissed,
    dismissWeather,
    demo,
    setDemo,
    chatOpen,
    setChatOpen,
    riderSignals,
  } = useAppState();

  const device = useDeviceLocation();
  const arrivals = useArrivalTimes();
  const crowding = useCrowding();
  const now = useNow();

  useEffect(() => {
    queueMicrotask(() => {
      const fromUrl = readDemoParam();
      if (fromUrl) setDemo(fromUrl);
    });
    // setDemo is stable for the provider's lifetime; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeDemo(next: DemoSelection | null) {
    setDemo(next);
    writeDemoParam(next);
  }

  const scenario = demo ? SCENARIO_DEFINITIONS[demo.scenario] : null;
  const origin = scenario ? { lat: scenario.location.lat, lng: scenario.location.lng } : manualOrigin ? { lat: manualOrigin.lat, lng: manualOrigin.lng } : { lat: device.lat, lng: device.lng };
  const originLabel = scenario ? scenario.location.label : manualOrigin ? manualOrigin.label : device.source === "device" ? "Your location" : DEFAULT_ORIGIN_LABEL;
  const tripEnd = scenario ? { lat: scenario.destination.lat, lng: scenario.destination.lng } : destination ? { lat: destination.lat, lng: destination.lng } : null;
  const destinationLabel = scenario ? scenario.destination.label : destination?.label ?? "Where to?";

  // Scenarios carry a fixed clock the routing provider cannot search, so the
  // itinerary search runs only against the live clock.
  const journeys = useJourneys({
    from: scenario ? null : origin,
    to: scenario ? null : tripEnd,
    at: departureAt,
    arriveBy,
    maxWalkMinutes: prefs.maxWalkMinutes,
    maxTransfers: prefs.maxTransfers,
  });
  const journeyList = useMemo(() => (journeys.data?.status === "ok" ? journeys.data.journeys : []), [journeys.data]);
  const journey = pickJourney(journeyList, selectedJourneyId);

  // Pressure is modeled for the moment the rider actually leaves: the selected
  // journey's departure when one exists, otherwise the chosen time or now.
  const journeyStartUsable = !!journey && now !== null && Date.parse(journey.startTime) > now - 4 * 60_000 && Date.parse(journey.startTime) < now + 47 * 3_600_000;
  const pressureAt = scenario ? departureAt : journeyStartUsable ? journey.startTime : arriveBy ? null : departureAt;
  const pressure = usePressure({ origin, destination: tripEnd, at: pressureAt, demo, riderSignals });

  const generatedAt = pressure.data?.generatedAt ?? null;
  const pressureWhen = pressureAt ? `at ${clock(pressureAt)}` : scenario && generatedAt ? `${weekdayShort(generatedAt)} ${clock(generatedAt)}` : "leaving now";
  const timeLeft = departureAt ? (arriveBy ? "Arrive by" : "Leave at") : "Leave now";
  const timeRight = departureAt ? clock(departureAt) : scenario && generatedAt ? clock(generatedAt) : "Now";
  const tripWhen = scenario ? "scenario clock · itinerary search off" : departureAt ? (arriveBy ? `arriving by ${clock(departureAt)}` : `leaving ${clock(departureAt)}`) : "leaving now";
  const majorEvent = pressure.data?.eventImpacts.find((i) => i.role === "MAJOR")?.event ?? null;
  const eventMarker = majorEvent ? { lat: majorEvent.lat, lng: majorEvent.lng, label: majorEvent.venue } : null;
  const demoRain = demo ? demo.stage >= (scenario?.event ? 2 : 1) : false;
  const nearCmu = !demo && distanceKm(origin, CMU_FALLBACK) <= NEARBY_CARDS_KM;

  function handleSelectDestination(address: AddressResult) {
    setDestination({ label: address.label, lat: address.lat, lng: address.lng });
  }

  function handleSelectOrigin(address: AddressResult) {
    setManualOrigin({ label: address.label, lat: address.lat, lng: address.lng });
  }

  function leaveNow() {
    applyDepartureAt(null);
    selectJourney(null);
    journeys.refresh();
  }

  return (
    <div className="mobile-screen home-screen flex min-h-dvh flex-col bg-canvas">
      <NavBar />

      {demo ? (
        <div className="mt-2">
          <DemoBar demo={demo} onChange={changeDemo} />
        </div>
      ) : null}

      {/* Origin + destination. Real coordinates only come from a picked suggestion (or chat). */}
      <div className="mt-4 flex flex-col gap-2 px-gutter">
        <div>
          <span className="text-footnote text-blue opacity-footnote">From</span>
          <LocationField value={originLabel} onSelectAddress={handleSelectOrigin} />
          {!scenario && device.source === "fallback" && !manualOrigin ? (
            <p className="mt-1 text-footnote text-blue opacity-footnote">Device location unavailable or denied. Starting from Carnegie Mellon; edit the field to set your real start.</p>
          ) : null}
          {manualOrigin && !scenario ? (
            <button type="button" onClick={() => setManualOrigin(null)} className="mt-1 text-footnote text-blue underline outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue">
              Use my device location instead
            </button>
          ) : null}
        </div>
        <div>
          <span className="text-footnote text-blue opacity-footnote">To</span>
          <LocationField value={destinationLabel} onSelectAddress={handleSelectDestination} />
        </div>
      </div>

      <div className="mt-[14px] flex items-center">
        <div className="min-w-0 flex-1">
          <TimeRow left={timeLeft} right={timeRight} onClick={() => router.push("/plan")} />
        </div>
      </div>

      <div className="route-panel mt-4 px-gutter">
        {viewMode === "map" ? (
          <RouteMap
            activeRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
            destination={tripEnd}
            origin={scenario || manualOrigin ? origin : null}
            weatherOverride={scenario ? { label: demoRain ? "Rain beginning" : "Clear", icon: demoRain ? "cloud" : "sun" } : null}
            eventMarker={eventMarker}
            journey={journey}
            onOpenTimeline={() => router.push("/plan")}
            onOpenChat={() => setChatOpen(true)}
            weatherDismissed={weatherDismissed}
            onDismissWeather={dismissWeather}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
          />
        ) : (
          <VehicleModelView viewMode={viewMode} onSetViewMode={setViewMode} occupancy={pressure.data?.occupancy ?? null} />
        )}
      </div>

      {/* Keep route choices visible directly beneath either visual view. These
          are nearby CMU arrivals, not claims about a selected itinerary. */}
      {nearCmu ? (
        <div className="mt-4">
          <ArrivalCards selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} arrivals={arrivals} />
        </div>
      ) : null}

      <div className="mt-4">
        <JourneyPanel state={journeys} journey={journey} onSelect={selectJourney} hasDestination={!!tripEnd && !scenario} whenLabel={tripWhen} />
      </div>

      <div className="px-gutter pt-3">
        <PrimaryButton
          label="Leave now"
          icon={
            <span className="flex text-on-ink">
              <ClockIcon className="h-4 w-4" />
            </span>
          }
          value={journey ? `~${clock(journey.endTime)}` : undefined}
          onClick={leaveNow}
          disabled={!!scenario || !tripEnd}
        />
        {journey ? <p className="mt-1 text-center text-footnote text-blue opacity-footnote">Estimated arrival · {journey.realTime ? "realtime PRT" : "scheduled times"}</p> : null}
      </div>

      <div className="mt-4">
        <PressureModule state={pressure} whenLabel={pressureWhen} />
      </div>

      {nearCmu ? (
        <div className="mt-2 px-gutter">
          <CrowdingPanel state={crowding} />
        </div>
      ) : null}

      <div className="mt-auto px-gutter pb-4 pt-4">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex h-control w-full items-center justify-between rounded border border-border bg-surface px-4 text-left text-body text-blue outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <span>Ask LoadLine: “CMU to the North Shore by 7”</span>
          <span className="text-footnote opacity-footnote">chat</span>
        </button>
      </div>

      <ChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        trip={{ originLabel, origin: { label: originLabel, ...origin }, destinationLabel: tripEnd ? destinationLabel : null, destination: tripEnd, departureAt, arriveBy, journeys: journeyList, journey, pressure: pressure.data, demo: !!scenario }}
      />
    </div>
  );
}
