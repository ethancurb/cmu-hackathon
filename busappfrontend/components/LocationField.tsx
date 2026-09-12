"use client";

import { useState } from "react";
import { PinIcon } from "@/components/icons/filled";
import { PencilIcon } from "@/components/icons/stroked";

type LocationFieldProps = {
  value: string;
  onChange?: (value: string) => void;
};

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

/**
 * Full-width, 43px tall. The pencil is the affordance; there is no separate
 * edit button. Clicking it swaps the value span for a real text input in
 * place — commits on Enter or blur, Escape reverts to the previous value.
 */
export function LocationField({ value, onChange }: LocationFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange?.(trimmed);
    else setDraft(value);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div className="flex h-control items-center gap-[11px] rounded border border-border bg-surface px-4">
      <PinIcon className="h-[22px] w-[22px] shrink-0" />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          aria-label="Location"
          className={`min-w-0 flex-1 bg-transparent text-location-subhead text-blue ${FOCUS_RING}`}
        />
      ) : (
        <span className="flex-1 truncate text-location-subhead text-blue">{value}</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit location"
        className={`shrink-0 text-blue ${FOCUS_RING}`}
      >
        <PencilIcon className="h-[19px] w-[19px]" />
      </button>
    </div>
  );
}
