import { NextResponse } from "next/server";
import { fetchCrowdingCached } from "@/lib/crowding/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const value = await fetchCrowdingCached();
  return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } });
}
