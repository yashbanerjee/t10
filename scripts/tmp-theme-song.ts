import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/db";
import { getStorageProvider } from "../src/lib/storage";
import { normalizeThemeSong } from "../src/lib/theme-song";

const sourcePath = "C:\\Users\\DELL\\Downloads\\GBH X UNITED TIGER SONG.wav";

async function main() {
  const storage = await getStorageProvider();
  const bytes = readFileSync(sourcePath);
  const key = `uploads/2026/10/${randomUUID()}.wav`;
  const saved = await storage.put(key, bytes, "audio/wav");

  const value = normalizeThemeSong({
    enabled: true,
    title: "Official theme song",
    kind: "audio",
    source: saved.url,
    downloadUrl: saved.url,
    fileName: "United-Tigers-Theme-Song.wav",
    poster: "",
  });
  if (!value.ok) throw new Error(value.message);

  await prisma.siteSetting.upsert({
    where: { key: "themeSong" },
    create: { key: "themeSong", value: value.value as never },
    update: { value: value.value as never },
  });

  console.log(JSON.stringify({ url: saved.url, size: saved.size, setting: value.value }));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : "failed");
  await prisma.$disconnect();
  process.exit(1);
});
