import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { notifyAdminAndUser } from "@/lib/mail";
import { renderEmail } from "@/lib/email-template";

const entryInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(7).max(30),
  answer: z.string().trim().min(2).max(1000),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = entryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Add your name, email, phone and answer", 400, parsed.error.issues);
  const contest = await prisma.contest.findFirst({ where: { slug, isPublished: true } });
  if (!contest) return failure("This contest is not open", 404);
  if (contest.closesAt && contest.closesAt.getTime() < Date.now()) return failure("This contest has closed", 409);
  try {
    const entry = await prisma.contestEntry.create({ data: { contestId: contest.id, name: parsed.data.name, email: parsed.data.email.toLowerCase(), phone: parsed.data.phone, answer: parsed.data.answer } });
    const prize = contest.prize ? [{ label: "Prize", value: contest.prize }] : [];
    await notifyAdminAndUser({
      admin: await renderEmail({
        subject: `New contest entry: ${contest.title}`,
        preheader: `${entry.name} entered ${contest.title}.`,
        eyebrow: "Fan contest",
        title: "New contest entry",
        intro: `A fan has entered “${contest.title}”.`,
        details: [{ label: "Contest", value: contest.title }, ...prize, { label: "Name", value: entry.name }, { label: "Email", value: entry.email }, { label: "Phone", value: entry.phone }],
        message: { label: "Their answer", body: entry.answer },
        cta: { label: "Open contests", href: "/admin/contests" },
      }),
      userEmail: entry.email,
      user: await renderEmail({
        subject: `You're in: ${contest.title}`,
        preheader: "Your United Tigers contest entry has been received. Good luck!",
        eyebrow: "Entry confirmed",
        title: "You’re in the hunt",
        greeting: `Hello ${entry.name},`,
        intro: "Thanks for entering. We have your entry, and one entry is kept for each email address. Good luck!",
        details: [{ label: "Contest", value: contest.title }, ...prize],
        message: { label: "Your answer", body: entry.answer },
        cta: { label: "Visit the Fan Zone", href: "/fan" },
      }),
    });
    return success({ ok: true }, "Entry received", { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("This email is already entered in this contest", 409);
    return failure("The entry could not be saved", 503);
  }
}
