import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export const MAX_FRANCHISE_POSTS = 30;
export type PostPlatform = "INSTAGRAM" | "FACEBOOK" | "YOUTUBE" | "X" | "TIKTOK" | "THREADS" | "LINKEDIN" | "LINK";

const TRACKING = /^(utm_.*|mibextid|rdid|share_url|igsh|igshid|fbclid|gclid|si|ref|refsrc|feature|pp|ab_channel)$/i;
/** These platforms identify a post by its path alone, so their share links never need a query. */
const PATH_ONLY: PostPlatform[] = ["INSTAGRAM", "X", "TIKTOK", "THREADS", "LINKEDIN"];
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
/** Instagram, Facebook and X only return a post's cover and caption to link-preview crawlers. */
const CRAWLERS = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Twitterbot/1.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
];
/** Titles of login walls and error pages, whose images are the site's logo rather than the post. */
const NOT_A_POST = /\b(log ?in|sign ?in|sign up|page not found|not available)\b/i;

export function platformOf(url: string): PostPlatform {
  const host = new URL(url).hostname.replace(/^(www|m|web|mobile|vm|vt)\./, "");
  if (host === "instagram.com" || host === "instagr.am") return "INSTAGRAM";
  if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") return "FACEBOOK";
  if (host === "youtube.com" || host === "youtu.be" || host === "music.youtube.com") return "YOUTUBE";
  if (host === "x.com" || host === "twitter.com") return "X";
  if (host === "tiktok.com") return "TIKTOK";
  if (host === "threads.net" || host === "threads.com") return "THREADS";
  if (host === "linkedin.com" || host === "lnkd.in") return "LINKEDIN";
  return "LINK";
}

/** Drops share-tracking parameters so the same post pasted twice is recognised as one. */
export function cleanPostUrl(raw: string): string | null {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  url.hash = "";
  const platform = platformOf(url.toString());
  if (PATH_ONLY.includes(platform)) url.search = "";
  else for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key) || (platform === "YOUTUBE" && key === "t")) url.searchParams.delete(key);
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

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...init, signal: controller.signal, redirect: "follow", cache: "no-store" }); }
  finally { clearTimeout(timer); }
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetchWithTimeout(url, { headers: { accept: "application/json" } });
    return response.ok ? await response.json() as Record<string, unknown> : null;
  } catch { return null; }
}

/** Reads the file's first bytes rather than trusting the CDN's content type, which is often missing or generic. */
function imageType(body: Buffer): [string, string] | null {
  if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return ["image/jpeg", "jpg"];
  if (body.subarray(0, 4).toString("hex") === "89504e47") return ["image/png", "png"];
  if (body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP") return ["image/webp", "webp"];
  return null;
}

export async function downloadImage(source: string) {
  try {
    const picture = await fetchWithTimeout(source, { headers: { "user-agent": CRAWLERS[0] } });
    if (!picture.ok) return null;
    const body = Buffer.from(await picture.arrayBuffer());
    const type = imageType(body);
    return type && body.byteLength <= MAX_IMAGE_BYTES ? { body, type } : null;
  } catch { return null; }
}

/** Copies a cover into our storage, because the platforms' image links expire. */
async function storeImage(source: string) {
  try {
    const image = await downloadImage(source);
    if (!image) return null;
    const { body, type } = image;
    const date = new Date();
    const key = `uploads/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${type[1]}`;
    return (await (await getStorageProvider()).put(key, body, type[0])).url;
  } catch { return null; }
}

type Found = { image: string | null; caption: string | null };

/** The page's own link-preview tags, asked for as each known crawler in turn until one returns a picture. */
async function fromPage(url: string): Promise<Found> {
  let caption: string | null = null;
  for (const agent of CRAWLERS) {
    try {
      const page = await fetchWithTimeout(url, { headers: { "user-agent": agent, "accept-language": "en-US,en;q=0.9" } });
      if (!page.ok) continue;
      const html = (await page.text()).slice(0, 800_000);
      const title = metaContent(html, "og:title") ?? metaContent(html, "twitter:title");
      if (title && NOT_A_POST.test(title)) continue;
      caption ??= captionFrom(title, metaContent(html, "og:description") ?? metaContent(html, "description"));
      const image = metaContent(html, "og:image") ?? metaContent(html, "og:image:url") ?? metaContent(html, "twitter:image") ?? metaContent(html, "twitter:image:src");
      if (image) return { image: new URL(image, page.url).toString(), caption };
    } catch {
      break;
    }
  }
  return { image: null, caption };
}

/** oEmbed answers for YouTube and TikTok carry the thumbnail and title directly. */
async function fromOembed(endpoint: string, url: string): Promise<Found> {
  const data = await fetchJson(`${endpoint}?format=json&url=${encodeURIComponent(url)}`);
  return { image: typeof data?.thumbnail_url === "string" ? data.thumbnail_url : null, caption: typeof data?.title === "string" ? captionFrom(data.title) : null };
}

/** X hides post media from crawlers; the public FxTwitter API returns the photo or video thumbnail and the text. */
async function fromX(url: string): Promise<Found> {
  const id = new URL(url).pathname.match(/\/status(?:es)?\/(\d+)/)?.[1];
  const tweet = id ? (await fetchJson(`https://api.fxtwitter.com/status/${id}`))?.tweet as { text?: string; media?: { all?: { type?: string; url?: string; thumbnail_url?: string }[] } } | undefined : undefined;
  const media = tweet?.media?.all?.[0];
  const image = media ? (media.type === "photo" ? media.url : media.thumbnail_url) ?? null : null;
  return { image, caption: tweet?.text ? captionFrom(tweet.text) : null };
}

/** Finds the post's cover and caption, trying the most reliable source for its platform first and the page's own tags last. */
export async function fetchPostPreview(url: string, store: (source: string) => Promise<string | null> = storeImage): Promise<{ imageUrl: string | null; caption: string | null }> {
  const platform = platformOf(url);
  const sources: (() => Promise<Found>)[] = [];
  if (platform === "X") sources.push(() => fromX(url));
  if (platform === "TIKTOK") sources.push(() => fromOembed("https://www.tiktok.com/oembed", url));
  sources.push(() => fromPage(url));
  if (platform === "YOUTUBE") sources.push(() => fromOembed("https://www.youtube.com/oembed", url));
  let caption: string | null = null;
  for (const source of sources) {
    const found = await source();
    caption ??= found.caption;
    const imageUrl = found.image ? await store(found.image) : null;
    if (imageUrl) return { imageUrl, caption };
  }
  return { imageUrl: null, caption };
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
