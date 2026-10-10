import type { Metadata } from "next";
import localFont from "next/font/local";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CartProvider } from "@/components/CartProvider";
import { theme } from "@/config/theme";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { getSiteUrl } from "@/lib/site-settings";
import { MotionLayer } from "@/components/MotionLayer";
import { motionBootScript, motionCss } from "@/lib/motion";

// Some in-app browsers lay the page out narrower than the screen and leave a blank strip on the right.
// When that happens, and the user has not zoomed in, match the layout width to the visible width.
const viewportFitScript = `(function(){var vv=window.visualViewport;if(!vv)return;var meta=document.querySelector('meta[name="viewport"]');if(!meta)return;function fit(){if(vv.scale>1.01||vv.width>900)return;var layout=document.documentElement.clientWidth;if(layout<200)return;if(vv.width>layout+8)meta.setAttribute("content","width="+Math.round(vv.width)+", initial-scale=1, viewport-fit=cover");}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fit);else fit();vv.addEventListener("resize",fit);})();`;

const exo = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo",
  display: "swap",
  fallback: ["Segoe UI", "Roboto", "sans-serif"],
});
// Fulham ships as a single-weight face, so it is declared across the full weight range
// and the browser never synthesises a smeared faux bold on top of it.
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

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

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
  return <html lang="en" className={`${exo.variable} ${fulham.variable}`} style={theme as unknown as React.CSSProperties} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: motionBootScript }} /><script dangerouslySetInnerHTML={{ __html: viewportFitScript }} /><style dangerouslySetInnerHTML={{ __html: motionCss }} /></head><body><a className="skip-link" href="#main">Skip to content</a><AnalyticsProvider /><MotionLayer /><CartProvider><PublicHeader /><main id="main">{children}</main><PublicFooter /></CartProvider></body></html>;
}

