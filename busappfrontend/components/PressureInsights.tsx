"use client";

import { BusIcon, CloudIcon } from "@/components/icons/filled";
import { ClockIcon } from "@/components/icons/stroked";
import { InsightCards, type InsightCard } from "@/components/InsightCards";
import { clock, dayLabel } from "@/lib/pressure/format";
import type { EvidenceItem } from "@/lib/pressure/explain";
import type { UpcomingEvent } from "@/lib/pressure/types";

const LABELS = { EVENT: "Event", WEATHER: "Weather", TIME: "Time of day", TRANSIT: "Service alert", SERVICE: "Departures" };
const BASIS = { VERIFIED: "Verified feed", RIDER: "Unverified report", MODEL: "Model estimate" };

function evidenceCard(item: EvidenceItem, index: number): InsightCard {
  const event = item.event;
  const phase = event ? item.title.replace(`${event.name} · `, "") : "";
  return {
    id: event ? `event-${event.id}` : `${item.kind}-${index}`,
    label: event?.evidence === "RIDER" ? "Rider report" : LABELS[item.kind],
    title: event?.name ?? item.title,
    summary: event ? `${phase !== event.name ? `${phase} · ` : ""}${event.venue}` : undefined,
    meta: event ? /exit|ending|dispers/i.test(phase)
      ? `${event.endEstimated ? "Est. end" : "Ends"} ${clock(event.endTime)}`
      : `${dayLabel(event.startTime)} ${clock(event.startTime)}` : BASIS[item.basis],
    icon: item.kind === "WEATHER" ? <CloudIcon className="h-4 w-4" /> : item.kind === "TRANSIT" || item.kind === "SERVICE" ? <BusIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />,
    detail: (
      <>
        {event ? <p>{item.title.replace(`${event.name} · `, "")}</p> : null}
        {item.detail ? <p>{item.detail}</p> : null}
        <p className="mt-1 text-footnote">{BASIS[item.basis]}</p>
      </>
    ),
  };
}

export function PressureInsights({ items, label, firstCard, upcoming = [], gaps = [] }: {
  items: EvidenceItem[];
  label: string;
  firstCard?: InsightCard;
  upcoming?: UpcomingEvent[];
  gaps?: string[];
}) {
  // Events lead the explanations; the recommended journey always stays first.
  const ordered = [...items.filter((item) => item.event), ...items.filter((item) => !item.event)];
  const cards = ordered.map(evidenceCard);
  for (const entry of upcoming) {
    if (items.some((item) => item.event?.id === entry.event.id)) continue;
    cards.push({
      ...evidenceCard({ kind: "EVENT", title: entry.event.name, detail: `${entry.event.venue} · arrivals peak ~${clock(entry.arrivalsPeakAt)} · exit wave ~${clock(entry.exitPeakAt)}${entry.event.endEstimated ? " (estimated end)" : ""} · ${entry.event.source}`, contribution: 0, event: entry.event, basis: entry.event.evidence === "RIDER" ? "RIDER" : "VERIFIED" }, cards.length),
      label: entry.event.evidence === "RIDER" ? "Rider report" : "Coming up",
    });
  }
  if (!items.some((item) => item.kind === "EVENT") && gaps.length) {
    cards.push({ id: "coverage", label: "Coverage", title: "No known event", summary: "Some events may be missing", icon: <ClockIcon className="h-4 w-4" />, detail: <ul className="space-y-1">{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul> });
  }
  if (firstCard) cards.unshift(firstCard);
  return cards.length ? <InsightCards cards={cards} label={label} /> : <p className="text-body text-blue opacity-footnote">No insights available for this time.</p>;
}
