// Baut kinder.json aus dem Podcast-Feed und der Auswahl in auswahl.json,
// dazu katalog.json mit allen Folgen (für „Für Erwachsene → Geschichten auswählen“).
// Aufruf:  node scripts/build-kinder.mjs            (lädt den Feed aus dem Netz)
//          node scripts/build-kinder.mjs feed.xml   (liest eine lokale Feed-Datei)
// Keine Abhängigkeiten, läuft mit Node 18+.

import { readFile, writeFile } from "node:fs/promises";

const FEED_URL = "https://anchor.fm/s/fee008e0/podcast/rss";
const root = new URL("..", import.meta.url);

const decode = (s) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
   .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();

// Titel ohne Nummer und ohne Podcast-Anhang („- [Deutsch lernen durch Hören] - zum Lesen & Hören @DldH“ u. ä.).
// Die Beschreibungen im Feed sind reine Werbung/Links — deshalb kommt kein Text in den Katalog.
const kurztitel = (t) => t
  .replace(/#\s*\d+/g, " ")
  .replace(/\s*(?:[-–|]\s*)?\[?(?:Deutsch lernen durch Hören|Deutsch lernen mit Dialogen|zum Lesen & Hören|Redewendungen & Sprichwörter|Podcasts von|[@#]?DldH)\b[\s\S]*$/i, "")
  .replace(/\s+/g, " ")
  .replace(/^[\s\-–—:|·.]+|[\s\-–—:|·]+$/g, "")
  .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

const toSeconds = (d) => {
  if (!d) return 0;
  if (/^\d+$/.test(d)) return +d;
  return d.split(":").map(Number).reduce((a, n) => a * 60 + n, 0);
};

async function loadFeed() {
  const file = process.argv[2];
  if (file) return readFile(file, "utf8");
  const res = await fetch(FEED_URL, { headers: { "User-Agent": "Hoerkiste/1.0" } });
  if (!res.ok) throw new Error(`Feed nicht erreichbar: HTTP ${res.status}`);
  return res.text();
}

const xml = await loadFeed();
const folgen = new Map();
for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
  const titel = tag(item, "title");
  const nr = Number((titel.match(/#\s*(\d+)/) || [])[1]);
  const url = (item.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1];
  if (!nr || !url) continue;
  if (!folgen.has(nr)) {
    const datum = new Date(tag(item, "pubDate"));
    folgen.set(nr, {
      url: decode(url), sekunden: toSeconds(tag(item, "itunes:duration")), original: titel,
      datum: isNaN(datum) ? "" : datum.toISOString().slice(0, 10),
    });
  }
}

const auswahl = JSON.parse(await readFile(new URL("auswahl.json", root), "utf8"));
const fehlend = [];
const geschichten = auswahl.geschichten.flatMap((g) => {
  const f = folgen.get(g.nr);
  if (!f) { fehlend.push(g.nr); return []; }
  return [{ ...g, audio: f.url, sekunden: f.sekunden }];
});

const out = {
  erstellt: new Date().toISOString(),
  quelle: "Deutsch lernen durch Hören – www.einfachdeutschlernen.com",
  gruppen: auswahl.gruppen,
  geschichten,
};
await writeFile(new URL("kinder.json", root), JSON.stringify(out, null, 2) + "\n");

// Alle Folgen, neueste zuerst, eine Zeile pro Folge (lesbare Git-Diffs, kein Zeitstempel)
const katalog = [...folgen].sort((a, b) => b[0] - a[0]).map(([nr, f]) =>
  JSON.stringify({ nr, titel: kurztitel(f.original) || f.original, sekunden: f.sekunden, datum: f.datum, audio: f.url }));
await writeFile(new URL("katalog.json", root), "[\n" + katalog.join(",\n") + "\n]\n");

console.log(`Feed: ${folgen.size} Folgen · Hörkiste: ${geschichten.length} Geschichten`);
if (fehlend.length) {
  console.warn(`Nicht im Feed gefunden: #${fehlend.join(", #")}`);
  process.exitCode = 1;
}
