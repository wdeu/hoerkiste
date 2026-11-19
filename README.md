# Hörkiste 🎧

Kindgerechter Player für ausgewählte Geschichten aus dem kostenlosen Podcast
**„Deutsch lernen durch Hören“** von [einfachdeutschlernen.com](https://www.einfachdeutschlernen.com/).

- Große Bildkacheln, ein Tipp startet die Geschichte
- Riesiger Play/Pause-Knopf, 10 s zurück/vor, kein Autoplay der nächsten Folge
- Merkt sich die Stelle („▶ weiter“) und vergibt einen ⭐ für fertig gehörte Geschichten
- Läuft als PWA im Vollbild auf dem iPhone, Sperrbildschirm-Steuerung über Media Session
- Audio wird direkt aus dem öffentlichen Podcast-Feed gestreamt, es werden keine Kopien gehostet

## Einrichtung (einmalig)

```sh
cd ~/Projects/hoerkiste
git init -b main && git add -A && git commit -m "Hörkiste: Erstversion"
gh repo create wdeu/hoerkiste --public --source=. --remote=origin --push
gh api -X POST repos/wdeu/hoerkiste/pages -f "source[branch]=main" -f "source[path]=/"
```

GitHub Pages braucht bei einem Free-Account ein öffentliches Repo. Danach läuft die Hörkiste
unter https://wdeu.github.io/hoerkiste. Auf dem iPhone in Safari öffnen → Teilen →
„Zum Home-Bildschirm“.

## Deploy

Raycast **„Hörkiste · Deploy“** (`~/Projects/raycast-scripts/hoerkiste-deploy.sh`):

1. übernimmt optional `hoerkiste-index.html` (→ `index.html`) und `auswahl.json` aus `~/Downloads`
2. baut `kinder.json` und `katalog.json` aus dem Podcast-Feed (`scripts/build-kinder.mjs`)
3. zählt `CACHE` in `sw.js` hoch, wenn sich eine gecachte Datei geändert hat
4. committet und pusht → GitHub Pages
5. spiegelt nach IONOS (`ionos-sync.sh hoerkiste push`), sobald `DEPLOY_IONOS=1` gesetzt ist

## Geschichten ändern

In der Hörkiste unten **„Für Erwachsene“ → „Geschichten auswählen“** (kleine Rechenaufgabe als Sperre):

- alle Folgen des Podcasts mit Suche (Titel oder `#Nummer`), Filter und ▶ Hörprobe
- Haken setzen = in die Kiste; dann Emoji, Gruppe und kindgerechten Titel anpassen
- Änderungen bleiben als Entwurf auf diesem Gerät; **Vorschau** zeigt die Kiste damit, nur hier
- **„auswahl.json laden“** → landet in Downloads → Raycast „Hörkiste · Deploy“ veröffentlicht sie

Am bequemsten am Mac (dann liegt die Datei gleich in `~/Downloads`). Von Hand geht es weiterhin:
`auswahl.json` bearbeiten, `nr` = Folgennummer, `gruppe` = eine der Gruppen-IDs.
Neue Gruppen legst du in `auswahl.json` unter `gruppen` an.

Lokal testen:

```sh
node scripts/build-kinder.mjs        # lädt den Feed
python3 -m http.server 8000          # dann http://localhost:8000
```

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die komplette Oberfläche (HTML, CSS, JS in einer Datei) |
| `auswahl.json` | Deine kuratierte Liste |
| `kinder.json` | Generiert: Auswahl + Audio-URLs + Dauer aus dem Feed |
| `katalog.json` | Generiert: alle Folgen (für „Geschichten auswählen“) |
| `scripts/build-kinder.mjs` | Feed-Parser, ohne Abhängigkeiten (Node 18+) |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA-Teile |

Feed: https://anchor.fm/s/fee008e0/podcast/rss
