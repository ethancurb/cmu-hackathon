"use client";

import { useEffect, useState } from "react";

export type WeatherInfo = {
  label: string;
  icon: "sun" | "cloud";
  loading: boolean;
  /** True when the fetch failed — label reads "Weather unavailable" rather
   * than a fabricated condition. */
  error: boolean;
};

// WMO weather codes, per Open-Meteo's `current.weather_code`.
const CODE_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function conditionLabel(code: number): string {
  return CODE_LABELS[code] ?? "Unknown";
}

function isPrecipitationCode(code: number): boolean {
  return (code >= 51 && code <= 82) || (code >= 85 && code <= 99);
}

function isSnowCode(code: number): boolean {
  return (code >= 71 && code <= 77) || code === 85 || code === 86;
}

const LOADING_STATE: WeatherInfo = { label: "Loading weather…", icon: "cloud", loading: true, error: false };

/** Fetches live conditions for one coordinate from Open-Meteo (no API key).
 * While it is actively precipitating, uses the 15-minute forecast to report
 * how much longer it looks like it will last, echoing the shape of the old
 * hardcoded "Ends in 18m" chip — but from a real forecast instead of a fixed
 * string. Otherwise reports current temperature and condition. */
export function useWeather(lat: number, lng: number): WeatherInfo {
  const [state, setState] = useState<WeatherInfo>(LOADING_STATE);

  useEffect(() => {
    let cancelled = false;

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,precipitation,weather_code,is_day` +
      `&minutely_15=precipitation&temperature_unit=fahrenheit&forecast_days=1&timezone=auto`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const current = data?.current;
        if (!current || typeof current.temperature_2m !== "number") throw new Error("Malformed Open-Meteo response");

        const temp = Math.round(current.temperature_2m);
        const code: number = current.weather_code;
        const isDay = current.is_day === 1;
        const raining = current.precipitation > 0 && isPrecipitationCode(code);

        const minutelyTimes: string[] | undefined = data.minutely_15?.time;
        const minutelyPrecip: number[] | undefined = data.minutely_15?.precipitation;

        if (raining && minutelyTimes && minutelyPrecip) {
          const nowMs = new Date(current.time).getTime();
          const startIdx = minutelyTimes.findIndex((t) => new Date(t).getTime() >= nowMs);
          let minutes = 0;
          for (let i = Math.max(startIdx, 0); i < minutelyPrecip.length; i++) {
            if (minutelyPrecip[i] > 0) minutes += 15;
            else break;
          }
          const noun = isSnowCode(code) ? "Snow" : "Rain";
          setState({
            label: minutes > 0 ? `${noun} ends in ${minutes}m` : `${noun} now`,
            icon: "cloud",
            loading: false,
            error: false,
          });
          return;
        }

        setState({
          label: `${temp}°F · ${conditionLabel(code)}`,
          icon: isDay && (code === 0 || code === 1) ? "sun" : "cloud",
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ label: "Weather unavailable", icon: "cloud", loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return state;
}
