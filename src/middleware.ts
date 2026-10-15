import { NextRequest, NextResponse } from "next/server";

const CANONICAL_ORIGIN = "https://unitedtigers.ae";

function requestHost(request: NextRequest) {
  return (request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host).toLowerCase();
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // The Railway host serves the same site; send visitors and search engines to the main domain. API calls stay put for older app builds and webhooks.
  if (requestHost(request).endsWith(".up.railway.app") && !pathname.startsWith("/api/") && ["GET", "HEAD"].includes(request.method)) {
    return NextResponse.redirect(`${CANONICAL_ORIGIN}${pathname}${search}`, 301);
  }
  if (!pathname.startsWith("/api/v1/admin/") || ["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.next();
  const originHeader = request.headers.get("origin");
  if (!originHeader) return NextResponse.json({ success: false, message: "Origin header required for administrator changes" }, { status: 403 });
  try {
    const origin = new URL(originHeader);
    if (origin.host.toLowerCase() !== requestHost(request)) return NextResponse.json({ success: false, message: "Cross-origin administrator request rejected" }, { status: 403 });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid origin" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
