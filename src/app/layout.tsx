import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CartProvider } from "@/components/CartProvider";
import { theme } from "@/config/theme";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { getSiteUrl } from "@/lib/site-settings";
import { MotionLayer } from "@/components/MotionLayer";
import { motionBootScript, motionCss } from "@/lib/motion";

// Both families ship as single-weight faces, so each is declared across the full weight range
// and the browser never synthesises a smeared faux bold on top of them.
const colosseon = localFont({
  src: [{ path: "./fonts/Colosseon.otf", weight: "100 900", style: "normal" }],
  variable: "--font-colosseon",
  display: "swap",
  fallback: ["Arial Narrow", "Roboto Condensed", "Segoe UI", "sans-serif"],
});
const fulham = localFont({
  src: [
    { path: "./fonts/Fulham.otf", weight: "100 900", style: "normal" },
    { path: "./fonts/FulhamItalic.otf", weight: "100 900", style: "italic" },
  ],
  variable: "--font-fulham",
  display: "swap",
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});

export const dynamic = "force-dynamic";

export const viewport = { width: "device-width", initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(await getSiteUrl()),
    title: { default: "United Tigers | Official Website", template: "%s | United Tigers" },
    description: "The official home of United Tigers. Discover the squad, follow fixtures, meet the players and get closer to every moment of the 2026 T10 season.",
    openGraph: { type: "website", siteName: "United Tigers", title: "United Tigers | Official Website", description: "A new force. A new chapter." },
    twitter: { card: "summary_large_image", title: "United Tigers", description: "A new force. A new chapter." },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${colosseon.variable} ${fulham.variable}`} style={theme as unknown as React.CSSProperties} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: motionBootScript }} /><style dangerouslySetInnerHTML={{ __html: motionCss }} /></head><body><a className="skip-link" href="#main">Skip to content</a><AnalyticsProvider /><MotionLayer /><CartProvider><PublicHeader /><main id="main">{children}</main><PublicFooter /></CartProvider></body></html>;
}

