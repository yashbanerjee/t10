import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getSession, hasPermission, recordAudit } from "@/lib/auth";
import { failure, success } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;
const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["video/mp4", "mp4"], ["application/pdf", "pdf"]]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "MEDIA_WRITE")) return failure("You do not have permission to upload media", 403);
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File)) return failure("Select an image or MP4 video to upload", 400);
  const extension = allowed.get(file.type);
  if (!extension) return failure("Supported uploads: JPG, PNG, WebP, MP4 and PDF", 415);
  if (file.size <= 0 || file.size > MAX_BYTES) return failure("File size must be less than 25 MB", 413);
  try {
    const date = new Date(); const key = `uploads/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
    const storage = await getStorageProvider();
    const saved = await storage.put(key, Buffer.from(await file.arrayBuffer()), file.type);
    // The media library only holds images and videos; documents are referenced directly by their URL.
    const media = extension === "pdf" ? null : await prisma.media.create({ data: { url: saved.url, type: extension === "mp4" ? "VIDEO" : "IMAGE", altText: form?.get("altText")?.toString().slice(0, 300), folder: form?.get("folder")?.toString().slice(0, 100), uploadedById: session.sub === "local-demo-admin" ? undefined : session.sub } });
    await recordAudit(session.sub, "UPLOAD", "Media", media?.id, undefined, { key, type: media?.type ?? "DOCUMENT", size: saved.size }, request.headers.get("x-forwarded-for")?.split(",")[0]);
    return success({ ...saved, mediaId: media?.id ?? null }, "Media uploaded", { status: 201 });
  } catch {
    return failure("Upload failed. Add the storage endpoint, bucket and keys in Site settings.", 503);
  }
}

