"use client";

import { Disclosure } from "@/components/Disclosure";
import { InsightCards, type InsightCard } from "@/components/InsightCards";
import { BusIcon, WalkIcon, MapIcon } from "@/components/icons/filled";
import { clock } from "@/lib/pressure/format";
import { durationLabel } from "@/lib/journey/format";
import { useJourneyProgress } from "@/lib/journey/use-journey-progress";
import type { Journey, JourneyLeg } from "@/lib/journey/types";
import type { JourneyProgress } from "@/lib/journey/progress";

const STATUS: Record<JourneyProgress["status"], string> = {
  nearby: "Location estimate", arrival: "Near your destination", locating: "Finding your location…",
  unavailable: "Location unavailable · preview steps", stale: "Location is old · preview steps",
  inaccurate: "GPS is imprecise · preview steps", "off-route": "Away from this route · check the map",
  ambiguous: "Steps overlap here · check your stop", preview: "Future trip · preview steps", expired: "Past trip · refresh your route",
};

function action(leg: JourneyLeg): string {
  return leg.mode === "WALK" ? `Walk to ${leg.to.name}` : `Take ${leg.routeShortName ?? leg.mode.toLowerCase()} to ${leg.to.name}`;
}

/** Foreground proximity highlights a step; expanding a card never moves that marker. */
export function JourneyItinerary({ journey, provider, routeUnavailable = false }: { journey: Journey; provider: string | null; routeUnavailable?: boolean }) {
  const progress = useJourneyProgress(journey);
  const index = routeUnavailable ? null : progress.index;
  const currentId = index === null ? null : `step-${index}`;
  const cards: InsightCard[] = journey.legs.map((leg, i) => ({
    id: `step-${i}`,
    label: `${i + 1} · ${leg.mode === "WALK" ? "Walk" : "Transit"}`,
    title: leg.mode === "WALK" ? `Walk ${durationLabel(leg.durationSeconds)}` : `${leg.mode === "BUS" ? "Bus" : leg.mode === "TRAM" ? "Tram" : leg.mode === "RAIL" ? "Train" : "Transit"} ${leg.routeShortName ?? ""}`.trim(),
    summary: `To ${leg.to.name}`,
    meta: `${clock(leg.startTime)}${leg.mode === "WALK" ? "" : ` · ${durationLabel(leg.durationSeconds)}`}`,
    icon: leg.mode === "WALK" ? <WalkIcon className="h-4 w-4" /> : <BusIcon className="h-4 w-4" />,
    detail: leg.mode === "WALK" ? <p>From {leg.from.name} to {leg.to.name}.</p> : (
      <div className="space-y-1">
        <p>Board at {leg.from.name} · {clock(leg.startTime)}.</p>
        {leg.headsign ? <p>Toward {leg.headsign}.</p> : null}
        <p>Get off at {leg.to.name} · ~{clock(leg.endTime)}.</p>
        <p className="text-footnote">{leg.realTime ? "Realtime estimate" : "Scheduled estimate"}{leg.agency ? ` · ${leg.agency}` : ""}</p>
      </div>
    ),
  }));
  cards.push({
    id: `step-${journey.legs.length}`, label: `${cards.length + 1} · Arrival`, title: "Your destination",
    summary: journey.legs.at(-1)?.to.name, meta: `Arrive ~${clock(journey.endTime)}`,
    icon: <MapIcon className="h-4 w-4" />,
    detail: <p>Arrival is an estimate.{provider ? ` Itinerary via ${provider}.` : ""}</p>,
  });
  const current = index !== null ? journey.legs[index] : null;
  const next = index !== null ? journey.legs[index + 1] : null;

  return (
    <Disclosure label="Itinerary" summary={index === null ? `${cards.length} steps` : `Near step ${index + 1}`}>
      <div className="mb-2" aria-live="polite" aria-atomic="true">
        <p className="text-body font-bold text-blue">{current ? action(current) : routeUnavailable ? "Route update unavailable · preview steps" : STATUS[progress.status]}</p>
        {current ? <p className="mt-1 text-footnote text-blue opacity-footnote">GPS estimate · {next ? `Next: ${action(next)}` : "Next: your destination"}</p> : null}
      </div>
      <InsightCards cards={cards} label="Itinerary steps" currentId={currentId} />
    </Disclosure>
  );
}
