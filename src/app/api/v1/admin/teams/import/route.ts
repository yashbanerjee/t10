import { NextRequest } from "next/server";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { importLeagueTeams } from "@/lib/teams";

/** Adds the six Abu Dhabi T10 franchises to the Teams section in one click. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "TEAM_WRITE")) return failure("You do not have permission to edit teams", 403);
  try {
    const result = await importLeagueTeams();
    await recordAudit(session.sub, "IMPORT", "teams", undefined, undefined, result, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success(result, result.created ? `${result.created} team${result.created === 1 ? "" : "s"} added` : "All league teams are already here");
  } catch {
    return failure("The teams could not be imported. Check the database connection.", 503);
  }
}
