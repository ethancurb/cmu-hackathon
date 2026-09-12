// Pittsburgh-local time phrases for the chat planner. Every result is an ISO
// instant; the local calendar is always America/New_York, whatever the server runs in.
const TIMEZONE = "America/New_York";

export function localDate(from: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(from);
}

/** The Pittsburgh-local wall-clock hour/minute an ISO instant falls on. */
export function localHourMinute(at: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(at));
  return { hour: Number(parts.find((p) => p.type === "hour")?.value), minute: Number(parts.find((p) => p.type === "minute")?.value) };
}

/** A local date + clock time as ISO, trying both Eastern offsets so DST is handled. */
export function localToIso(date: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0"), mm = String(minute).padStart(2, "0");
  for (const offset of ["-04:00", "-05:00"]) {
    const candidate = new Date(`${date}T${hh}:${mm}:00${offset}`);
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(candidate);
    const h = Number(parts.find((p) => p.type === "hour")?.value), m = Number(parts.find((p) => p.type === "minute")?.value);
    if (h === hour && m === minute) return candidate.toISOString();
  }
  return new Date(`${date}T${hh}:${mm}:00-04:00`).toISOString();
}

export function shiftDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export type TimeIntent =
  | { kind: "at"; at: string; arriveBy: boolean; assumed?: string }
  | { kind: "now" }
  | { kind: "shift"; minutes: number }
  | { kind: "after_event" }
  | null;

const CLOCK = /\b(?:at|by|around|before|for|@)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?\b/i;
const BARE_CLOCK = /\b(\d{1,2})(?::(\d{2}))\s*(a\.?m\.?|p\.?m\.?)?\b|\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/i;

/**
 * Parses "by 7", "at 6:30 pm", "tomorrow at 9", "in 20 minutes", "leave later",
 * "after the game". Without am/pm the next future occurrence is chosen and
 * reported as an assumption so the reply can say so.
 */
export function parseTimeIntent(text: string, now = new Date()): TimeIntent {
  const t = text.toLowerCase();
  if (/\bafter the (game|concert|show|event|match)\b|\bafter it ends\b|\bavoid the (busiest|rush|surge|crowd)/.test(t)) return { kind: "after_event" };
  const relative = t.match(/\bin\s+(\d{1,3})\s*(min|minutes|mins|hour|hours|h)\b/);
  if (relative) {
    const n = Number(relative[1]) * (/^h/.test(relative[2]) ? 60 : 1);
    return { kind: "at", at: new Date(now.getTime() + n * 60_000).toISOString(), arriveBy: false };
  }
  if (/\b(leave |go |depart )?(later|a bit later|little later)\b/.test(t)) return { kind: "shift", minutes: t.match(/(\d{1,3})\s*(min|minutes)/) ? Number(t.match(/(\d{1,3})\s*(min|minutes)/)![1]) : 30 };
  if (/\b(leave |go |depart )?(earlier|sooner|a bit earlier)\b/.test(t)) return { kind: "shift", minutes: -(t.match(/(\d{1,3})\s*(min|minutes)/) ? Number(t.match(/(\d{1,3})\s*(min|minutes)/)![1]) : 30) };
  if (/\b(right now|leave now|asap|immediately)\b/.test(t)) return { kind: "now" };

  const arriveBy = /\b(by|before|arrive|there by|get there|be there|make it)\b/.test(t) && !/\bleave (at|around)\b/.test(t);
  const m = t.match(CLOCK) ?? t.match(BARE_CLOCK);
  if (!m) {
    if (/\btonight\b/.test(t)) return { kind: "at", at: localToIso(localDate(now), 19, 0), arriveBy: false, assumed: "tonight = 7:00 PM" };
    if (/\btomorrow morning\b/.test(t)) return { kind: "at", at: localToIso(shiftDays(localDate(now), 1), 8, 0), arriveBy: false, assumed: "tomorrow morning = 8:00 AM" };
    return null;
  }
  const hourRaw = Number(m[1] ?? m[4]);
  const minute = Number(m[2] ?? 0);
  const meridiem = (m[3] ?? m[5] ?? "").replace(/\./g, "");
  if (!Number.isFinite(hourRaw) || hourRaw > 23 || minute > 59) return null;
  const tomorrow = /\btomorrow\b/.test(t);
  const today = localDate(now);
  const date = tomorrow ? shiftDays(today, 1) : today;

  if (meridiem) {
    let hour = hourRaw % 12;
    if (meridiem === "pm") hour += 12;
    let at = localToIso(date, hour, minute);
    let assumed: string | undefined;
    if (!tomorrow && Date.parse(at) < now.getTime() - 5 * 60_000) {
      at = localToIso(shiftDays(today, 1), hour, minute);
      assumed = "that time has passed today, so tomorrow";
    }
    return { kind: "at", at, arriveBy, assumed };
  }
  // No am/pm: earliest future occurrence among the candidates, preferring today.
  const candidates = hourRaw >= 13 ? [hourRaw] : hourRaw === 0 ? [0] : [hourRaw, hourRaw + 12];
  const options = [date, shiftDays(date, 1)].flatMap((d) => candidates.map((h) => ({ at: localToIso(d, h % 24, minute), h })));
  const next = options.find((o) => Date.parse(o.at) > now.getTime() + 5 * 60_000) ?? options[options.length - 1];
  const label = `${next.h % 12 === 0 ? 12 : next.h % 12}:${String(minute).padStart(2, "0")} ${next.h >= 12 ? "PM" : "AM"}`;
  return { kind: "at", at: next.at, arriveBy, assumed: candidates.length > 1 ? `${hourRaw} read as ${label}` : undefined };
}
