"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ROUTE_ID, type RouteId } from "@/lib/mock-data";
import type { Scenario } from "@/lib/pressure/demo";

export type ViewMode = "map" | "list";

/** Presenter/demo selection: a deterministic scenario run through the real engine. */
export type DemoSelection = { scenario: Scenario; stage: number };

type AppState = {
  selectedRouteId: RouteId;
  /** Chosen departure time (ISO) or null for "leave now". Only changes when
   * the /plan primary button is pressed — never while merely browsing /plan. */
  departureAt: string | null;
  viewMode: ViewMode;
  weatherDismissed: boolean;
  demo: DemoSelection | null;
};

type AppContextValue = AppState & {
  setSelectedRouteId: (id: RouteId) => void;
  applyDepartureAt: (at: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  dismissWeather: () => void;
  setDemo: (demo: DemoSelection | null) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  selectedRouteId: DEFAULT_ROUTE_ID,
  departureAt: null,
  viewMode: "map",
  weatherDismissed: false,
  demo: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setSelectedRouteId: (id) => setState((s) => ({ ...s, selectedRouteId: id })),
      applyDepartureAt: (at) => setState((s) => ({ ...s, departureAt: at })),
      setViewMode: (mode) => setState((s) => ({ ...s, viewMode: mode })),
      dismissWeather: () => setState((s) => ({ ...s, weatherDismissed: true })),
      // Switching scenario or leaving demo mode also resets the chosen time:
      // a departure picked against one set of conditions means nothing under another.
      setDemo: (demo) => setState((s) => ({ ...s, demo, departureAt: null })),
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within an AppProvider");
  return ctx;
}
