"use client";

import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "@/components/icons/stroked";

type SelectProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Primary is sentence case; secondary is uppercase with .08em tracking. That case
   * difference is the only thing signalling rank between the two. */
  variant?: "primary" | "secondary";
  label: string;
};

/**
 * Row of two elsewhere, 11px gap, 43px tall, stroked chevron-down at right.
 * A real native <select> underneath (full keyboard operability and ARIA for
 * free) with the OS chrome hidden and our own chevron drawn over it.
 */
export function Select({ value, options, onChange, variant = "primary", label }: SelectProps) {
  return (
    <div
      className={cn(
        "relative flex h-control items-center rounded border border-border bg-surface px-4 text-blue",
        variant === "primary" ? "text-descriptor" : "text-select-secondary uppercase tracking-loud"
      )}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full min-w-0 appearance-none bg-transparent pr-[27px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 h-[11px] w-4 shrink-0" />
    </div>
  );
}
