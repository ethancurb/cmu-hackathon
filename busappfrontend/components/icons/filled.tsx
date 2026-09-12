import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Filled glyphs represent physical things in the world: solid --ink-deep,
 * no stroke, regardless of surrounding text color. The one spec exception is
 * an icon placed on an --ink-deep surface (e.g. the primary button's walk
 * glyph), which must go --on-ink instead — pass `style={{ color: "var(--on-ink)" }}`
 * for that case; `style` wins over the baked-in text-ink-deep class reliably,
 * since Tailwind utility class precedence between two same-specificity
 * classes isn't guaranteed by JSX ordering.
 */
type IconProps = { className?: string; style?: CSSProperties };

const filledBase = "text-ink-deep";

export function PinIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0C4.7 0 2 2.7 2 6c0 4.6 6 10 6 10s6-5.4 6-10c0-3.3-2.7-6-6-6zm0 8.5A2.5 2.5 0 1 1 8 3.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export function CloudIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.6 12a3.4 3.4 0 0 1-.5-6.77 4 4 0 0 1 7.65-1.77A3.4 3.4 0 0 1 11.4 12H4.6z" />
    </svg>
  );
}

/** Weather chip: clear-sky state (paired with CloudIcon for overcast/precipitation). */
export function SunIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3.2" />
      <path d="M7.25 0h1.5v2.4h-1.5V0zm0 13.6h1.5V16h-1.5v-2.4zM0 7.25h2.4v1.5H0v-1.5zm13.6 0H16v1.5h-2.4v-1.5zM2.34 3.34l1.06-1.06 1.7 1.7-1.06 1.06-1.7-1.7zm8.56 8.56 1.06-1.06 1.7 1.7-1.06 1.06-1.7-1.7zM11.9 2.28l1.06 1.06-1.7 1.7-1.06-1.06 1.7-1.7zM3.34 13.66l1.06 1.06 1.7-1.7-1.06-1.06-1.7 1.7z" />
    </svg>
  );
}

export function BusIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z" />
      <rect x="3.5" y="3.5" width="9" height="3.5" fill="var(--canvas)" />
      <rect x="2" y="11.5" width="2" height="2" />
      <rect x="12" y="11.5" width="2" height="2" />
    </svg>
  );
}

export function ListIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="3" height="3" />
      <rect x="5.5" y="2" width="9.5" height="3" />
      <rect x="1" y="6.5" width="3" height="3" />
      <rect x="5.5" y="6.5" width="9.5" height="3" />
      <rect x="1" y="11" width="3" height="3" />
      <rect x="5.5" y="11" width="9.5" height="3" />
    </svg>
  );
}

export function MapIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 2.5 5.5 1l5 1.5L15 1v12.5L10.5 15l-5-1.5L1 15V2.5z" />
    </svg>
  );
}

export function WalkIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9.3" cy="2.6" r="1.5" />
      <path d="M7.8 5.2 11 6l1.3 2.9-1.4.6L10 7.8l-.9.9 1.6 2-1 3.6-1.4-.4.9-3.1-2-2-1.1 1.3v3.3H4.6V9.2l2.1-2.4-1.4-1.3 1-1.1z" />
    </svg>
  );
}

export function SeatIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2h2v6h4V2h2v7a1 1 0 0 1-1 1H8v2h3v2H5v-2h1v-2H5a1 1 0 0 1-1-1V2z" />
    </svg>
  );
}

/** Map panel utility button: opens feedback/comments. */
export function ChatIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6l-3.5 3v-3H2a1 1 0 0 1-1-1V2z" />
    </svg>
  );
}

/** Map panel utility button: view crowding stats. */
export function StatsIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="9" width="3" height="6" />
      <rect x="6.5" y="5" width="3" height="10" />
      <rect x="12" y="1" width="3" height="14" />
    </svg>
  );
}

/** Map panel utility button: recenter/locate. */
export function CrosshairIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.25 0h1.5v3h-1.5V0zm0 13h1.5v3h-1.5v-3zM0 7.25h3v1.5H0v-1.5zm13 0h3v1.5h-3v-1.5z" />
      <circle cx="8" cy="8" r="3" />
    </svg>
  );
}

export function HamburgerIcon({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 17 16" className={cn(filledBase, className)} style={style} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="17" height="2" />
      <rect x="0" y="7" width="17" height="2" />
      <rect x="0" y="14" width="17" height="2" />
    </svg>
  );
}
