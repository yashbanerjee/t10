const names = ["Fakhar Zaman", "Iftikhar Ahmed", "Faheem Ashraf", "Azmatullah Omarzai", "Abbas Afridi", "Odean Smith", "Nurul Hasan", "Paul van Meekeren", "Adithya Shetty"];
const values = names.map((name) => `"${name}"@en`).join(" ");
const query = `SELECT ?item ?itemLabel ?image WHERE { VALUES ?name { ${values} } ?item rdfs:label ?name. OPTIONAL { ?item wdt:P18 ?image } OPTIONAL { ?item wdt:P106 ?occ } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 50`;
const response = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
  headers: { "User-Agent": "UnitedTigersDemo/1.0 (local dev)", Accept: "application/sparql-results+json" },
});
const data = await response.json();
for (const row of data.results.bindings) {
  console.log([row.itemLabel?.value, row.item?.value, row.image?.value || "NO IMAGE"].join(" | "));
}
