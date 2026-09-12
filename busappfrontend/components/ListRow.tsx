"use client";

import { Checkbox } from "@/components/Checkbox";
import { ChevronRightIcon } from "@/components/icons/stroked";

type ListRowProps = {
  title: string;
  subtitle: string;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
  onClick?: () => void;
};

/**
 * 61px tall (45px × 1.354). Checkbox flush to the gutter, 22px gap, two-line
 * text block (Bold title over Regular subtitle), chevron pushed to the far edge.
 */
export function ListRow({ title, subtitle, checked = false, onToggle, onClick }: ListRowProps) {
  return (
    <div className="flex h-[61px] items-center gap-[22px] px-gutter">
      <Checkbox checked={checked} onChange={onToggle} label={title} />
      <button type="button" onClick={onClick} className="flex flex-1 items-center justify-between gap-[11px] text-left">
        <span className="flex flex-col">
          <span className="text-row-title font-bold text-blue">{title}</span>
          <span className="text-body text-blue">{subtitle}</span>
        </span>
        <ChevronRightIcon className="h-4 w-[11px] shrink-0 text-blue" />
      </button>
    </div>
  );
}
