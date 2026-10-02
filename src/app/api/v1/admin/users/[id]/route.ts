import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";

const updateInput = z.object({ name: z.string().trim().min(2).max(100).optional(), email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(), role: z.nativeEnum(Role).optional(), isActive: z.boolean().optional(), password: z.string().min(12).max(200).optional() }).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one account field to update");
const publicFields = { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } as const;

async function requireSuperAdmin() {
  const session = await getSession();
  return session && hasPermission(session.role, "USERS_WRITE") ? session : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return failure("Super-admin access is required", 403);
  const { id } = await params;
  const raw = await request.json().catch(() => null); const parsed = updateInput.safeParse(raw);
  if (!parsed.success) return failure("Account update is invalid", 400, parsed.error.issues);
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return failure("Admin account not found", 404);
    if (id === session.sub && ((parsed.data.role && parsed.data.role !== "SUPER_ADMIN") || parsed.data.isActive === false)) return failure("You cannot remove your own super-admin access", 409);
    if (existing.role === "SUPER_ADMIN" && existing.isActive && (parsed.data.role && parsed.data.role !== "SUPER_ADMIN" || parsed.data.isActive === false)) {
      const otherActiveAdmins = await prisma.user.count({ where: { id: { not: id }, role: "SUPER_ADMIN", isActive: true } });
      if (otherActiveAdmins === 0) return failure("Keep at least one active super-admin account", 409);
    }
    const { password, ...fields } = parsed.data;
    const updated = await prisma.user.update({ where: { id }, data: { ...fields, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) }, select: publicFields });
    await recordAudit(session.sub, "UPDATE_ADMIN_USER", "User", id, { role: existing.role, isActive: existing.isActive }, { role: updated.role, isActive: updated.isActive });
    return success(updated, "Admin account updated");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return failure("An account already uses that email address", 409);
    return failure("Could not update this account", 503);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session) return failure("Super-admin access is required", 403);
  const { id } = await params;
  if (id === session.sub) return failure("You cannot deactivate your own account", 409);
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return failure("Admin account not found", 404);
    if (user.role === "SUPER_ADMIN" && user.isActive && await prisma.user.count({ where: { id: { not: id }, role: "SUPER_ADMIN", isActive: true } }) === 0) return failure("Keep at least one active super-admin account", 409);
    const updated = await prisma.user.update({ where: { id }, data: { isActive: false }, select: publicFields });
    await recordAudit(session.sub, "DEACTIVATE_ADMIN_USER", "User", id, { isActive: user.isActive }, { isActive: false });
    return success(updated, "Admin account deactivated");
  } catch { return failure("Could not deactivate this account", 503); }
}
