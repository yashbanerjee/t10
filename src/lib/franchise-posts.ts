import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export const MAX_FRANCHISE_POSTS = 30;
export type PostPlatform = "INSTAGRAM" | "FACEBOOK" | "YOUTUBE" | "X" | "TIKTOK" | "LINK";

const TRACKING = /^(utm_.*|mibextid|rdid|share_url|igsh|igshid|fbclid|si|ref|refsrc)$/i;
const IMAGE_TYPES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
/** Instagram and Facebook only return a post's cover and caption to link-preview crawlers. */
const CRAWLER = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export function platformOf(url: string): PostPlatform {
  const host = new URL(url).hostname.replace(/^(www|m|web)\./, "");
  if (host === "instagram.com" || host === "instagr.am") return "INSTAGRAM";
  if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") return "FACEBOOK";
  if (host === "youtube.com" || host === "youtu.be") return "YOUTUBE";
  if (host === "x.com" || host === "twitter.com") return "X";
  if (host.endsWith("tiktok.com")) return "TIKTOK";
  return "LINK";
}

/** Drops share-tracking parameters so the same post pasted twice is recognised as one. Instagram links never need a query. */
export function cleanPostUrl(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  url.hash = "";
  if (platformOf(url.toString()) === "INSTAGRAM") url.search = "";
  else for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
  return url.toString();
}

/** Splits the admin text box into clean, de-duplicated links; returns the first line that is not a link. */
export function parsePostLines(text: string | null | undefined): { ok: true; urls: string[] } | { ok: false; line: string } {
  const urls: string[] = [];
  for (const line of (text ?? "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean)) {
    const url = cleanPostUrl(line);
    if (!url) return { ok: false, line };
    if (!urls.includes(url)) urls.push(url);
  }
  return { ok: true, urls };
}

export const postsToText = (posts: { url: string }[]) => posts.map((post) => post.url).join("\n");

function decodeEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

function metaContent(html: string, property: string) {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`, "i"))?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decodeEntities(content).trim() : null;
}

/** Instagram titles read `Name on Instagram: "caption"` and Facebook ones `771K views · 40K reactions | caption | Page`; keep only the caption. */
export function captionFrom(title: string | null, description: string | null = null) {
  const text = title ?? description;
  if (!text) return null;
  const quoted = text.match(/:\s*"([\s\S]+)"\s*$/)?.[1];
  const facebook = quoted ? null : text.match(/^[^|]*\b(?:views|reactions|comments)\s*\|\s*([\s\S]+?)(?:\s*\|[^|]*)?$/i)?.[1];
  return (quoted ?? facebook ?? text).replace(/\s+/g, " ").trim().slice(0, 300) || null;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...init, signal: controller.signal, redirect: "follow", cache: "no-store" }); }
  finally { clearTimeout(timer); }
}

/** Reads the post's preview and copies its cover into our storage, because the platforms' image links expire. */
export async function fetchPostPreview(url: string): Promise<{ imageUrl: string | null; caption: string | null }> {
  try {
    const page = await fetchWithTimeout(url, { headers: { "user-agent": CRAWLER, "accept-language": "en-US,en;q=0.9" } });
    if (!page.ok) return { imageUrl: null, caption: null };
    const html = (await page.text()).slice(0, 600_000);
    const caption = captionFrom(metaContent(html, "og:title"), metaContent(html, "og:description"));
    const image = metaContent(html, "og:image");
    if (!image) return { imageUrl: null, caption };
    const picture = await fetchWithTimeout(image, { headers: { "user-agent": CRAWLER } });
    const type = picture.headers.get("content-type")?.split(";")[0].trim() ?? "";
    const extension = IMAGE_TYPES.get(type);
    if (!picture.ok || !extension) return { imageUrl: null, caption };
    const body = Buffer.from(await picture.arrayBuffer());
    if (!body.byteLength || body.byteLength > MAX_IMAGE_BYTES) return { imageUrl: null, caption };
    const date = new Date();
    const key = `uploads/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
    const saved = await (await getStorageProvider()).put(key, body, type);
    return { imageUrl: saved.url, caption };
  } catch {
    return { imageUrl: null, caption: null };
  }
}

/**
 * Makes the franchise's posts match the admin list: new links are added with their cover, removed links are deleted,
 * and the order follows the list. Posts whose cover could not be fetched before are tried again.
 */
export async function syncFranchisePosts(franchiseId: string, urls: string[]) {
  const existing = await prisma.franchisePost.findMany({ where: { franchiseId } });
  const byUrl = new Map(existing.map((post) => [post.url, post]));
  await prisma.franchisePost.deleteMany({ where: { franchiseId, url: { notIn: urls } } });
  const queue = urls.map((url, index) => ({ url, index }));
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const current = byUrl.get(job.url);
      const preview = current?.imageUrl ? null : await fetchPostPreview(job.url);
      const data = { displayOrder: job.index, platform: platformOf(job.url), ...(preview ? { imageUrl: preview.imageUrl, caption: preview.caption ?? current?.caption ?? null } : {}) };
      if (current) await prisma.franchisePost.update({ where: { id: current.id }, data });
      else await prisma.franchisePost.create({ data: { franchiseId, url: job.url, ...data } });
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
}
