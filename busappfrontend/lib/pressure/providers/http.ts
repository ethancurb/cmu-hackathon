// Bounded shared cache and in-flight coalescing per server process. No secret URLs logged.
type Entry = { value?: unknown; saved: number; failed: number; pending?: Promise<unknown> };
const cache = new Map<string, Entry>();
export async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<{ value: T; fetchedAt: string; stale: boolean }> {
  let entry = cache.get(key);
  if (!entry) { entry = {saved:0,failed:0}; cache.set(key,entry); }
  if (cache.size > 128) cache.delete(cache.keys().next().value!);
  if (entry.value !== undefined && Date.now() - entry.saved < ttl) return {value:entry.value as T,fetchedAt:new Date(entry.saved).toISOString(),stale:false};
  if (Date.now() - entry.failed < 30_000) {
    if (entry.value !== undefined && Date.now()-entry.saved < ttl*6) return {value:entry.value as T,fetchedAt:new Date(entry.saved).toISOString(),stale:true};
    throw new Error("Provider cooling down");
  }
  if (!entry.pending) entry.pending = loader().then(value => {entry!.value=value;entry!.saved=Date.now();return value;}).catch(e=>{entry!.failed=Date.now();throw e;}).finally(()=>{entry!.pending=undefined;});
  try { const value = await entry.pending as T; return {value,fetchedAt:new Date(entry.saved).toISOString(),stale:false}; }
  catch (e) { if (entry.value !== undefined && Date.now()-entry.saved < ttl*6) return {value:entry.value as T,fetchedAt:new Date(entry.saved).toISOString(),stale:true}; throw e; }
}
export async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url,{signal:AbortSignal.timeout(6000),cache:"no-store"});
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
  return response.json();
}
export function record(v: unknown): Record<string, unknown> { return v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string,unknown> : {}; }
export function list(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }
export function str(v: unknown) { return typeof v === "string" ? v : ""; }
export function num(v: unknown): number | null { return typeof v === "number" && Number.isFinite(v) ? v : null; }
