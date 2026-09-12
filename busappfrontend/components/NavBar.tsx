"use client";

import { ChevronLeftIcon } from "@/components/icons/stroked";
import { HamburgerIcon } from "@/components/icons/filled";

type NavBarProps = {
  /** Omit on screens with no back target — the wordmark then sits left-aligned
   * next to the hamburger, matching the wide reference's top-of-flow screens. */
  backLabel?: string;
  wordmark?: string;
  onBack?: () => void;
  onMenu?: () => void;
};

/**
 * 54px tall (40px × 1.354 viewport factor). With a backLabel: three-part row,
 * a grid with equal-width flanking columns keeps the wordmark truly (not just
 * visually) centered. Without one: two-part row, wordmark left, hamburger right.
 */
export function NavBar({ backLabel, wordmark = "LoadLine", onBack, onMenu }: NavBarProps) {
  if (!backLabel) {
    return (
      <div className="flex h-[54px] items-center justify-between px-gutter">
        <span className="font-display text-wordmark text-ink">{wordmark}</span>
        <button type="button" onClick={onMenu} aria-label="Menu">
          <HamburgerIcon className="h-[22px] w-[23px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid h-[54px] grid-cols-[1fr_auto_1fr] items-center px-gutter">
      <button type="button" onClick={onBack} className="flex items-center gap-[5px] justify-self-start text-blue">
        <ChevronLeftIcon className="h-[14px] w-[14px]" />
        <span className="text-nav-label">{backLabel}</span>
      </button>
      <span className="font-display text-wordmark text-ink">{wordmark}</span>
      <button type="button" onClick={onMenu} aria-label="Menu" className="justify-self-end">
        <HamburgerIcon className="h-[22px] w-[23px]" />
      </button>
    </div>
  );
}
