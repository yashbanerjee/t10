import { z } from "zod";

const themeSongSchema = z.object({
  enabled: z.boolean().optional().default(false),
  title: z.string().trim().max(120).optional().default("Official theme song"),
  /** Hosted audio file, hosted video file, or a YouTube link. */
  kind: z.enum(["audio", "video", "youtube"]).optional().default("audio"),
  /** Site path / https URL for audio|video, or a full YouTube watch/share URL. */
  source: z.string().trim().max(800).optional().default(""),
  /** Optional separate download URL for hosted files. Defaults to source. Ignored for YouTube. */
  downloadUrl: z.string().trim().max(800).optional().default(""),
  /** Suggested filename when fans download a hosted file. */
  fileName: z.string().trim().max(180).optional().default(""),
  /** Optional cover / poster image for the homepage card. */
  poster: z.string().trim().max(500).optional().default(""),
});

export type ThemeSong = {
  enabled: boolean;
  title: string;
  kind: "audio" | "video" | "youtube";
  source: string;
  downloadUrl: string;
  fileName: string;
  poster: string;
};

export const themeSongDefaults: ThemeSong = {
  enabled: false,
  title: "Official theme song",
  kind: "audio",
  source: "",
  downloadUrl: "",
  fileName: "",
  poster: "",
};

function safeAsset(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /["'()\\\s]/.test(trimmed)) return "";
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return "";
}

/** Extract an 11-character YouTube video id from common URL shapes. */
export function youtubeVideoId(source: string) {
  const text = source.trim();
  if (!text) return null;
  const patterns = [
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
    /^([\w-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function normalizeThemeSong(value: unknown): { ok: true; value: ThemeSong } | { ok: false; message: string } {
  const parsed = themeSongSchema.safeParse(value ?? {});
  if (!parsed.success) return { ok: false, message: "Theme song settings are invalid." };
  const source = parsed.data.source.trim();
  const kind = parsed.data.kind;
  const asset = kind === "youtube" ? source : safeAsset(source);
  if (parsed.data.enabled) {
    if (!asset) return { ok: false, message: kind === "youtube" ? "Add a YouTube link before turning the theme song on." : "Upload or paste a media file before turning the theme song on." };
    if (kind === "youtube" && !youtubeVideoId(asset)) return { ok: false, message: "That does not look like a YouTube video link." };
    if (kind !== "youtube" && !asset) return { ok: false, message: "Theme song file must be a site path or an http(s) URL." };
  }
  const download = kind === "youtube" ? "" : safeAsset(parsed.data.downloadUrl) || (asset || "");
  const poster = safeAsset(parsed.data.poster);
  const fileName = parsed.data.fileName.replace(/[\\/:*?"<>|]+/g, "").trim();
  return {
    ok: true,
    value: {
      enabled: Boolean(parsed.data.enabled && asset),
      title: parsed.data.title.trim() || themeSongDefaults.title,
      kind,
      source: asset,
      downloadUrl: download,
      fileName: fileName || defaultFileName(kind, asset),
      poster,
    },
  };
}

function defaultFileName(kind: ThemeSong["kind"], source: string) {
  if (kind === "youtube" || !source) return "united-tigers-theme";
  const base = source.split("?")[0]?.split("/").pop() || "united-tigers-theme";
  return base.slice(0, 180);
}

export function readThemeSong(value: unknown): ThemeSong {
  const normalized = normalizeThemeSong(value);
  if (!normalized.ok) return themeSongDefaults;
  return normalized.value;
}

/** Public shape used on the homepage and in the app. Null when the feature is off. */
export function publicThemeSong(value: unknown): ThemeSong | null {
  const song = readThemeSong(value);
  if (!song.enabled || !song.source) return null;
  return song;
}

export function themeSongEmbedUrl(song: ThemeSong) {
  if (song.kind !== "youtube") return null;
  const id = youtubeVideoId(song.source);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

export function themeSongWatchUrl(song: ThemeSong) {
  if (song.kind !== "youtube") return null;
  const id = youtubeVideoId(song.source);
  return id ? `https://www.youtube.com/watch?v=${id}` : song.source;
}

export function themeSongCanDownload(song: ThemeSong) {
  return song.kind !== "youtube" && Boolean(song.downloadUrl || song.source);
}
