/**
 * Stroked glyphs represent actions and controls: 2px stroke, square caps,
 * no rounding, currentColor — they take the color of the text beside them.
 */
type IconProps = { className?: string };

const strokeProps = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" className={className} xmlns="http://www.w3.org/2000/svg" {...strokeProps}>
      <path d="M9.5 2.5l2 2-7 7H2.5v-2z" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" className={className} xmlns="http://www.w3.org/2000/svg" {...strokeProps}>
      <circle cx="7" cy="7" r="5.25" />
      <path d="M7 4.2v3l2.2 1.3" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 10 6" className={className} xmlns="http://www.w3.org/2000/svg" {...strokeProps}>
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 6 10" className={className} xmlns="http://www.w3.org/2000/svg" {...strokeProps}>
      <path d="M1 1l4 4-4 4" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 6 10" className={className} xmlns="http://www.w3.org/2000/svg" {...strokeProps}>
      <path d="M5 1L1 5l4 4" />
    </svg>
  );
}

/** Not a font glyph, not a rounded icon-library X: two 2px strokes crossing at 45°, square caps, 14px box. */
export function CloseXIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square">
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}
