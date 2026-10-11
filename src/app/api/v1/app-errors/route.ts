import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";

const report = z.object({
  platform: z.string().trim().min(1).max(20),
  appVersion: z.string().trim().max(40).nullish(),
  screen: z.string().trim().max(120).nullish(),
  method: z.string().trim().max(10).nullish(),
  endpoint: z.string().trim().max(500).nullish(),
  statusCode: z.coerce.number().int().min(0).max(999).nullish(),
  message: z.string().trim().min(1).max(1000),
  details: z.string().max(4000).nullish(),
  device: z.string().trim().max(200).nullish(),
});

/** Per-address budget so a looping client cannot flood the log. */
const WINDOW_MS = 60_000;
const LIMIT = 30;
const recent = new Map<string, { start: number; count: number }>();

function allowed(address: string) {
  const now = Date.now();
  const entry = recent.get(address);
  if (!entry || now - entry.start > WINDOW_MS) {
    recent.set(address, { start: now, count: 1 });
    if (recent.size > 5000) for (const [key, value] of recent) if (now - value.start > WINDOW_MS) recent.delete(key);
    return true;
  }
  entry.count += 1;
  return entry.count <= LIMIT;
}

export async function POST(request: NextRequest) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowed(address)) return failure("Too many reports", 429);
  const parsed = report.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Invalid error report", 400);
  try {
    const record = await prisma.appErrorLog.create({ data: { ...parsed.data, ipAddress: address === "unknown" ? null : address } });
    return success({ id: record.id }, "Logged", { status: 201 });
  } catch {
    return failure("Could not store the report", 503);
  }
}
