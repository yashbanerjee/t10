import { getSession, grants, hasPermission, type SessionClaims } from "@/lib/auth";
import { failure, success } from "@/lib/api";

const descriptions: Record<SessionClaims["role"], string> = {
  SUPER_ADMIN: "Full access, including administrator accounts and audit records.",
  ADMIN: "Team, matches, statistics, publishing and inbox access.",
  EDITOR: "Newsroom, daily updates and media publishing.",
  STATISTICS_MANAGER: "Squad read access, fixtures and scorecard/statistics management.",
  CONTENT_MANAGER: "Publishing, media and website settings.",
};

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "USERS_WRITE")) return failure("Super-admin access is required", 403);
  const roles = Object.entries(grants).map(([name, permissions]) => ({ id: name, name: name.replaceAll("_", " "), description: descriptions[name as SessionClaims["role"]], permissions: permissions.includes("*") ? ["All permissions"] : permissions }));
  return success(roles);
}
