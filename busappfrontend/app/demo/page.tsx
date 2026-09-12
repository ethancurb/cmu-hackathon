"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { Headline } from "@/components/Headline";
import { Divider } from "@/components/Divider";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PressureDots } from "../PressureDots";
import { cn } from "@/lib/cn";
import { useAppState } from "@/lib/app-context";
import { SCENARIOS, SCENARIO_DEFINITIONS, type Scenario } from "@/lib/pressure/demo";
import { pressureUrl } from "@/lib/pressure/use-pressure";
import { clock, timeRange, LEVEL_COLOR, LEVEL_WORD } from "@/lib/pressure/format";
import type { PressureResult } from "@/lib/pressure/types";

type StageResult = { stage: number; label: string; result: PressureResult | null; error: boolean };

/**
 * Presenter console: every scenario's stages are fetched from /api/pressure
 * and laid side by side, so the audience sees the score, level, surge window
 * and advice change as one signal at a time is added. "Open on home" drops the
 * real home screen into that scenario via `/?demo=<scenario>&stage=<n>`.
 * Deliberately outside the consumer navigation.
 */
export default function DemoPage() {
  const router = useRouter();
  const { setDemo } = useAppState();
  const [active, setActive] = useState<Scenario>("pirates");
  const [rows, setRows] = useState<Record<Scenario, StageResult[]>>({ pirates: [], concert: [], cmu: [] });

  useEffect(() => {
    let cancelled = false;
    for (const scenario of SCENARIOS) {
      const def = SCENARIO_DEFINITIONS[scenario];
      Promise.all(
        def.stages.map(async (stage, i): Promise<StageResult> => {
          try {
            const res = await fetch(pressureUrl({ origin: def.location, destination: def.destination, at: null, demo: { scenario, stage: i } }), { cache: "no-store" });
            if (!res.ok) throw new Error(String(res.status));
            return { stage: i, label: stage.label, result: (await res.json()) as PressureResult, error: false };
          } catch {
            return { stage: i, label: stage.label, result: null, error: true };
          }
        })
      ).then((results) => {
        if (!cancelled) setRows((prev) => ({ ...prev, [scenario]: results }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const def = SCENARIO_DEFINITIONS[active];
  const stages = rows[active];

  function openOnHome(stage: number) {
    setDemo({ scenario: active, stage });
    router.push(`/?demo=${active}&stage=${stage}`);
  }

  return (
    <div className="mobile-screen flex min-h-dvh flex-col bg-canvas">
      <NavBar backLabel="Home" onBack={() => router.push("/")} />
      <Headline subhead="Same engine, one signal at a time.">Scenarios.</Headline>

      <div className="mt-[14px] flex gap-[5px] px-gutter" role="tablist" aria-label="Scenario">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            role="tab"
            aria-selected={scenario === active}
            onClick={() => setActive(scenario)}
            className={cn(
              "min-w-0 flex-1 truncate rounded border px-2 py-[8px] text-body outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
              scenario === active ? "border-ink-deep bg-ink-deep text-on-ink" : "border-border-soft bg-surface text-blue"
            )}
          >
            {SCENARIO_DEFINITIONS[scenario].tab}
          </button>
        ))}
      </div>

      <p className="mt-3 px-gutter text-body text-blue opacity-footnote">{def.description}</p>

      <div className="mt-3 flex flex-col">
        <div className="px-gutter">
          <Divider />
        </div>
        {(stages.length ? stages : def.stages.map((s, i) => ({ stage: i, label: s.label, result: null, error: false }))).map((row) => {
          const r = row.result;
          return (
            <div key={row.stage}>
              <button
                type="button"
                onClick={() => openOnHome(row.stage)}
                className="flex w-full flex-col gap-1 px-gutter py-[10px] text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                aria-label={`Open stage ${row.stage + 1}, ${row.label}, on the home screen`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-row-title font-bold text-blue">
                    {row.stage + 1}. {row.label}
                  </span>
                  <span className="shrink-0 text-emphasis-number font-bold text-blue">
                    {r ? r.current.score : row.error ? "—" : "…"}
                    <span className="text-body font-regular opacity-footnote"> / 100</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <PressureDots score={r?.current.score ?? 0} level={r?.current.level ?? "LOW"} size={9} />
                  <span className="text-body" style={{ color: r ? LEVEL_COLOR[r.current.level] : undefined }}>
                    {r ? LEVEL_WORD[r.current.level].toUpperCase() : row.error ? "UNAVAILABLE" : ""}
                  </span>
                </div>
                {r ? (
                  <>
                    <span className="text-body text-blue">
                      {r.surge ? `Surge ${timeRange(r.surge.start, r.surge.end)}${r.surge.continues ? "+" : ""}` : "No surge in the next 4 h"} · {r.recommendation.label}
                    </span>
                    <span className="text-footnote text-blue opacity-footnote">
                      {r.current.reasons
                        .slice(0, 3)
                        .map((reason) => `${reason.label} +${reason.contribution}`)
                        .join(" · ")}
                    </span>
                  </>
                ) : null}
              </button>
              <div className="px-gutter">
                <Divider />
              </div>
            </div>
          );
        })}
        <p className="px-gutter py-[11px] text-footnote text-blue opacity-footnote">
          Scenario clock {clock(def.now)} · {def.location.label} → {def.destination.label}. Deterministic inputs, real model: nothing here is a typed-in
          number. Model index, not occupancy.
        </p>
      </div>

      <div className="mt-auto px-gutter pb-4 pt-4">
        <PrimaryButton label="Open on home screen" onClick={() => openOnHome(0)} />
      </div>
    </div>
  );
}
