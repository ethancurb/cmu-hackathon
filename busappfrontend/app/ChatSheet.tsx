"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CloseXIcon } from "@/components/icons/stroked";
import { cn } from "@/lib/cn";
import { useAppState } from "@/lib/app-context";
import { clock } from "@/lib/pressure/format";
import { durationLabel, routesLabel } from "@/lib/journey/format";
import type { Journey } from "@/lib/journey/types";
import type { ChatAction, ChatMessage, ChatOption, ChatResponse, Pending, TripContext } from "@/lib/chat/types";

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";
const SUGGESTIONS = ["CMU to the North Shore by 7", "Why is the trip busier around 10?", "Can I leave after the game and avoid the busiest period?"];

type ChatSheetProps = {
  open: boolean;
  onClose: () => void;
  trip: TripContext;
};

type Status = { mode: "model" | "guided"; setup: string | null } | null;

/**
 * The conversational planner as a bottom sheet (phone) / centered panel
 * (wider screens). It shares the trip state with the manual controls, the map
 * and the itinerary: every validated action from /api/chat is applied to the
 * same context, so a journey chosen here is the one on the map.
 */
export function ChatSheet({ open, onClose, trip }: ChatSheetProps) {
  const { setDestination, setManualOrigin, applyDepartureAt, setPrefs, selectJourney, selectedJourneyId, addRiderSignal } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // The latest trip context and close handler are read from refs inside async
  // work and the keyboard listener, synced in an effect (never during render),
  // so the open-effect below runs once per open rather than once per render.
  const tripRef = useRef(trip);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    tripRef.current = trip;
    onCloseRef.current = onClose;
  }, [trip, onClose]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Status) => setStatus(s))
      .catch(() => setStatus(null));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  // While the sheet is open, the page behind it must not scroll or receive
  // wheel/touch input — only the message list inside the sheet should move.
  useEffect(() => {
    if (!open) return;
    const { overflow, touchAction } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.touchAction = touchAction;
    };
  }, [open]);

  function apply(actions: ChatAction[]) {
    for (const a of actions) {
      if (a.type === "set_origin") setManualOrigin(a.place);
      else if (a.type === "set_destination") setDestination(a.place);
      else if (a.type === "set_time") applyDepartureAt(a.at, a.arriveBy);
      else if (a.type === "set_prefs") setPrefs({ ...(a.maxWalkMinutes !== undefined ? { maxWalkMinutes: a.maxWalkMinutes } : {}), ...(a.maxTransfers !== undefined ? { maxTransfers: a.maxTransfers } : {}) });
      else if (a.type === "select_journey") selectJourney(a.journeyId);
      else if (a.type === "add_rider_signal") addRiderSignal(a.signal);
    }
    // A journey chosen in chat replaces any older selection; a re-plan with no
    // journeys clears it so the first fresh option shows.
    if (actions.some((a) => a.type === "set_destination" || a.type === "set_time" || a.type === "set_prefs") && !actions.some((a) => a.type === "select_journey")) selectJourney(null);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12), trip: tripRef.current, pending }),
      });
      const body = (await res.json().catch(() => null)) as ChatResponse | { error?: string } | null;
      if (!res.ok || !body || !("reply" in body)) {
        setMessages((m) => [...m, { role: "assistant", text: `The planner is unavailable (${res.status}). Nothing was changed; try again in a moment.` }]);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", text: body.reply, journeyIds: body.journeyIds, options: body.options }]);
      setPending(body.pending);
      if (body.fallback) setNotice(body.fallback);
      apply(body.actions);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Network error reaching the planner. Nothing was changed; try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center overscroll-none sm:items-center" role="presentation">
      <button type="button" aria-label="Close planner" onClick={onClose} className="absolute inset-0 bg-ink-deep/30 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ask LoadLine"
        className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t border border-border-soft bg-canvas sm:max-h-[80dvh] sm:rounded"
      >
        <div className="flex items-center justify-between gap-3 border-b border-rule px-gutter py-3">
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-wordmark text-ink">Ask LoadLine</span>
            <span className="truncate text-footnote text-blue opacity-footnote">
              {status === null ? "planner" : status.mode === "model" ? "Claude interprets; routes and pressure come from live data" : "Guided planner — no AI key configured; deterministic phrases"}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`flex shrink-0 items-center text-blue ${FOCUS_RING}`}>
            <CloseXIcon className="h-[19px] w-[19px]" />
          </button>
        </div>

        <div ref={listRef} className="flex min-h-[200px] flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-gutter py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-body text-blue">
                Tell me where you are going and when. I plan walking + PRT itineraries and explain what could make the trip busier.
              </p>
              {status?.setup ? <p className="text-footnote text-blue opacity-footnote">{status.setup}</p> : null}
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className={`rounded border border-border-soft bg-surface px-3 py-[6px] text-left text-footnote text-blue ${FOCUS_RING}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[92%] whitespace-pre-wrap rounded border px-3 py-2 text-body",
                  m.role === "user" ? "border-ink-deep bg-ink-deep text-on-ink" : "border-border-soft bg-surface text-blue",
                )}
              >
                {m.text}
              </div>
              {m.role === "assistant" && m.options?.length ? <OptionChips options={m.options} disabled={busy || i !== messages.length - 1} onPick={(o) => send(o.value ?? o.label)} /> : null}
              {m.role === "assistant" && m.journeyIds?.length ? (
                <JourneyCards
                  ids={m.journeyIds}
                  journeys={trip.journeys}
                  selectedId={selectedJourneyId ?? trip.journey?.id ?? null}
                  onPreview={selectJourney}
                  onChoose={(id) => {
                    selectJourney(id);
                    onClose();
                  }}
                />
              ) : null}
              {m.role === "assistant" && /timeline|busier|surge/i.test(m.text) ? (
                <Link href="/plan" className={`text-footnote text-blue underline ${FOCUS_RING}`}>
                  Open the pressure timeline
                </Link>
              ) : null}
            </div>
          ))}
          {busy ? <p className="text-footnote text-blue opacity-footnote">Checking routes and pressure…</p> : null}
          {notice ? <p className="text-footnote text-blue">{notice}</p> : null}
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-rule px-gutter py-3">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. CMU to the North Shore by 7"
            aria-label="Message LoadLine"
            maxLength={500}
            className={`h-control min-w-0 flex-1 rounded border border-border bg-surface px-3 text-body text-blue ${FOCUS_RING}`}
          />
          <button type="submit" disabled={busy || !draft.trim()} className={cn("h-control shrink-0 rounded bg-ink-deep px-4 text-button-label uppercase tracking-loud text-on-ink", (busy || !draft.trim()) && "opacity-40", FOCUS_RING)}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function OptionChips({ options, disabled, onPick }: { options: ChatOption[]; disabled: boolean; onPick: (o: ChatOption) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Choices">
      {options.map((o, i) => (
        <button
          key={`${o.label}-${i}`}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o)}
          className={cn("rounded border border-border-soft bg-surface px-3 py-[6px] text-left text-footnote text-blue", disabled && "opacity-40", FOCUS_RING)}
        >
          {i + 1}. {o.label}
        </button>
      ))}
    </div>
  );
}

function JourneyCards({
  ids,
  journeys,
  selectedId,
  onPreview,
  onChoose,
}: {
  ids: string[];
  journeys: Journey[];
  selectedId: string | null;
  onPreview: (id: string) => void;
  onChoose: (id: string) => void;
}) {
  const offered = ids.map((id) => journeys.find((j) => j.id === id)).filter((j): j is Journey => !!j);
  const list = offered.length ? offered : journeys.slice(0, 3);
  if (!list.length) return <p className="text-footnote text-blue opacity-footnote">Journey options will appear on the home screen once the search finishes.</p>;
  return (
    <div role="radiogroup" aria-label="Journey cards" className="flex w-full flex-col gap-2">
      {list.map((j) => {
        const selected = j.id === selectedId;
        return (
          <div
            key={j.id}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onClick={() => onPreview(j.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onPreview(j.id);
            }}
            className={cn("relative flex w-full flex-col gap-2 rounded border px-3 py-2 text-left", selected ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface", FOCUS_RING)}
          >
            {selected ? <span className="absolute right-[8px] top-[8px] h-[9px] w-[9px] bg-lime" aria-hidden /> : null}
            <span className="text-row-title font-bold text-blue">{routesLabel(j)}</span>
            <span className="text-body text-blue">
              Leave {clock(j.startTime)} · arrive ~{clock(j.endTime)} · {durationLabel(j.durationSeconds)}
            </span>
            <span className="text-footnote text-blue opacity-footnote">
              {j.transfers ? `${j.transfers} transfer${j.transfers > 1 ? "s" : ""}` : "no transfers"} · {Math.round(j.walkSeconds / 60)} min walking · {j.realTime ? "realtime" : "scheduled"}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChoose(j.id);
              }}
              className={cn("self-start rounded bg-ink-deep px-3 py-[6px] text-button-label uppercase tracking-loud text-on-ink", FOCUS_RING)}
            >
              Select route
            </button>
          </div>
        );
      })}
    </div>
  );
}
