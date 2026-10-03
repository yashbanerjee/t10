import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { notifyAdminAndUser } from "@/lib/mail";

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
    const summary = [`Contest: ${contest.title}`, contest.prize ? `Prize: ${contest.prize}` : "", `Name: ${entry.name}`, `Email: ${entry.email}`, `Phone: ${entry.phone}`, "", entry.answer].filter(Boolean).join("\n");
    await notifyAdminAndUser({
      adminSubject: `Contest entry: ${contest.title}`,
      adminText: summary,
      userEmail: entry.email,
      userSubject: `Your United Tigers contest entry`,
      userText: `Hello ${entry.name},\n\nWe have your entry. One entry is kept for this email address.\n\n${summary}`,
    });
    return success({ ok: true }, "Entry received", { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("This email is already entered in this contest", 409);
    return failure("The entry could not be saved", 503);
  }
}
