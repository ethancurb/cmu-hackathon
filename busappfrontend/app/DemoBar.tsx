"use client";

import { cn } from "@/lib/cn";
import { CloseXIcon } from "@/components/icons/stroked";
import { SCENARIO_DEFINITIONS } from "@/lib/pressure/demo";
import type { DemoSelection } from "@/lib/app-context";

type DemoBarProps = {
  demo: DemoSelection;
  onChange: (demo: DemoSelection | null) => void;
};

/**
 * Presenter strip shown only while a deterministic scenario is active. Each
 * stage adds one real-world signal (game, rain, delay) and re-runs the same
 * engine, so the audience watches the score, WHY, surge and advice react.
 */
export function DemoBar({ demo, onChange }: DemoBarProps) {
  const def = SCENARIO_DEFINITIONS[demo.scenario];
  return (
    <div className="mx-gutter rounded border border-border-soft bg-surface px-[11px] py-[8px]" role="group" aria-label="Demo scenario">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-footnote text-blue">
          <span className="font-bold">Scenario</span> · {def.title}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Exit demo scenario"
          className="flex shrink-0 items-center text-blue outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <CloseXIcon className="h-[15px] w-[15px]" />
        </button>
      </div>
      <div className="mt-[6px] flex gap-[5px]" role="radiogroup" aria-label="Scenario stage">
        {def.stages.map((stage, i) => (
          <button
            key={stage.short}
            type="button"
            role="radio"
            aria-checked={i === demo.stage}
            aria-label={stage.label}
            onClick={() => onChange({ scenario: demo.scenario, stage: i })}
            className={cn(
              "min-w-0 flex-1 truncate rounded border px-1 py-[5px] text-footnote outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
              i === demo.stage ? "border-ink-deep bg-ink-deep text-on-ink" : i < demo.stage ? "border-ink-deep bg-canvas text-blue" : "border-border-soft bg-surface text-blue"
            )}
          >
            {stage.short}
          </button>
        ))}
      </div>
    </div>
  );
}
