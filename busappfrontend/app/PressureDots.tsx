import { LEVEL_COLOR, LEVEL_WORD } from "@/lib/pressure/format";
import type { PressureLevel } from "@/lib/pressure/types";

const DOTS = 10;

/** Ten square-ish dots, one per ten index points, filled in the level's
 * restrained color. The glyph carries the state; the chrome stays neutral. */
export function PressureDots({ score, level, size = 11 }: { score: number; level: PressureLevel; size?: number }) {
  const filled = Math.max(0, Math.min(DOTS, Math.round(score / DOTS)));
  return (
    <div className="flex items-center" style={{ gap: size * 0.55 }} role="img" aria-label={`Transit pressure ${score} of 100, ${LEVEL_WORD[level]}`}>
      {Array.from({ length: DOTS }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="block rounded-full border border-ink-deep"
          style={{
            width: size,
            height: size,
            background: i < filled ? LEVEL_COLOR[level] : "var(--surface)",
            borderColor: i < filled ? LEVEL_COLOR[level] : "var(--border-soft)",
          }}
        />
      ))}
    </div>
  );
}
