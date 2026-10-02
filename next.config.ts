import type { NextConfig } from "next";

const storageOrigin = process.env.STORAGE_ENDPOINT ? (() => {
  try { const endpoint = new URL(process.env.STORAGE_ENDPOINT!); return { protocol: endpoint.protocol.slice(0, -1) as "http" | "https", hostname: endpoint.hostname, port: endpoint.port, pathname: "/**" }; }
  catch { return null; }
})() : null;
const isProduction = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
  "img-src 'self' data: blob: https:", "media-src 'self' blob: https:", "font-src 'self' data:", "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`, "connect-src 'self' https:",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      ...(storageOrigin ? [storageOrigin] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
    ] }];
  },
};

export default nextConfig;

