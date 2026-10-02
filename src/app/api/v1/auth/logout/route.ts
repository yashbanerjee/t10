import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { tokenHash } from "@/lib/auth";

export async function POST() {
  const token = (await cookies()).get("ut_admin")?.value;
  if (token) try { await prisma.adminSession.deleteMany({ where: { tokenHash: tokenHash(token) } }); } catch { /* the cookie is still cleared if the database is unavailable */ }
  const response = NextResponse.json({ success: true, data: null, message: "Signed out" });
  response.cookies.set("ut_admin", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}

