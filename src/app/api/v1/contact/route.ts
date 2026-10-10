import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { contactSubmissionSchema } from "@/lib/validation";
import { notifyAdmin } from "@/lib/mail";
import { renderEmail } from "@/lib/email-template";

export async function POST(request: NextRequest) {
  const parsed = contactSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Check the form fields and try again.", 400, parsed.error.issues);
  try {
    const record = await prisma.contactSubmission.create({ data: parsed.data });
    await notifyAdmin(await renderEmail({
      subject: `Contact: ${record.subject}`,
      preheader: `${record.name} sent a message through the website.`,
      eyebrow: "Contact form",
      title: "New message",
      intro: "A visitor sent a message through the website contact form. Reply to them directly at their email address.",
      details: [{ label: "Name", value: record.name }, { label: "Email", value: record.email }, ...(record.phone ? [{ label: "Phone", value: record.phone }] : []), { label: "Subject", value: record.subject }],
      message: { label: "Message", body: record.message },
      cta: { label: "Open messages", href: "/admin/contacts" },
    }), record.email);
    return success({ id: record.id }, "Message received", { status: 201 });
  } catch {
    if (process.env.NODE_ENV !== "production") return success({ id: "local-demo-submission" }, "Message received in demo mode", { status: 201 });
    return failure("We could not save your message. Please try again later.", 503);
  }
}

