import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredFile = { key: string; url: string; contentType: string; size: number };
export interface StorageProvider { put(key: string, body: Buffer, contentType: string): Promise<StoredFile> }

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  private publicBase: string;
  constructor() {
    const { STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, STORAGE_REGION, STORAGE_PUBLIC_URL } = process.env;
    if (!STORAGE_ENDPOINT || !STORAGE_BUCKET || !STORAGE_ACCESS_KEY || !STORAGE_SECRET_KEY) throw new Error("S3-compatible storage is not configured");
    this.endpoint = STORAGE_ENDPOINT.replace(/\/$/, ""); this.bucket = STORAGE_BUCKET; this.publicBase = (STORAGE_PUBLIC_URL || `${this.endpoint}/${this.bucket}`).replace(/\/$/, "");
    this.client = new S3Client({ endpoint: STORAGE_ENDPOINT, region: STORAGE_REGION || "auto", forcePathStyle: true, credentials: { accessKeyId: STORAGE_ACCESS_KEY, secretAccessKey: STORAGE_SECRET_KEY } });
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
    return { key, url: `${this.publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`, contentType, size: body.byteLength };
  }
}

let provider: StorageProvider | undefined;
export function getStorageProvider() { provider ??= new S3StorageProvider(); return provider; }

