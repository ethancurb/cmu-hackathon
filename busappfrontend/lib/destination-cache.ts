"use client";

export type CachedDestination = { label: string; lat: number; lng: number };

const STORAGE_KEY = "loadline:destination";

/** Reads the last address the rider searched, if any. Guarded for SSR (no
 * `window` during the server render) and for environments where
 * localStorage throws (private browsing, blocked storage) — a cache miss
 * just means "nothing searched yet, use the default," never a crash. */
export function loadCachedDestination(): CachedDestination | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.label === "string" && typeof parsed?.lat === "number" && typeof parsed?.lng === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Overwrites the cached address — the point of this cache is "the most
 * recent pick," not a history, so there's nothing to merge. */
export function saveCachedDestination(destination: CachedDestination): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(destination));
  } catch {
    // Storage full or blocked — search still works for this session, it
    // just won't survive a reload.
  }
}
