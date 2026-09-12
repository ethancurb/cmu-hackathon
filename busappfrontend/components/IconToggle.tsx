"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type IconToggleProps = {
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  label?: string;
  /** Utility buttons (map panel bottom corners) use the same 54px square
   * treatment but never carry an indicator — set false to omit it entirely. */
  showIndicator?: boolean;
};

/**
 * 54px square (40px × 1.354), white, 1px --border-soft, 3px radius, filled
 * --ink-deep glyph. The active one carries a --lime bar underneath, full
 * button width, ~8px tall, 3px radius, separated by a 3px gap. The lime is
 * below the button, not inside it.
 */
export function IconToggle({ icon, active = false, onClick, label, showIndicator = true }: IconToggleProps) {
  return (
    <div className="inline-flex flex-col items-center gap-[3px]">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={showIndicator ? active : undefined}
        aria-label={label}
        className="flex h-[54px] w-[54px] items-center justify-center rounded border border-border-soft bg-surface"
      >
        {icon}
      </button>
      {showIndicator ? (
        <span className={cn("h-2 w-[54px] rounded", active ? "bg-lime" : "bg-transparent")} aria-hidden />
      ) : null}
    </div>
  );
}
