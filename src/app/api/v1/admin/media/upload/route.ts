import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;
const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["audio/mpeg", "mp3"],
  ["audio/mp3", "mp3"],
  ["audio/mp4", "m4a"],
  ["audio/aac", "aac"],
  ["audio/wav", "wav"],
  ["audio/wave", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/ogg", "ogg"],
  ["application/pdf", "pdf"],
]);
const MAX_BYTES = 30 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "MEDIA_WRITE")) return failure("You do not have permission to upload media", 403);
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File)) return failure("Select an image, audio, video or PDF to upload", 400);
  let extension = allowed.get(file.type);
  // Some browsers send an empty or octet-stream type for WAV/MP3; fall back to the filename.
  if (!extension) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".wav")) extension = "wav";
    else if (name.endsWith(".mp3")) extension = "mp3";
    else if (name.endsWith(".m4a")) extension = "m4a";
    else if (name.endsWith(".aac")) extension = "aac";
    else if (name.endsWith(".ogg")) extension = "ogg";
    else if (name.endsWith(".mp4")) extension = "mp4";
    else if (name.endsWith(".webm")) extension = "webm";
  }
  if (!extension) return failure("Supported uploads: JPG, PNG, WebP, MP3, WAV, M4A, MP4, WebM and PDF", 415);
  if (file.size <= 0 || file.size > MAX_BYTES) return failure("File size must be less than 30 MB", 413);
  const contentType = file.type && file.type !== "application/octet-stream"
    ? file.type
    : extension === "wav" ? "audio/wav"
      : extension === "mp3" ? "audio/mpeg"
        : extension === "m4a" ? "audio/mp4"
          : extension === "aac" ? "audio/aac"
            : extension === "ogg" ? "audio/ogg"
              : extension === "mp4" ? "video/mp4"
                : extension === "webm" ? "video/webm"
                  : extension === "pdf" ? "application/pdf"
                    : file.type || "application/octet-stream";
  try {
    const date = new Date(); const key = `uploads/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
    const storage = await getStorageProvider();
    const saved = await storage.put(key, Buffer.from(await file.arrayBuffer()), contentType);
    // The media library only holds images and videos; audio and PDFs are referenced directly by their URL.
    const libraryType = extension === "mp4" || extension === "webm" ? "VIDEO" : ["jpg", "png", "webp"].includes(extension) ? "IMAGE" : null;
    const media = libraryType
      ? await prisma.media.create({ data: { url: saved.url, type: libraryType, altText: form?.get("altText")?.toString().slice(0, 300), folder: form?.get("folder")?.toString().slice(0, 100), uploadedById: session.sub === "local-demo-admin" ? undefined : session.sub } })
      : null;
    await recordAudit(session.sub, "UPLOAD", "Media", media?.id, undefined, { key, type: media?.type ?? (extension === "pdf" ? "DOCUMENT" : "AUDIO"), size: saved.size }, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success({ ...saved, mediaId: media?.id ?? null }, "Media uploaded", { status: 201 });
  } catch {
    return failure("Upload failed. Add the storage endpoint, bucket and keys in Site settings.", 503);
  }
}
