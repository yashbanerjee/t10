import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { failure, success } from "@/lib/api";
import { contactSubmissionSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = contactSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("Check the form fields and try again.", 400, parsed.error.issues);
  try {
    const record = await prisma.contactSubmission.create({ data: parsed.data });
    return success({ id: record.id }, "Message received", { status: 201 });
  } catch {
    if (process.env.NODE_ENV !== "production") return success({ id: "local-demo-submission" }, "Message received in demo mode", { status: 201 });
    return failure("We could not save your message. Please try again later.", 503);
  }
}

