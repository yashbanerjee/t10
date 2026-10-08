import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { notifyAdminAndUser } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-settings";
import { getPartnerBrochureUrl, PARTNER_REQUEST_SUBJECT, partnerRequestSchema } from "@/lib/partner-brochure";

export async function POST(request: NextRequest) {
  const parsed = partnerRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Check your name, email and mobile number and try again.", 400, parsed.error.issues);
  try {
    const record = await prisma.contactSubmission.create({ data: { ...parsed.data, subject: PARTNER_REQUEST_SUBJECT, message: "Requested the partnership brochure from the Become a partner page." } });
    const brochureUrl = await getPartnerBrochureUrl();
    const brochureLink = brochureUrl ? (brochureUrl.startsWith("http") ? brochureUrl : `${await getSiteUrl()}${brochureUrl}`) : "";
    const details = [`Name: ${record.name}`, `Email: ${record.email}`, `Mobile: ${record.phone}`].join("\n");
    await notifyAdminAndUser({
      adminSubject: PARTNER_REQUEST_SUBJECT,
      adminText: `${details}\n\nThey asked for the partnership brochure from the Become a partner page.`,
      userEmail: record.email,
      userSubject: "Your United Tigers partnership request",
      userText: brochureLink
        ? `Hello ${record.name},\n\nThank you for your interest in partnering with United Tigers. Your brochure is ready:\n${brochureLink}\n\nOur partnerships team will be in touch at this email address.\n`
        : `Hello ${record.name},\n\nThank you for your interest in partnering with United Tigers. Our partnerships team will email the brochure to this address and be in touch shortly.\n`,
    });
    return success({ id: record.id, brochureUrl }, "Request received", { status: 201 });
  } catch {
    return failure("We could not save your request. Please try again later.", 503);
  }
}
