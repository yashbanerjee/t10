import type { MetadataRoute } from "next";
import { getPlayers, getNews, getUpdates } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [players, newsItems, updateItems] = await Promise.all([getPlayers(), getNews(), getUpdates()]);
  const news = newsItems.filter((item) => !item.isDemo);
  const updates = updateItems.filter((item) => !item.isDemo);
  const staticRoutes = ["", "/team", "/fixtures", "/season/2026", "/stats", "/news", "/updates", "/records", "/points-table", "/gallery", "/partners", "/about", "/contact"];
  return [...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })), ...players.map((player) => ({ url: `${base}/players/${player.slug}`, lastModified: new Date() })), ...news.map((article) => ({ url: `${base}/news/${article.slug}`, lastModified: new Date() })), ...updates.map((update) => ({ url: `${base}/updates/${update.slug}`, lastModified: new Date() }))];
}

