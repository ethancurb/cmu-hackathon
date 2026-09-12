"use client";

import type { ReactNode } from "react";
import { CloseXIcon } from "@/components/icons/stroked";

type ChipProps = {
  icon: ReactNode;
  label: string;
  onDismiss?: () => void;
};

/** Dismissible chip: white, 1px --border-soft, 3px radius, filled glyph + text + stroked X. */
export function Chip({ icon, label, onDismiss }: ChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded border border-border-soft bg-surface px-[11px] py-[5px]">
      <span className="flex items-center">{icon}</span>
      <span className="text-label text-blue">{label}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex items-center text-blue outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
      >
        <CloseXIcon className="h-[19px] w-[19px]" />
      </button>
    </div>
  );
}
