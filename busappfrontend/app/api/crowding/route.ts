import { NextResponse } from "next/server";
import { fetchCrowding } from "@/lib/crowding/provider";
import type { CrowdingResponse } from "@/lib/crowding/types";

const CACHE_MS = 20_000;
let cache: { at: number; value: CrowdingResponse } | null = null;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!cache || Date.now() - cache.at >= CACHE_MS) cache = { at: Date.now(), value: await fetchCrowding() };
    return NextResponse.json(cache.value, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("crowding: PRT source failed", error);
    const unavailable: CrowdingResponse = {
      status: "unavailable",
      fetchedAt: null,
      observations: [],
      source: process.env.PRT_API_KEY ? "PRT BusTime API" : "PRT TrueTime page",
      message: "PRT passenger-load data is unavailable right now.",
    };
    return NextResponse.json(unavailable, { headers: { "Cache-Control": "no-store" } });
  }
}

