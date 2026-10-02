import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PutObjectAclCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const endpoint = process.env.STORAGE_ENDPOINT?.replace(/\/$/, "");
const bucket = process.env.STORAGE_BUCKET;
const accessKey = process.env.STORAGE_ACCESS_KEY;
const secretKey = process.env.STORAGE_SECRET_KEY;
const region = process.env.STORAGE_REGION || "auto";
if (!endpoint || !bucket || !accessKey || !secretKey) throw new Error("Storage environment variables are missing.");

const prisma = new PrismaClient();
const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const photoUrl = "https://upload.wikimedia.org/wikipedia/commons/f/f9/Fakhar_Zaman%2C_Pakistan_vs_Sri_Lanka%2C_1st_ODI%2C_2017.jpg";
const photo = await fetch(photoUrl, { headers: { "User-Agent": "UnitedTigersDemo/1.0 (local dev; CC BY 3.0 Wikimedia photo)" } });
if (!photo.ok) throw new Error(`Could not download the player photo (${photo.status})`);
const body = Buffer.from(await photo.arrayBuffer());
const key = "united-tigers/players/fakhar-zaman.jpg";
await client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: body,
  ContentType: "image/jpeg",
  CacheControl: "public, max-age=31536000, immutable",
}));
try {
  await client.send(new PutObjectAclCommand({ Bucket: bucket, Key: key, ACL: "public-read" }));
  console.log("Object marked public.");
} catch (error) {
  console.log(`Public access was not granted (${error.Code || error.name}).`);
}
const storedUrl = `${endpoint}/${bucket}/${key}`;
const probe = await fetch(storedUrl);
console.log(`Upload check: ${probe.status}`);

await prisma.siteSetting.upsert({
  where: { key: "storage" },
  create: { key: "storage", value: { endpoint, bucket, accessKey, secretKey, region, publicUrl: endpoint } },
  update: { value: { endpoint, bucket, accessKey, secretKey, region, publicUrl: endpoint } },
});

const dir = path.join(process.cwd(), "public", "images", "demo");
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, "fakhar-zaman.jpg"), body);
const profileImage = probe.ok ? storedUrl : "/images/demo/fakhar-zaman.jpg";
await prisma.player.update({
  where: { slug: "fakhar-zaman" },
  data: { profileImage },
});
console.log(probe.ok ? "Fakhar Zaman photo is public on the bucket." : "Fakhar Zaman photo is served from the site because the bucket object is private.");

await prisma.$disconnect();
