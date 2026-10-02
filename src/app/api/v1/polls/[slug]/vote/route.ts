import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";

const voteInput = z.object({
  optionId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(7).max(30),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = voteInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Add your name, email, phone and a choice", 400, parsed.error.issues);
  const poll = await prisma.poll.findFirst({ where: { slug, isPublished: true }, include: { options: true } });
  if (!poll) return failure("This poll is not open", 404);
  if (poll.closesAt && poll.closesAt.getTime() < Date.now()) return failure("This poll has closed", 409);
  if (!poll.options.some((option) => option.id === parsed.data.optionId)) return failure("Choose one of the listed options", 400);
  try {
    await prisma.pollVote.create({ data: { pollId: poll.id, optionId: parsed.data.optionId, name: parsed.data.name, email: parsed.data.email.toLowerCase(), phone: parsed.data.phone } });
    return success({ ok: true }, "Vote counted", { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("This email has already voted in this poll", 409);
    return failure("The vote could not be saved", 503);
  }
}
