import { getSession, hasPermission } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { checkPush } from "@/lib/push";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "SETTINGS_WRITE")) return failure("You do not have permission to check Firebase", 403);
  const result = await checkPush();
  if (!result.ok) return failure(result.message, result.projectId ? 502 : 400);
  return success({ projectId: result.projectId, source: result.source }, result.message);
}
