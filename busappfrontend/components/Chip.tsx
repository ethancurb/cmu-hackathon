"use client";

import type { ReactNode } from "react";
import { CloseXIcon } from "@/components/icons/stroked";

type ChipProps = {
  icon: ReactNode;
  label: string;
  onDismiss?: () => void;
  /** When set, the icon + label become a button (e.g. opens a details popup); the X stays a separate dismiss control. */
  onClick?: () => void;
};

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

/** Dismissible chip: white, 1px --border-soft, 3px radius, filled glyph + text + stroked X. */
export function Chip({ icon, label, onDismiss, onClick }: ChipProps) {
  const content = (
    <>
      <span className="flex items-center">{icon}</span>
      <span className="text-label text-blue">{label}</span>
    </>
  );
  return (
    <div className="inline-flex items-center gap-2 rounded border border-border-soft bg-surface px-[11px] py-[5px]">
      {onClick ? (
        <button type="button" onClick={onClick} className={`flex items-center gap-2 ${FOCUS_RING}`}>
          {content}
        </button>
      ) : (
        <span className="flex items-center gap-2">{content}</span>
      )}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={`flex items-center text-blue ${FOCUS_RING}`}
        >
          <CloseXIcon className="h-[19px] w-[19px]" />
        </button>
      ) : null}
    </div>
  );
}
