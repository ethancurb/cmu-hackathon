"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { LocationField } from "@/components/LocationField";
import { TimeRow } from "@/components/TimeRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ClockIcon, SwapIcon } from "@/components/icons/stroked";
import { RouteMap } from "./RouteMap";
import { VehicleModelView } from "./VehicleModelView";
import { PressureModule } from "./PressureModule";
import { JourneyPanel } from "./JourneyPanel";
import { ChatSheet } from "./ChatSheet";
import { TimeSheet } from "./TimeSheet";
import { DemoBar } from "./DemoBar";
import { useAppState, type DemoSelection } from "@/lib/app-context";
import { useDeviceLocation } from "@/lib/geolocation";
import { useNow } from "@/lib/use-now";
import { usePressure } from "@/lib/pressure/use-pressure";
import { pickJourney, useJourneys } from "@/lib/journey/use-journeys";
import { leaveByTime } from "@/lib/journey/format";
import { recommendedBus } from "@/lib/journey/recommendation";
import { SCENARIOS, SCENARIO_DEFINITIONS, stageCount, type Scenario } from "@/lib/pressure/demo";
import { clock, weekdayShort } from "@/lib/pressure/format";
import type { AddressResult } from "@/lib/geocode";

const DEFAULT_ORIGIN_LABEL = "Carnegie Mellon (default)";

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
  const mapPanel = useRef<HTMLDivElement>(null);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
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
  const bestBus = journeys.loading || journeys.error ? null : recommendedBus(journeyList);
  const leaveBy = journey ? leaveByTime(journey) : null;
  const leaveByPassed = leaveBy !== null && now !== null && Date.parse(leaveBy) <= now;

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

  function handleSelectDestination(address: AddressResult) {
    setDestination({ label: address.label, lat: address.lat, lng: address.lng });
  }

  function handleSelectOrigin(address: AddressResult) {
    setManualOrigin({ label: address.label, lat: address.lat, lng: address.lng });
  }

  /** Swaps the from/to fields. Snapshots whichever coordinate was live (e.g.
   * device location) into a fixed point rather than keeping it tracking. */
  function swapLocations() {
    if (!tripEnd) return;
    setManualOrigin({ label: destinationLabel, lat: tripEnd.lat, lng: tripEnd.lng });
    setDestination({ label: originLabel, lat: origin.lat, lng: origin.lng });
  }

  function leaveNow() {
    applyDepartureAt(null);
    selectJourney(null);
    journeys.refresh();
  }

  function showRecommendedJourney(id: string) {
    selectJourney(id);
    setViewMode("map");
    requestAnimationFrame(() => {
      mapPanel.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      mapPanel.current?.focus({ preventScroll: true });
    });
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
      <div className="mt-4 flex items-stretch gap-2 px-gutter">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <span className="text-footnote text-blue opacity-footnote">From</span>
            <LocationField value={originLabel} onSelectAddress={handleSelectOrigin} near={origin} />
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
            <LocationField value={destinationLabel} onSelectAddress={handleSelectDestination} near={origin} />
          </div>
        </div>
        <button
          type="button"
          onClick={swapLocations}
          disabled={!tripEnd || !!scenario}
          aria-label="Swap from and to"
          className="h-control w-control shrink-0 self-center rounded border border-border bg-surface text-blue outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:opacity-footnote"
        >
          <SwapIcon className="mx-auto h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="mt-[14px] flex items-center">
        <div className="min-w-0 flex-1">
          <TimeRow left={timeLeft} right={timeRight} onClick={() => setTimeSheetOpen(true)} />
        </div>
      </div>

      <div ref={mapPanel} tabIndex={-1} aria-label="Trip map" className="route-panel mt-4 px-gutter outline-none focus-visible:outline-2 focus-visible:outline-blue">
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
          <VehicleModelView viewMode={viewMode} onSetViewMode={setViewMode} />
        )}
      </div>

      <div className="mt-4">
        <JourneyPanel state={journeys} journey={journey} onSelect={selectJourney} hasDestination={!!tripEnd && !scenario} whenLabel={tripWhen} now={now} />
      </div>

      <div className="px-gutter pt-3">
        <PrimaryButton
          label={leaveBy && !leaveByPassed ? "Leave by" : "Leave now"}
          icon={
            <span className="flex text-on-ink">
              <ClockIcon className="h-4 w-4" />
            </span>
          }
          value={leaveBy && !leaveByPassed ? clock(leaveBy) : journey ? `~${clock(journey.endTime)}` : undefined}
          onClick={leaveNow}
          disabled={!!scenario || !tripEnd}
        />
        {journey ? (
          <p className="mt-1 text-center text-footnote text-blue opacity-footnote">
            {leaveBy && !leaveByPassed ? `Reaches the stop 2 min before the bus · arrive ~${clock(journey.endTime)}` : `Estimated arrival · ${journey.realTime ? "realtime PRT" : "scheduled times"}`}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <PressureModule state={pressure} whenLabel={pressureWhen} recommendedJourney={bestBus}
          routeStatus={scenario ? "Demo: routes off" : !tripEnd ? "Pick a destination" : journeys.loading ? "Finding your bus…" : journeys.error ? "Routes unavailable" : "No bus option found"}
          onShowJourney={showRecommendedJourney} />
      </div>

      <ChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        trip={{ originLabel, origin: { label: originLabel, ...origin }, destinationLabel: tripEnd ? destinationLabel : null, destination: tripEnd, departureAt, arriveBy, journeys: journeyList, journey, pressure: pressure.data, demo: !!scenario }}
      />

      {timeSheetOpen ? (
        <TimeSheet
          onClose={() => setTimeSheetOpen(false)}
          departureAt={departureAt}
          arriveBy={arriveBy}
          onApply={(at, nextArriveBy) => {
            applyDepartureAt(at, nextArriveBy);
            journeys.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
