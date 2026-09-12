"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ROUTE_ID, type RouteId } from "@/lib/mock-data";
import type { Scenario } from "@/lib/pressure/demo";
import type { RiderSignal } from "@/lib/pressure/types";
import { JOURNEY_DEFAULTS } from "@/lib/journey/types";
import { loadCachedDestination, saveCachedDestination } from "@/lib/destination-cache";

export type ViewMode = "map" | "list" | "vehicle";

/** Presenter/demo selection: a deterministic scenario run through the real engine. */
export type DemoSelection = { scenario: Scenario; stage: number };

export type Place = { label: string; lat: number; lng: number };

export type TripPrefs = { maxWalkMinutes: number; maxTransfers: number | null };

/**
 * One shared trip: manual controls, the chat planner, the map, the itinerary
 * and the timeline all read and write this state, so a journey picked in chat
 * is the journey drawn on the map and timed against the pressure model.
 */
type AppState = {
  selectedRouteId: RouteId;
  /** Trip end, or null until the rider picks one (search, chat or cache). */
  destination: Place | null;
  /** Typed/chosen origin; null means the device location (or the CMU fallback). */
  manualOrigin: Place | null;
  /** Chosen time (ISO) or null for "leave now". With `arriveBy` it is an arrival deadline. */
  departureAt: string | null;
  arriveBy: boolean;
  prefs: TripPrefs;
  /** Journey id chosen from the current search; null = first option. */
  selectedJourneyId: string | null;
  viewMode: ViewMode;
  weatherDismissed: boolean;
  demo: DemoSelection | null;
  chatOpen: boolean;
  /** Rider-reported, unverified signals (from chat). Never mixed with verified feeds. */
  riderSignals: RiderSignal[];
};

type AppContextValue = AppState & {
  setSelectedRouteId: (id: RouteId) => void;
  setDestination: (place: Place | null) => void;
  setManualOrigin: (place: Place | null) => void;
  applyDepartureAt: (at: string | null, arriveBy?: boolean) => void;
  setPrefs: (prefs: Partial<TripPrefs>) => void;
  selectJourney: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  dismissWeather: () => void;
  setDemo: (demo: DemoSelection | null) => void;
  setChatOpen: (open: boolean) => void;
  addRiderSignal: (signal: RiderSignal) => void;
  clearRiderSignals: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  selectedRouteId: DEFAULT_ROUTE_ID,
  destination: null,
  manualOrigin: null,
  departureAt: null,
  arriveBy: false,
  prefs: { maxWalkMinutes: JOURNEY_DEFAULTS.maxWalkMinutes, maxTransfers: JOURNEY_DEFAULTS.maxTransfers },
  selectedJourneyId: null,
  viewMode: "map",
  weatherDismissed: false,
  demo: null,
  chatOpen: false,
  riderSignals: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // The cached destination is applied after mount so the server-rendered and
  // first client paints agree (see lib/destination-cache.ts).
  useEffect(() => {
    queueMicrotask(() => {
      const cached = loadCachedDestination();
      if (cached) setState((s) => (s.destination ? s : { ...s, destination: cached }));
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setSelectedRouteId: (id) => setState((s) => ({ ...s, selectedRouteId: id })),
      setDestination: (place) => {
        if (place) saveCachedDestination(place);
        setState((s) => ({ ...s, destination: place, selectedJourneyId: null }));
      },
      setManualOrigin: (place) => setState((s) => ({ ...s, manualOrigin: place, selectedJourneyId: null })),
      applyDepartureAt: (at, arriveBy = false) => setState((s) => ({ ...s, departureAt: at, arriveBy: at ? arriveBy : false, selectedJourneyId: null })),
      setPrefs: (prefs) => setState((s) => ({ ...s, prefs: { ...s.prefs, ...prefs }, selectedJourneyId: null })),
      selectJourney: (id) => setState((s) => ({ ...s, selectedJourneyId: id })),
      setViewMode: (mode) => setState((s) => ({ ...s, viewMode: mode })),
      dismissWeather: () => setState((s) => ({ ...s, weatherDismissed: true })),
      // Switching scenario or leaving demo mode also resets the chosen time and
      // journey: a departure picked against one set of conditions means nothing under another.
      setDemo: (demo) => setState((s) => ({ ...s, demo, departureAt: null, arriveBy: false, selectedJourneyId: null })),
      setChatOpen: (open) => setState((s) => ({ ...s, chatOpen: open })),
      addRiderSignal: (signal) => setState((s) => ({ ...s, riderSignals: [...s.riderSignals.filter((x) => x.id !== signal.id), signal].slice(-5) })),
      clearRiderSignals: () => setState((s) => ({ ...s, riderSignals: [] })),
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within an AppProvider");
  return ctx;
}
