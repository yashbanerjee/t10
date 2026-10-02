import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/v1/admin/") || ["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.next();
  const originHeader = request.headers.get("origin");
  if (!originHeader) return NextResponse.json({ success: false, message: "Origin header required for administrator changes" }, { status: 403 });
  try {
    const origin = new URL(originHeader);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
    if (origin.host.toLowerCase() !== host.toLowerCase()) return NextResponse.json({ success: false, message: "Cross-origin administrator request rejected" }, { status: 403 });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid origin" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/v1/admin/:path*"] };

