import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { sendTestMail } from "@/lib/mail";

export const runtime = "nodejs";
export const maxDuration = 30;

const input = z.object({ to: z.string().trim().email().max(200).optional().or(z.literal("")) });

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "SETTINGS_WRITE")) return failure("You do not have permission to send test mail", 403);
  const parsed = input.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return failure("Enter a valid test email address", 400);
  try {
    const sent = await sendTestMail(parsed.data.to || undefined);
    await recordAudit(session.sub, "TEST_MAIL", "settings", undefined, undefined, sent, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success(sent, `Test email sent to ${sent.to}.`);
  } catch (error) {
    return failure(`Test email failed: ${error instanceof Error ? error.message : "unknown error"}`, 502);
  }
}
