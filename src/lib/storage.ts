import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";

export type StoredFile = { key: string; url: string; contentType: string; size: number };
export interface StorageProvider { put(key: string, body: Buffer, contentType: string): Promise<StoredFile> }

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
    this.publicBase = (config.publicUrl || `${config.endpoint}/${config.bucket}`).replace(/\/$/, "");
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "auto",
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
    return { key, url: `${this.publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`, contentType, size: body.byteLength };
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
