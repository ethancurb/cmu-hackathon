"use client";

import { cn } from "@/lib/cn";

type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
};

/**
 * 27px square (20px × 1.354), 3px radius. Unchecked is transparent with a 2px
 * (was 1.5px) --ink-deep border. Checked fills --lime, keeps the border, and
 * draws a black check — stroke scaled to 3px to match the border weight.
 */
export function Checkbox({ checked = false, onChange, label }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded border-2 border-ink-deep",
        checked ? "bg-lime" : "bg-transparent"
      )}
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="h-[14px] w-[14px]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6.3 4.6 9 10 3" stroke="var(--ink)" strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      ) : null}
    </button>
  );
}
