import { z } from "zod";
import { prisma } from "@/lib/db";

/** Brochure requests are stored as contact submissions with this subject, so no extra table is needed. */
export const PARTNER_REQUEST_SUBJECT = "Partner brochure request";

export const partnerRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+[0-9]{1,4} [0-9]{6,14}$/, "Enter a valid mobile number"),
});

export function readBrochureUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || /["'()\\\s]/.test(trimmed)) return "";
  return trimmed.startsWith("/") || /^https?:\/\//.test(trimmed) ? trimmed : "";
}

export async function getPartnerBrochureUrl() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "partnerBrochure" } });
    return readBrochureUrl(row?.value);
  } catch {
    return "";
  }
}
