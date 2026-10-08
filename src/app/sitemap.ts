import type { MetadataRoute } from "next";
import { getPlayers, getNews, getUpdates } from "@/lib/data";
import { getSiteUrl } from "@/lib/site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();
  const [players, newsItems, updateItems] = await Promise.all([getPlayers(), getNews(), getUpdates()]);
  const news = newsItems.filter((item) => !item.isDemo);
  const updates = updateItems.filter((item) => !item.isDemo);
  const staticRoutes = ["", "/team", "/fixtures", "/season/2026", "/stats", "/news", "/updates", "/draft", "/records", "/points-table", "/gallery", "/partners", "/become-a-partner", "/vote", "/fan", "/shop", "/about", "/franchises", "/contact"];
  return [...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })), ...players.map((player) => ({ url: `${base}/players/${player.slug}`, lastModified: new Date() })), ...news.map((article) => ({ url: `${base}/news/${article.slug}`, lastModified: new Date() })), ...updates.map((update) => ({ url: `${base}/updates/${update.slug}`, lastModified: new Date() }))];
}

