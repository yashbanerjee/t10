import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/db";

export type SessionClaims = { sub: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "STATISTICS_MANAGER" | "CONTENT_MANAGER"; demo?: boolean };

const localSecret = "united-tigers-local-development-only-secret";
function signingKey() {
  const value = process.env.JWT_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
  if (value && value.length < 32 && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be at least 32 characters in production");
  return new TextEncoder().encode(value || localSecret);
}

export async function issueToken(claims: SessionClaims) {
  return new SignJWT({ email: claims.email, name: claims.name, role: claims.role, demo: claims.demo })
    .setProtectedHeader({ alg: "HS256" }).setSubject(claims.sub).setIssuedAt().setExpirationTime("12h").sign(signingKey());
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get("ut_admin")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey());
    const claims = payload as unknown as SessionClaims;
    if (!claims.sub || !claims.email || !claims.role) return null;
    if (claims.demo) return process.env.NODE_ENV === "production" ? null : claims;
    const stored = await prisma.adminSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) return null;
    return { sub: stored.user.id, email: stored.user.email, name: stored.user.name, role: stored.user.role };
  } catch {
    return null;
  }
}

export const grants: Record<SessionClaims["role"], string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["TEAM_READ", "TEAM_WRITE", "MATCH_READ", "MATCH_WRITE", "STATS_READ", "STATS_WRITE", "CONTENT_READ", "CONTENT_WRITE", "MEDIA_WRITE", "MESSAGES_READ", "AUDIT_READ"],
  EDITOR: ["CONTENT_READ", "CONTENT_WRITE", "MEDIA_WRITE"],
  STATISTICS_MANAGER: ["TEAM_READ", "MATCH_READ", "MATCH_WRITE", "STATS_READ", "STATS_WRITE"],
  CONTENT_MANAGER: ["CONTENT_READ", "CONTENT_WRITE", "MEDIA_WRITE", "SETTINGS_WRITE"],
};

export function hasPermission(role: SessionClaims["role"], permission: string) {
  const roleGrants = grants[role] ?? [];
  return roleGrants.includes("*") || roleGrants.includes(permission);
}

export async function recordAudit(userId: string, action: string, entity: string, entityId?: string, oldData?: unknown, newData?: unknown, ipAddress?: string) {
  if (userId === "local-demo-admin") return;
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, oldData: oldData as never, newData: newData as never, ipAddress } });
  } catch { /* audit storage should never turn a successful edit into a failed response */ }
}

