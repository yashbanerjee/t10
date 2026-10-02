import type { Metadata } from "next";
import { Manrope, Oswald } from "next/font/google";
import "./globals.css";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CartProvider } from "@/components/CartProvider";
import { theme } from "@/config/theme";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { getSiteUrl } from "@/lib/site-settings";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const dynamic = "force-dynamic";

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
  return <html lang="en" className={`${manrope.variable} ${oswald.variable}`} style={theme as unknown as React.CSSProperties}><body><a className="skip-link" href="#main">Skip to content</a><AnalyticsProvider /><CartProvider><PublicHeader /><main id="main">{children}</main><PublicFooter /></CartProvider></body></html>;
}

