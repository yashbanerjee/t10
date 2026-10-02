import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const headers = { "User-Agent": "UnitedTigersDemo/1.0 (local placeholder photos; educational site)" };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dir = path.join(process.cwd(), "public", "images", "demo");
await mkdir(dir, { recursive: true });

const queries = [
  "cricket batsman shot filetype:bitmap",
  "cricket bowler action filetype:bitmap",
  "cricket wicketkeeper filetype:bitmap",
  "cricket stadium floodlights filetype:bitmap",
  "cricket training nets filetype:bitmap",
  "cricket fielder catch filetype:bitmap",
  "cricket team celebration filetype:bitmap",
  "cricket ground match filetype:bitmap",
  "cricket ball stumps filetype:bitmap",
  "night cricket match filetype:bitmap",
];

const seen = new Set();
const photos = [];

for (const query of queries) {
  await sleep(900);
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1400&format=json`, { headers });
  const text = await response.text();
  if (!text.startsWith("{")) {
    console.log(`skip ${query}: ${text.slice(0, 60)}`);
    continue;
  }
  const pages = Object.values(JSON.parse(text).query?.pages || {});
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const license = info?.extmetadata?.LicenseShortName?.value || "";
    const free = /cc|public domain|gfdl/i.test(license);
    if (!info || !free || !/^image\/jpe?g$/.test(info.mime || "") || info.size < 40000 || seen.has(page.title)) continue;
    seen.add(page.title);
    photos.push({ title: page.title, url: info.thumburl || info.url, license });
    break;
  }
}

console.log(`Found ${photos.length} photos`);
const names = [
  "iftikhar-ahmed.jpg",
  "faheem-ashraf.jpg",
  "azmatullah-omarzai.jpg",
  "abbas-afridi.jpg",
  "odean-smith.jpg",
  "nurul-hasan.jpg",
  "paul-van-meekeren.jpg",
  "adithya-shetty.jpg",
  "gallery-training.jpg",
  "gallery-match.jpg",
  "gallery-huddle.jpg",
  "gallery-stadium.jpg",
  "news-opener.jpg",
  "news-camp.jpg",
  "news-result.jpg",
  "update-nets.jpg",
];

let saved = 0;
for (let index = 0; index < Math.min(photos.length, names.length); index += 1) {
  await sleep(400);
  const photo = photos[index];
  const file = await fetch(photo.url, { headers });
  if (!file.ok) {
    console.log(`download failed ${photo.title}`);
    continue;
  }
  const body = Buffer.from(await file.arrayBuffer());
  if (body.length < 20000) continue;
  await writeFile(path.join(dir, names[saved]), body);
  console.log(`${names[saved]} <= ${photo.title} (${photo.license})`);
  saved += 1;
}
console.log(`Saved ${saved}`);
