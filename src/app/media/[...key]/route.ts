import { NextRequest } from "next/server";
import { getStorageProvider, isManagedMediaKey } from "@/lib/storage";

export const runtime = "nodejs";

/** Streams CMS uploads from the configured S3-compatible bucket so they display even when the bucket is private. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.map((part) => decodeURIComponent(part)).join("/");
  if (!isManagedMediaKey(objectKey)) return new Response("Not found", { status: 404 });
  try {
    const storage = await getStorageProvider();
    const object = await storage.get(objectKey, request.headers.get("range") ?? undefined);
    if (!object.body) return new Response("Not found", { status: 404 });
    const headers = new Headers({ "cache-control": "public, max-age=31536000, immutable", "accept-ranges": "bytes" });
    if (object.contentType) headers.set("content-type", object.contentType);
    if (object.contentLength != null) headers.set("content-length", String(object.contentLength));
    if (object.contentRange) headers.set("content-range", object.contentRange);
    if (object.etag) headers.set("etag", object.etag);
    if (object.lastModified) headers.set("last-modified", object.lastModified.toUTCString());
    return new Response(object.body, { status: object.status, headers });
  } catch (error) {
    const status = error && typeof error === "object" && "$metadata" in error ? (error as { $metadata: { httpStatusCode?: number } }).$metadata.httpStatusCode : undefined;
    if (status === 404 || status === 403) return new Response("Not found", { status: 404 });
    return new Response("Media unavailable", { status: 502 });
  }
}
