const titles = [
  "Iftikhar Ahmed (cricketer)",
  "Faheem Ashraf",
  "Azmatullah Omarzai",
  "Abbas Afridi",
  "Odean Smith",
  "Nurul Hasan (cricketer)",
  "Paul van Meekeren",
  "Adithya Shetty",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const title of titles) {
  await sleep(1200);
  const page = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|images&format=json&pithumbsize=50`, {
    headers: { "User-Agent": "UnitedTigersDemo/1.0 (photo license check)" },
  });
  const text = await page.text();
  if (!text.startsWith("{")) {
    console.log(`${title}: ${text.slice(0, 80)}`);
    continue;
  }
  const data = JSON.parse(text);
  const entry = Object.values(data.query.pages)[0];
  if (entry.missing) {
    console.log(`${title}: no article`);
    continue;
  }
  const files = (entry.images || []).map((image) => image.title).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).slice(0, 4);
  console.log(`${title}: ${files.join(" | ") || "no raster images"}`);
}
