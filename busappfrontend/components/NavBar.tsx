"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons/stroked";
import { HamburgerIcon } from "@/components/icons/filled";
import { cn } from "@/lib/cn";

type NavBarProps = {
  /** Omit on screens with no back target — the wordmark then sits left-aligned
   * next to the hamburger, matching the wide reference's top-of-flow screens. */
  backLabel?: string;
  wordmark?: string;
  onBack?: () => void;
};

// Scenarios are no longer a public screen: deterministic demos stay reachable
// through `/?demo=<scenario>&stage=<n>` (presenter strip) and the DEMO API mode.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Pressure timeline" },
];

const focusRing = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

/**
 * 54px tall (40px × 1.354 viewport factor). With a backLabel: three-part row,
 * a grid with equal-width flanking columns keeps the wordmark truly (not just
 * visually) centered. Without one: two-part row, wordmark left, hamburger right.
 * The hamburger opens a small square-cornered panel with the app's screens.
 */
export function NavBar({ backLabel, wordmark = "LoadLine", onBack }: NavBarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const menuButton = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-label="Menu"
      aria-expanded={open}
      aria-controls="loadline-menu"
      className={`${focusRing} ${backLabel ? "justify-self-end" : ""}`}
    >
      <HamburgerIcon className="h-[22px] w-[23px]" />
    </button>
  );

  const menu = open ? (
    <div id="loadline-menu" role="menu" className="absolute right-gutter top-[50px] z-20 min-w-[200px] rounded border border-border-soft bg-surface py-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          role="menuitem"
          onClick={() => setOpen(false)}
          className={cn("block px-4 py-[9px] text-body text-blue hover:bg-canvas", pathname === link.href && "font-bold", focusRing)}
        >
          {link.label}
        </Link>
      ))}
    </div>
  ) : null;

  if (!backLabel) {
    return (
      <div className="relative flex h-[54px] items-center justify-between px-gutter">
        <span className="font-display text-wordmark text-ink">{wordmark}</span>
        {menuButton}
        {menu}
      </div>
    );
  }

  return (
    <div className="relative grid h-[54px] grid-cols-[1fr_auto_1fr] items-center px-gutter">
      <button type="button" onClick={onBack} className={`flex items-center gap-[5px] justify-self-start text-blue ${focusRing}`}>
        <ChevronLeftIcon className="h-[14px] w-[14px]" />
        <span className="text-nav-label">{backLabel}</span>
      </button>
      <span className="font-display text-wordmark text-ink">{wordmark}</span>
      {menuButton}
      {menu}
    </div>
  );
}
