"use client";

import { useEffect, useRef } from "react";
import { CloudIcon, SunIcon } from "@/components/icons/filled";
import { CloseXIcon } from "@/components/icons/stroked";
import type { WeatherInfo } from "@/lib/weather";

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

type WeatherDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  weather: WeatherInfo;
};

/** Weather chip's "more details" popup: same blurred-backdrop + corner-X
 * shell as ChatSheet, scaled down to a single centered card. */
export function WeatherDetailsModal({ open, onClose, weather }: WeatherDetailsModalProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) return null;
  const d = weather.detail;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-gutter" role="presentation">
      <button type="button" aria-label="Close weather details" onClick={onClose} className="absolute inset-0 bg-ink-deep/30 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label="Weather details" className="relative flex w-full max-w-[360px] flex-col rounded border border-border-soft bg-canvas">
        <div className="flex items-center justify-between gap-3 border-b border-rule px-gutter py-3">
          <span className="flex items-center gap-2 font-display text-wordmark text-ink">
            <span aria-hidden className="flex items-center">
              {weather.icon === "sun" ? <SunIcon className="h-5 w-5" /> : <CloudIcon className="h-5 w-5" />}
            </span>
            Weather
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className={`flex shrink-0 items-center text-blue ${FOCUS_RING}`}>
            <CloseXIcon className="h-[19px] w-[19px]" />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-gutter py-3 text-body text-blue">
          {weather.error ? (
            <p>Weather is unavailable right now.</p>
          ) : weather.loading ? (
            <p>Loading weather details…</p>
          ) : d ? (
            <>
              <p className="text-row-title font-bold">{weather.label}</p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-footnote">
                <dt className="opacity-footnote">Feels like</dt>
                <dd>{d.feelsLikeF}°F</dd>
                <dt className="opacity-footnote">Humidity</dt>
                <dd>{d.humidityPercent}%</dd>
                <dt className="opacity-footnote">Wind</dt>
                <dd>{d.windMph} mph</dd>
                <dt className="opacity-footnote">Precipitation</dt>
                <dd>{d.precipitationInchesPerHour > 0 ? `${d.precipitationInchesPerHour.toFixed(2)} in/hr` : "None"}</dd>
              </dl>
              <p className="mt-1 text-footnote opacity-footnote">Live reading from Open-Meteo for your current location.</p>
            </>
          ) : (
            <>
              <p className="text-row-title font-bold">{weather.label}</p>
              <p className="mt-1 text-footnote opacity-footnote">Demo scenario weather — detailed conditions aren&apos;t simulated.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
