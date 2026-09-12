"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons/stroked";
import { cn } from "@/lib/cn";

type DisclosureProps = {
  /** Section label, e.g. "Advice". */
  label: string;
  /** One-line summary shown while collapsed (and kept while open), e.g. the advice headline. */
  summary?: string;
  defaultOpen?: boolean;
  /** Controlled mode. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

/**
 * Collapsed-by-default section: a full-width row button (label left, summary
 * right, chevron) that reveals its content in normal document flow, so
 * expanded panels stay reachable by ordinary scrolling on small screens.
 * Square corners, thin rule, mono labels — the same treatment as the other rows.
 */
export function Disclosure({ label, summary, defaultOpen = false, open: controlled, onOpenChange, children, className }: DisclosureProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const open = controlled ?? internal;
  const id = useId();
  function toggle() {
    const next = !open;
    if (controlled === undefined) setInternal(next);
    onOpenChange?.(next);
  }
  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-3 py-[9px] text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
      >
        <span className="whitespace-nowrap text-label text-blue">{label}</span>
        <span className="flex min-w-0 items-center gap-2">
          {summary ? <span className="min-w-0 truncate text-right text-row-title font-bold text-blue">{summary}</span> : null}
          <ChevronDownIcon className={cn("h-[11px] w-4 shrink-0 text-blue transition-transform motion-reduce:transition-none", open && "rotate-180")} />
        </span>
      </button>
      <div id={id} hidden={!open} className="pb-[9px]">
        {open ? children : null}
      </div>
    </div>
  );
}
