"use client";

import { useState } from "react";
import { PinIcon } from "@/components/icons/filled";
import { PencilIcon } from "@/components/icons/stroked";
import { useAddressSearch, type AddressResult, type NearPoint } from "@/lib/geocode";

type LocationFieldProps = {
  value: string;
  onChange?: (value: string) => void;
  /** Fired only when a real geocoded suggestion is picked (not on every
   * keystroke) — callers that care about map/route updates should key off
   * this, not `onChange`. */
  onSelectAddress?: (address: AddressResult) => void;
  /** Rider's current origin — results are ranked and labeled by distance
   * from here rather than from a fixed city-wide bias point. */
  near?: NearPoint;
};

function formatDistance(mi: number): string {
  return mi < 0.1 ? "<0.1 mi" : `${mi.toFixed(mi < 10 ? 1 : 0)} mi`;
}

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

/**
 * Full-width, 43px tall. The pencil is the affordance; there is no separate
 * edit button. Clicking it swaps the value span for a real text input in
 * place — commits on Enter or blur, Escape reverts to the previous value.
 * While editing, typing 3+ characters opens a live address dropdown
 * (Photon, key-free) below the field; picking a suggestion commits its
 * label as the value and reports the real coordinate via onSelectAddress.
 */
export function LocationField({ value, onChange, onSelectAddress, near }: LocationFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [highlighted, setHighlighted] = useState(0);
  const { results, loading } = useAddressSearch(editing ? draft : "", near);

  function commitText() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange?.(trimmed);
    else setDraft(value);
  }

  function selectAddress(address: AddressResult) {
    setEditing(false);
    setDraft(address.label);
    onChange?.(address.label);
    onSelectAddress?.(address);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  const showDropdown = editing && draft.trim().length >= 3;

  return (
    <div className="relative">
      <div className="flex h-control items-center gap-[11px] rounded border border-border bg-surface px-4">
        <PinIcon className="h-[22px] w-[22px] shrink-0" />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setHighlighted(0);
            }}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlighted((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlighted((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (results[highlighted]) selectAddress(results[highlighted]);
                else commitText();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="location-suggestions"
            aria-autocomplete="list"
            aria-label="Location"
            className={`min-w-0 flex-1 bg-transparent text-location-subhead text-blue ${FOCUS_RING}`}
          />
        ) : (
          <span className="flex-1 truncate text-location-subhead text-blue">{value}</span>
        )}
        <button
          type="button"
          onClick={() => {
            // Clearing the draft here (rather than leaving the old label
            // selected) means the rider can start typing immediately instead
            // of deleting the previous value first.
            setDraft("");
            setHighlighted(0);
            setEditing(true);
          }}
          aria-label="Edit location"
          className={`shrink-0 text-blue ${FOCUS_RING}`}
        >
          <PencilIcon className="h-[19px] w-[19px]" />
        </button>
      </div>

      {showDropdown ? (
        <div
          id="location-suggestions"
          role="listbox"
          aria-label="Address suggestions"
          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded border border-border-soft bg-surface"
        >
          {loading ? (
            <div className="px-4 py-3 text-body text-blue opacity-footnote">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-body text-blue opacity-footnote">No matches</div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.lat},${r.lng}`}
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onMouseEnter={() => setHighlighted(i)}
                // mousedown (not click) + preventDefault: keeps focus on the
                // input so it never blurs and races selectAddress's own
                // setEditing(false) — blur firing first would unmount this
                // dropdown before the click event had a chance to land.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectAddress(r);
                }}
                className={`flex w-full items-baseline justify-between gap-3 border-b border-rule px-4 py-3 text-left text-body last:border-b-0 ${
                  i === highlighted ? "bg-page" : ""
                } text-blue`}
              >
                <span className="min-w-0 truncate">{r.label}</span>
                {r.distanceMi !== null ? (
                  <span className="shrink-0 text-footnote opacity-footnote">{formatDistance(r.distanceMi)}</span>
                ) : null}
              </button>
            ))
          )}
          <div className="px-4 py-1 text-footnote text-blue opacity-footnote">Search by Photon · closest first · © OpenStreetMap contributors</div>
        </div>
      ) : null}
    </div>
  );
}
