import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { notifyAdminAndUser } from "@/lib/mail";
import { renderEmail } from "@/lib/email-template";
import { getPartnerBrochureUrl, PARTNER_REQUEST_SUBJECT, partnerRequestSchema } from "@/lib/partner-brochure";

export async function POST(request: NextRequest) {
  const parsed = partnerRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Check your name, email and mobile number and try again.", 400, parsed.error.issues);
  try {
    const record = await prisma.contactSubmission.create({ data: { ...parsed.data, subject: PARTNER_REQUEST_SUBJECT, message: "Requested the partnership brochure from the Become a partner page." } });
    const brochureUrl = await getPartnerBrochureUrl();
    await notifyAdminAndUser({
      admin: await renderEmail({
        subject: `New partner enquiry: ${record.name}`,
        preheader: `${record.name} wants to talk about partnering with United Tigers.`,
        eyebrow: "Partner with us",
        title: "New partner enquiry",
        intro: "Someone filled in the Partner with us form on the website. Get in touch with them to start the conversation.",
        details: [{ label: "Name", value: record.name }, { label: "Email", value: record.email }, { label: "Mobile", value: record.phone ?? "" }],
        cta: { label: "Open partner requests", href: "/admin/partnerRequests" },
      }),
      userEmail: record.email,
      user: await renderEmail({
        subject: "Thanks for getting in touch with United Tigers",
        preheader: "Our partnerships team will be in touch with you shortly.",
        eyebrow: "Partner with us",
        title: "Let’s build together",
        greeting: `Hello ${record.name},`,
        intro: "Thank you for your interest in partnering with United Tigers. Our partnerships team has your details and will be in touch shortly to talk about the opportunities in cricket’s fastest format.",
        details: [{ label: "Email", value: record.email }, { label: "Mobile", value: record.phone ?? "" }],
        cta: brochureUrl ? { label: "View the brochure", href: brochureUrl } : { label: "Meet our partners", href: "/partners" },
        note: "If any of these details are wrong, simply reply to this email.",
      }),
    });
    return success({ id: record.id, brochureUrl }, "Request received", { status: 201 });
  } catch {
    return failure("We could not save your request. Please try again later.", 503);
  }
}
