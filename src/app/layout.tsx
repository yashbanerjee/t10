import type { Metadata } from "next";
import "./globals.css";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { theme } from "@/config/theme";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "United Tigers | Official Website", template: "%s | United Tigers" },
  description: "The official home of United Tigers. Discover the squad, follow fixtures, meet the players and get closer to every moment of the 2026 T10 season.",
  openGraph: { type: "website", siteName: "United Tigers", title: "United Tigers | Official Website", description: "A new force. A new chapter." },
  twitter: { card: "summary_large_image", title: "United Tigers", description: "A new force. A new chapter." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" style={theme as unknown as React.CSSProperties}><body><a className="skip-link" href="#main">Skip to content</a><AnalyticsProvider /><PublicHeader /><main id="main">{children}</main><PublicFooter /></body></html>;
}

