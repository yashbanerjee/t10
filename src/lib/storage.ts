import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";

export type StoredFile = { key: string; url: string; contentType: string; size: number };
export type StoredObject = { body: ReadableStream | null; contentType?: string; contentLength?: number; contentRange?: string; etag?: string; lastModified?: Date; status: 200 | 206 };
export interface StorageProvider {
  put(key: string, body: Buffer, contentType: string): Promise<StoredFile>;
  get(key: string, range?: string): Promise<StoredObject>;
}

/** Same-origin route that streams uploads when the bucket itself is not publicly readable. */
export const MEDIA_ROUTE = "/media";
const MANAGED_KEY = /^uploads\/\d{4}\/\d{2}\/[a-f0-9-]{36}\.(jpg|png|webp|mp4|pdf)$/;
export const isManagedMediaKey = (key: string) => MANAGED_KEY.test(key);
export const encodeMediaKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

type StorageConfig = {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  publicUrl: string;
};

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBase: string;
  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.publicBase = resolvePublicBase(config);
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "auto",
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    const command = { Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" };
    try {
      await this.client.send(new PutObjectCommand({ ...command, ACL: "public-read" }));
    } catch {
      // Some S3-compatible providers reject object ACLs; store the file without one.
      await this.client.send(new PutObjectCommand(command));
    }
    const direct = `${this.publicBase}/${encodeMediaKey(key)}`;
    const url = (await isPubliclyReadable(direct)) ? direct : `${MEDIA_ROUTE}/${encodeMediaKey(key)}`;
    return { key, url, contentType, size: body.byteLength };
  }
  async get(key: string, range?: string): Promise<StoredObject> {
    const output = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: range }));
    return {
      body: output.Body ? (output.Body.transformToWebStream() as ReadableStream) : null,
      contentType: output.ContentType,
      contentLength: output.ContentLength,
      contentRange: output.ContentRange,
      etag: output.ETag,
      lastModified: output.LastModified,
      status: output.ContentRange ? 206 : 200,
    };
  }
}

/** Public base for direct links. A public URL equal to the API endpoint cannot address objects (the bucket is missing), so fall back to path-style. */
function resolvePublicBase(config: StorageConfig) {
  const endpoint = config.endpoint.replace(/\/$/, "");
  const custom = config.publicUrl.replace(/\/$/, "");
  if (!custom || custom === endpoint) return `${endpoint}/${config.bucket}`;
  return custom;
}

async function isPubliclyReadable(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { method: "HEAD", signal: controller.signal, cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function readStorageConfig(value: unknown): StorageConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const endpoint = typeof row.endpoint === "string" ? row.endpoint.trim().replace(/\/$/, "") : "";
  const bucket = typeof row.bucket === "string" ? row.bucket.trim() : "";
  const accessKey = typeof row.accessKey === "string" ? row.accessKey.trim() : "";
  const secretKey = typeof row.secretKey === "string" ? row.secretKey.trim() : "";
  if (!endpoint || !bucket || !accessKey || !secretKey) return null;
  return {
    endpoint,
    bucket,
    accessKey,
    secretKey,
    region: typeof row.region === "string" && row.region.trim() ? row.region.trim() : "auto",
    publicUrl: typeof row.publicUrl === "string" ? row.publicUrl.trim().replace(/\/$/, "") : "",
  };
}

export async function getStorageProvider() {
  const row = await prisma.siteSetting.findUnique({ where: { key: "storage" } });
  const config = readStorageConfig(row?.value);
  if (!config) throw new Error("S3-compatible storage is not configured");
  return new S3StorageProvider(config);
}
