"use client";

import { PinIcon } from "@/components/icons/filled";
import { PencilIcon } from "@/components/icons/stroked";

type LocationFieldProps = {
  value: string;
  onEdit?: () => void;
};

/** Full-width, 43px tall. The pencil is the affordance; there is no separate edit button. */
export function LocationField({ value, onEdit }: LocationFieldProps) {
  return (
    <div className="flex h-control items-center gap-[11px] rounded border border-border bg-surface px-4">
      <PinIcon className="h-[22px] w-[22px] shrink-0" />
      <span className="flex-1 truncate text-location-subhead text-blue">{value}</span>
      <button type="button" onClick={onEdit} aria-label="Edit location" className="shrink-0 text-blue">
        <PencilIcon className="h-[19px] w-[19px]" />
      </button>
    </div>
  );
}
