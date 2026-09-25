# Instagram-Reel: westfaliadigital.de

**Video:** `westfalia-digital-reel.mp4`. Format 1080 × 1920 (9:16), 30 fps, 32 s, H.264 und AAC-Stereo. Das entspricht der Instagram-Reel-Spezifikation. Die Datei ist bewusst nicht im Repo, weil `.gitignore` Videodateien ausschließt. Sie wurde im Chat übergeben und lässt sich mit den Schritten unten jederzeit neu erzeugen.
**Titelbilder:** [`cover_hook.jpg`](cover_hook.jpg) mit der Hook-Frage und [`cover_endcard.jpg`](cover_endcard.jpg) mit der Endkarte.
**Posting-Text:** [`caption.md`](caption.md)

## Ablauf

Die Stilmittel sind ruhig und hochwertig gehalten. Jede Szene hat dieselbe Titelposition, Texte erscheinen über Masken-Reveals, und die Kamera bewegt sich weich. Das Handy bleibt durchgehend im Bild und wechselt die Seiteninhalte per Wischbewegung. Die Übergänge sitzen auf dem Takt (120 BPM).

| Zeit | Szene |
|---|---|
| 0–2 s | Hook: „Ihre Website bringt keine **Anfragen?**“ |
| 2–4 s | Startseite im Handy: „Wir machen Wachstum planbar.“ |
| 4–6 s | Startseite Desktop im Browserfenster: „Alles aus einer Hand.“ |
| 6–8 s | Leistungen Marketing: „Mehr Kunden – planbar & messbar.“ |
| 8–10 s | Automatisierung: „Keine Anfrage geht verloren.“ |
| 10–12 s | **Kostenloser Website-Check** (100 % kostenlos, in 24 Stunden) |
| 12–14 s | Team: „Ihre Ansprechpartner am Niederrhein.“ |
| 14–16 s | „Bereit für mehr Anfragen?“ und der **„Termin buchen“-Button** wird angetippt |
| 16–25 s | **Echte Buchung** mit dem Terminassistenten der Seite: Thema, Wunschtag, Uhrzeit, Kontaktdaten, Prüfen & absenden. Mit Fortschrittsleiste in 5 Schritten. |
| 25–28 s | Grüner Haken: „Termin angefragt. Die Bestätigung kommt per E-Mail.“ |
| 28–32 s | Endkarte: Logo, „Ihr kostenloses Erstgespräch wartet.“, Website-Check · Erstgespräch · Beratung, „Termin buchen“, westfaliadigital.de, @westfaliadigital |

Alles im Video stammt von der echten Website (Repo `westfalia-digital`). Die Seite wurde lokal gebaut und im Browser Bild für Bild aufgenommen. Die Buchung ist echt durchgeklickt. Nur das Absenden (`/api/contact`) wurde bei der Aufnahme abgefangen. Deshalb ist keine echte Anfrage und keine E-Mail rausgegangen. „Max Mustermann“ ist ein Platzhalter.

Musik und Sounds sind komplett selbst synthetisiert (`tools/audio.py`): ein Deep-House-Groove mit E-Piano-Akkorden (Am9 – Fmaj9 – C6/9 – G6) und dezenten UI-Sounds. Es gibt also keine Lizenzfragen.

> Hinweis zur Wortwahl: Im Video heißt es „Terminassistent“, nicht „KI-Terminassistent“. Der Assistent auf westfaliadigital.de ist laut Code regelbasiert, und seine eigene Transparenzzeile sagt „Automatisierter Terminassistent“. Sobald dort der KI-Terminassistent läuft, reicht eine Textänderung in `tools/reel.html`. Danach neu rendern, wie unten beschrieben.

## Neu erzeugen

Voraussetzungen: Node 22, Python 3.11 und die Website aus dem Repo `westfalia-digital` als Production-Build auf Port 3100 (`npx next build && npx next start -p 3100`).

```bash
cd marketing/instagram-reel/tools
npm install                       # Playwright (nutzt das vorinstallierte Chromium)
pip install -r requirements.txt

node clips.js m_booking c_hero c_dhero c_leist c_auto c_check c_team   # 1. Seite aufnehmen → clips/
node render.js 0 960 frames       # 2. Reel rendern → frames/*.jpg (+ sfx.json mit allen Sound-Events)
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
