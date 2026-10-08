import { getPointsTable } from "@/lib/data";
import { success } from "@/lib/api";

export async function GET() {
  // Admin bookkeeping (which rows were typed in) stays out of the public feed.
  return success((await getPointsTable()).map(({ teamId, teamName, logoUrl, played, won, lost, noResult, points, netRunRate, position }) => ({ teamId, teamName, logoUrl, played, won, lost, noResult, points, netRunRate, position })));
}
