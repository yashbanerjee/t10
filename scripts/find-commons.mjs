const names = [
  "Iftikhar Ahmed (cricketer)",
  "Faheem Ashraf",
  "Azmatullah Omarzai",
  "Abbas Afridi",
  "Odean Smith",
  "Nurul Hasan",
  "Paul van Meekeren",
  "Adithya Shetty",
];

for (const name of names) {
  const search = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srnamespace=6&format=json`, {
    headers: { "User-Agent": "UnitedTigersDemo/1.0" },
  });
  const data = await search.json();
  const titles = (data.query?.search || []).slice(0, 3).map((item) => item.title);
  console.log(`\n${name}`);
  if (!titles.length) {
    console.log("  none");
    continue;
  }
  for (const title of titles) {
    const info = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|url&format=json`, {
      headers: { "User-Agent": "UnitedTigersDemo/1.0" },
    });
    const page = Object.values((await info.json()).query.pages)[0];
    const meta = page.imageinfo?.[0]?.extmetadata || {};
    console.log(`  ${title}`);
    console.log(`  license: ${meta.LicenseShortName?.value || "unknown"}`);
  }
}
