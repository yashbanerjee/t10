import { readFile } from "node:fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT;
const bucket = process.env.STORAGE_BUCKET;
const accessKeyId = process.env.STORAGE_ACCESS_KEY;
const secretAccessKey = process.env.STORAGE_SECRET_KEY;
const body = await readFile("scripts/generated/fakhar-zaman.png");
const attempts = [
  { forcePathStyle: true, checksum: true },
  { forcePathStyle: false, checksum: true },
  { forcePathStyle: true, checksum: false },
];

for (const attempt of attempts) {
  const client = new S3Client({
    endpoint,
    region: "auto",
    forcePathStyle: attempt.forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
    ...(attempt.checksum ? { requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" } : {}),
  });
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: "united-tigers/probe.png", Body: body, ContentType: "image/png" }));
    console.log("OK", JSON.stringify(attempt));
    process.exit(0);
  } catch (error) {
    console.log("FAIL", JSON.stringify(attempt), error.Code || error.name, error.$metadata?.httpStatusCode);
  }
}
