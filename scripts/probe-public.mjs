import { PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.STORAGE_ENDPOINT.replace(/\/$/, "");
const bucket = process.env.STORAGE_BUCKET;
const client = new S3Client({
  endpoint,
  region: process.env.STORAGE_REGION || "auto",
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY, secretAccessKey: process.env.STORAGE_SECRET_KEY },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const policy = {
  Version: "2012-10-17",
  Statement: [{
    Sid: "PublicReadSiteMedia",
    Effect: "Allow",
    Principal: "*",
    Action: ["s3:GetObject"],
    Resource: [`arn:aws:s3:::${bucket}/united-tigers/*`],
  }],
};

try {
  await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
  console.log("Bucket policy saved.");
} catch (error) {
  console.log(`Policy not accepted: ${error.name} ${error.Code || ""} ${error.message}`);
}

const urls = [
  `${endpoint}/${bucket}/united-tigers/players/fakhar-zaman.jpg`,
  `https://${bucket}.t3.storageapi.dev/united-tigers/players/fakhar-zaman.jpg`,
  `https://${bucket}.t3.storage.dev/united-tigers/players/fakhar-zaman.jpg`,
];
for (const url of urls) {
  const response = await fetch(url, { method: "GET" });
  console.log(`${response.status} ${url}`);
}
