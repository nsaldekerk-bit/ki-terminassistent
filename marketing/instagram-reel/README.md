# Instagram-Reel: westfaliadigital.de

**Video:** [`westfalia-digital-reel.mp4`](westfalia-digital-reel.mp4). Format 1080 × 1920 (9:16), 30 fps, 32 s, H.264 und AAC-Stereo. Das entspricht der Instagram-Reel-Spezifikation.
**Titelbilder:** [`cover_hook.jpg`](cover_hook.jpg) mit der Hook-Frage und [`cover_endcard.jpg`](cover_endcard.jpg) mit der Endkarte.
**Posting-Text:** [`caption.md`](caption.md)

## Ablauf (120 BPM, jeder Schnitt sitzt auf dem Beat)

| Zeit | Szene | Effekte |
|---|---|---|
| 0–2 s | Hook: „Ihre Website bringt keine **Anfragen?**“ → „Das ändern wir.“ | Wörter auf den Beat, Impacts, Kamera-Shake, RGB-Glitch, Zoom-Through |
| 2–4 s | Startseite im 3D-Handy | Drop, Lichtblitz, Light-Leak, Beat-Pulse |
| 4–5,5 s | Startseite Desktop im Browserfenster | Whip-Pan mit Bewegungsunschärfe |
| 5,5–7 s | 360°-System: Marketing · Webseite · Automatisierung | Glitch-Schnitt, Wort-Pops |
| 7–10 s | Leistungen: Marketing, dann Automatisierung 24/7 | Slice-Wipe, Zoom-Punch |
| 10–13 s | Webseiten, dann **kostenloser Website-Check in 24 h** | Whip-Pans, Kreis-Reveal, „GRATIS“-Stempel |
| 13–14 s | Team am Niederrhein | Zoom-In |
| 14–16 s | Breakdown: „Überzeugt?“ und der große **„Termin buchen“-Button** | Riser, Snare-Roll, Finger-Tap, Schockwelle |
| 16–28 s | **Echte Buchung** mit dem Terminassistenten der Seite: Thema, Wunschtag, Uhrzeit, Kontaktdaten, Absenden | Tap-Ripples, Schritt-Anzeige, Tastatur- und UI-Sounds, Konfetti und Erfolgs-Chime |
| 28–32 s | Endkarte: Logo, „Ihr kostenloses Erstgespräch wartet.“, Website-Check · Erstgespräch · Beratung, CTA, URL, @westfaliadigital | Final Hit, Strahlen, pulsierender Button |

Alles im Video stammt von der echten Website (Repo `westfalia-digital`). Die Seite wurde lokal gebaut und im Browser Bild für Bild aufgenommen. Die Buchung ist echt durchgeklickt. Nur das Absenden (`/api/contact`) wurde bei der Aufnahme abgefangen. Deshalb ist keine echte Anfrage und keine E-Mail rausgegangen. „Max Mustermann“ ist ein Platzhalter.

Musik und Sounds sind komplett selbst synthetisiert (`tools/audio.py`). Es gibt also keine Lizenzfragen.

> Hinweis zur Wortwahl: Im Video heißt es „Terminassistent“, nicht „KI-Terminassistent“. Der Assistent auf westfaliadigital.de ist laut Code regelbasiert, und seine eigene Transparenzzeile sagt „Automatisierter Terminassistent“. Sobald dort der KI-Terminassistent läuft, reicht eine Textänderung in `tools/reel.html`. Danach neu rendern, wie unten beschrieben.

## Neu erzeugen

Voraussetzungen: Node 22, Python 3.11 und die Website aus dem Repo `westfalia-digital` als Production-Build auf Port 3100 (`npx next build && npx next start -p 3100`).

```bash
cd marketing/instagram-reel/tools
npm install                       # Playwright (nutzt das vorinstallierte Chromium)
pip install -r requirements.txt

node clips.js                     # 1. Seite aufnehmen → clips/<szene>/*.jpg
node render.js 0 960 frames       # 2. Reel rendern → frames/*.jpg (+ sfx.json mit allen Sound-Events)
python3 audio.py                  # 3. Soundtrack → soundtrack.wav
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -framerate 30 -i frames/%04d.jpg -i soundtrack.wav -c:v libx264 -profile:v high -preset slow \
    -crf 19 -maxrate 14M -bufsize 28M -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart \
    -shortest westfalia-digital-reel.mp4
```

- `vtime.js`: Wird vor jedem Seiten-Script geladen und ersetzt die Uhr der Seite durch eine virtuelle Uhr (Timer, `requestAnimationFrame`, CSS-Animationen). Dadurch lässt sich die echte Seite ruckelfrei Bild für Bild aufnehmen.
- `recorder.js` / `clips.js`: Aufnahme der einzelnen Szenen und des Buchungsablaufs, inklusive Tap-Log.
- `reel.html` / `render.js`: Compositor mit Handy- und Browser-Mockups, Übergängen, Texten und Effekten. Jedes Bild ist eine reine Funktion der Zeit. Die Sound-Events kommen aus derselben Zeitleiste, damit Bild und Ton synchron bleiben.
- `audio.py`: 120-BPM-Track (Am–F–C–G) plus Sounddesign, Mastering auf ca. −12 LUFS.
