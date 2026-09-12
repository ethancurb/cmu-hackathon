"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PrimaryButtonProps = {
  label: string;
  /** Filled glyph pinned to the left when the action has a cost/duration. */
  icon?: ReactNode;
  /** Right-aligned value, e.g. "2 min", used together with icon. */
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * Full content width, 32px tall, --ink-deep fill, 2px radius, no border.
 * Icon and value sit in equal-width flanking columns so the label stays
 * centered whether or not they're present.
 */
export function PrimaryButton({ label, icon, value, onClick, disabled = false }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-control w-full grid-cols-[1fr_auto_1fr] items-center rounded bg-ink-deep px-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-ink",
        disabled && "opacity-40"
      )}
    >
      <span className="flex items-center">{icon}</span>
      <span className="text-center text-button-label uppercase tracking-loud text-on-ink">{label}</span>
      <span className="text-right text-button-label text-on-ink">{value}</span>
    </button>
  );
}
