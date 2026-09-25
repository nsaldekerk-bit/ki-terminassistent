# Instagram-Reel: westfaliadigital.de

**Video:** `westfalia-digital-reel.mp4`. Format 1080 × 1920 (9:16), 30 fps, 23 s, H.264 und AAC-Stereo. Das entspricht der Instagram-Reel-Spezifikation. Die Datei ist bewusst nicht im Repo, weil `.gitignore` Videodateien ausschließt. Sie wurde im Chat übergeben und lässt sich mit den Schritten unten jederzeit neu erzeugen.
**Titelbilder:** [`cover_hook.jpg`](cover_hook.jpg) mit der Hook-Frage und [`cover_endcard.jpg`](cover_endcard.jpg) mit der Endkarte.
**Posting-Text:** [`caption.md`](caption.md)

## Ablauf

Das Video ist schnell geschnitten, bleibt aber aufgeräumt. Alle Schnitte liegen auf einem 124-BPM-Raster, teilweise wird auf jedem Beat geschnitten. Die Effekte: Whip-Pans mit Bewegungsunschärfe, Zoom-Punches im Takt, kurze Lichtblitze, ein Glanz auf den Geräten, ein unscharfer Hintergrund aus der jeweiligen Seite, ein Zoom durch den Button in die Buchung und in der Buchung eine Kamera, die bei jedem Schritt auf eine neue Nahaufnahme springt.

| Beat (Zeit) | Szene |
|---|---|
| 0–4 (0–1,9 s) | Hook: „Ihre Website bringt keine **Anfragen?**“ |
| 4–6 (1,9–2,9 s) | Startseite im Handy: „Ihre Digitalagentur vom Niederrhein.“ |
| 6–8 (2,9–3,9 s) | Startseite Desktop: „Alles aus einer Hand.“ |
| 8–12 (3,9–5,8 s) | Ein Schnitt pro Beat: „Marketing.“ · „Webseiten.“ · „Automatisierung.“ · „Alles verbunden.“ (360°-Grafik) |
| 12–14 (5,8–6,8 s) | **Kostenloser Website-Check** (unverbindlich) |
| 14–16 (6,8–7,7 s) | Team: „Feste Ansprechpartner.“ |
| 16–20 (7,7–9,7 s) | „Lernen wir uns kennen?“ und der **„Termin anfragen“-Button** wird angetippt, Zoom in die Buchung |
| 20–37 (9,7–17,9 s) | **Echte Buchung** mit dem Terminassistenten der Seite. Jeder Tipp liegt auf einem Beat: Thema, Wunschtag, Uhrzeit, Kontaktdaten, Prüfen & absenden. Mit Fortschrittsleiste in 5 Schritten. |
| 37–40 (17,9–19,4 s) | Grüner Haken: „Anfrage gesendet. Kostenlos & unverbindlich.“ |
| 40–48 (19,4–23,2 s) | Endkarte: Logo, „Kostenloses Erstgespräch anfragen.“, Website-Check · Erstgespräch · Beratung, „Termin anfragen“, westfaliadigital.de, @westfaliadigital |

Alles im Video stammt von der echten Website (Repo `westfalia-digital`). Die Seite wurde lokal gebaut und im Browser Bild für Bild aufgenommen. Die Buchung ist echt durchgeklickt. Nur das Absenden (`/api/contact`) wurde bei der Aufnahme abgefangen. Deshalb ist keine echte Anfrage und keine E-Mail rausgegangen. „Max Mustermann“ ist ein Platzhalter.

Musik und Sounds sind komplett selbst synthetisiert (`tools/audio.py`). Die Musik ist eine seriöse, zurückhaltende Untermalung in d-Moll, die am Ende nach F-Dur auflöst: ein tiefer Puls, ein gedämpftes Pluck-Ostinato, tiefe Streicher, einzelne weiche Klaviertöne und ein leiser Kick. Die Soundeffekte sind dezent gehalten: Whooshes an den Übergängen, ein Klick bei jedem schnellen Schnitt und jedem Button-Druck, kurze Bestätigungstöne, nachdem der Assistent eine Auswahl angenommen hat, sehr leises Tippen und ein Bestätigungston am Ende. Lizenzfragen gibt es keine.

Mit `ONLY_SFX=1 python3 audio.py` entsteht dieselbe Tonspur ohne Musik. Die Effekte bleiben dabei gleich laut. So lässt sich auch ein Song aus der Instagram-Musikbibliothek darunterlegen.

> Keine Versprechen: Die eingeblendeten Texte beschreiben nur Leistungen. Sie versprechen weder Kunden noch Ergebnisse noch Fristen, und die Buchung wird als unverbindliche Anfrage gezeigt. Die Texte, die in den Aufnahmen auf der Website selbst zu sehen sind, stammen von der Seite und sind unverändert. Beim 360°-Schnitt sind die Werbeaussagen der Seite (z. B. „Mehr Kunden“) abgedunkelt.

> Hinweis zur Wortwahl: Im Video heißt es „Terminassistent“, nicht „KI-Terminassistent“. Der Assistent auf westfaliadigital.de ist laut Code regelbasiert, und seine eigene Transparenzzeile sagt „Automatisierter Terminassistent“. Sobald dort der KI-Terminassistent läuft, reicht eine Textänderung in `tools/reel.html`. Danach neu rendern, wie unten beschrieben.

## Neu erzeugen

Voraussetzungen: Node 22, Python 3.11 und die Website aus dem Repo `westfalia-digital` als Production-Build auf Port 3100 (`npx next build && npx next start -p 3100`).

```bash
cd marketing/instagram-reel/tools
npm install                       # Playwright (nutzt das vorinstallierte Chromium)
pip install -r requirements.txt

node clips.js m_booking m_system d_leist c_hero c_dhero c_leist c_auto c_check c_team   # 1. Seite aufnehmen → clips/
node render.js 0 697 frames       # 2. Reel rendern → frames/*.jpg (+ sfx.json mit allen Sound-Events)
python3 audio.py                  # 3. Soundtrack → soundtrack.wav
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -framerate 30 -i frames/%04d.jpg -i soundtrack.wav -c:v libx264 -profile:v high -preset slow \
    -crf 18 -maxrate 14M -bufsize 28M -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart \
    -shortest westfalia-digital-reel.mp4
```

- `vtime.js`: Wird vor jedem Seiten-Script geladen und ersetzt die Uhr der Seite durch eine virtuelle Uhr (Timer, `requestAnimationFrame`, CSS-Animationen). Dadurch lässt sich die echte Seite ruckelfrei Bild für Bild aufnehmen.
- `recorder.js` / `clips.js`: Aufnahme der einzelnen Szenen und des Buchungsablaufs, inklusive Tap-Log.
- `reel.html` / `render.js`: Compositor mit Handy- und Browser-Mockup, Titeln, Übergängen und Endkarte. Jedes Bild ist eine reine Funktion der Zeit. Die Sound-Events kommen aus derselben Zeitleiste, damit Bild und Ton synchron bleiben.
- `audio.py`: Musik und Sounddesign, Mastering auf ca. −12 LUFS und −1,2 dBFS Peak.
