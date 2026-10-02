import { NextRequest } from "next/server";
import { getStatsLeaderboard } from "@/lib/stats";
import { success } from "@/lib/api";

export async function GET(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("season") ?? 2026);
  const season = Number.isInteger(raw) && raw >= 2026 && raw <= 2100 ? raw : 2026;
  return success(await getStatsLeaderboard(season));
}

