"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_DEPARTURE_TIME,
  DEFAULT_HOUR_INDEX,
  DEFAULT_PRIMARY_SELECT_VALUE,
  DEFAULT_RECOMMENDATION_ID,
  DEFAULT_ROUTE_ID,
  DEFAULT_SECONDARY_SELECT_VALUE,
  RECOMMENDATIONS,
  type RouteId,
} from "@/lib/mock-data";

export type ViewMode = "map" | "list";

type AppState = {
  selectedRouteId: RouteId;
  /** The time actually applied and shown in the home time row. Only changes
   * when the /plan primary button is pressed — never while merely browsing
   * /plan, and never on nav-back. */
  departureTime: string;
  viewMode: ViewMode;
  weatherDismissed: boolean;
  selectedRecommendationId: string | null;
  selectedHourIndex: number;
  primarySelectValue: string;
  secondarySelectValue: string;
};

type AppContextValue = AppState & {
  setSelectedRouteId: (id: RouteId) => void;
  applyDepartureTime: (time: string) => void;
  setViewMode: (mode: ViewMode) => void;
  dismissWeather: () => void;
  selectHour: (index: number) => void;
  selectRecommendation: (id: string) => void;
  setPrimarySelectValue: (value: string) => void;
  setSecondarySelectValue: (value: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  selectedRouteId: DEFAULT_ROUTE_ID,
  departureTime: DEFAULT_DEPARTURE_TIME,
  viewMode: "map",
  weatherDismissed: false,
  selectedRecommendationId: DEFAULT_RECOMMENDATION_ID,
  selectedHourIndex: DEFAULT_HOUR_INDEX,
  primarySelectValue: DEFAULT_PRIMARY_SELECT_VALUE,
  secondarySelectValue: DEFAULT_SECONDARY_SELECT_VALUE,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setSelectedRouteId: (id) => setState((s) => ({ ...s, selectedRouteId: id })),
      applyDepartureTime: (time) => setState((s) => ({ ...s, departureTime: time })),
      setViewMode: (mode) => setState((s) => ({ ...s, viewMode: mode })),
      dismissWeather: () => setState((s) => ({ ...s, weatherDismissed: true })),
      // Selecting an hour directly clears any recommendation that doesn't match it,
      // since the two must stay in sync (checking a recommendation is just a shortcut
      // to selecting its hour, not an independent piece of state).
      selectHour: (index) =>
        setState((s) => ({
          ...s,
          selectedHourIndex: index,
          selectedRecommendationId: null,
        })),
      // Checking a recommendation is a shortcut to selecting its hour — moves
      // the chart selection to that time range, per the spec.
      selectRecommendation: (id) =>
        setState((s) => {
          const rec = RECOMMENDATIONS.find((r) => r.id === id);
          return {
            ...s,
            selectedRecommendationId: id,
            selectedHourIndex: rec ? rec.barIndex : s.selectedHourIndex,
          };
        }),
      setPrimarySelectValue: (val) => setState((s) => ({ ...s, primarySelectValue: val })),
      setSecondarySelectValue: (val) => setState((s) => ({ ...s, secondarySelectValue: val })),
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
