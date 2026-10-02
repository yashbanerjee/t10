import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";

const userInput = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), role: z.nativeEnum(Role), password: z.string().min(12).max(200) }).strict();
const publicFields = { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } as const;

async function requireSuperAdmin() {
  const session = await getSession();
  return session && hasPermission(session.role, "USERS_WRITE") ? session : null;
}

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return failure("Super-admin access is required", 403);
  try { return success(await prisma.user.findMany({ select: publicFields, orderBy: [{ isActive: "desc" }, { name: "asc" }] })); }
  catch { return failure("Admin users require a connected database", 503); }
}

export async function POST(request: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return failure("Super-admin access is required", 403);
  const raw = await request.json().catch(() => null); const parsed = userInput.safeParse(raw);
  if (!parsed.success) return failure("User details are invalid. Passwords must be at least 12 characters.", 400, parsed.error.issues);
  try {
    const data = parsed.data;
    const user = await prisma.user.create({ data: { name: data.name, email: data.email, role: data.role, passwordHash: await bcrypt.hash(data.password, 12) }, select: publicFields });
    await recordAudit(session.sub, "CREATE_ADMIN_USER", "User", user.id, undefined, { email: user.email, role: user.role });
    return success(user, "Admin user created", { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("An account already uses that email address", 409);
    return failure("Could not create this account. Check the database connection.", 503);
  }
}
