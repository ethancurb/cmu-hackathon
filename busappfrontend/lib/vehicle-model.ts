export const ROOF_REVEAL_END = 0.4;
export const PANEL_REVEAL_START = 0.45;
export const MAX_BEND_DEGREES = 30;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

/** The roof clears first; the window/side assemblies follow after a short pause. */
export function revealParts(progress: number) {
  const value = clamp01(progress);
  return {
    roof: clamp01(value / ROOF_REVEAL_END),
    panels: clamp01((value - PANEL_REVEAL_START) / (1 - PANEL_REVEAL_START)),
  };
}

/** Position one accordion cross-section between the two articulated modules. */
export function bellowsFoldPose(index: number, foldCount: number, bendDegrees: number) {
  const count = Math.max(2, Math.round(foldCount));
  const t = clamp01(index / (count - 1));
  const angle = (Math.max(-MAX_BEND_DEGREES, Math.min(MAX_BEND_DEGREES, bendDegrees)) * Math.PI) / 180;
  const endX = -1.1 - 0.7 * Math.cos(angle);
  const endZ = 0.7 * Math.sin(angle);
  return {
    x: -0.4 * (1 - t) + endX * t,
    z: endZ * t,
    yaw: angle * t,
  };
}
