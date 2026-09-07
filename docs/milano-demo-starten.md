# Milano-Demo starten und vorführen

Die Demoseite läuft **rein lokal** und braucht **keine Datenbank** — genau
dafür wurde sie so gebaut. Zwei Befehle, dann steht sie.

## Starten

```bash
npm install     # nur beim ersten Mal
npm run dev
```

Dann im Browser öffnen:

```
http://localhost:3000/milano
```

Das war's. Kein Postgres, keine `.env`, kein Deployment. Beim ersten Start
lädt Next die beiden Schriften (Bodoni Moda und Geist) einmal herunter und
legt sie lokal ab — dafür braucht der Rechner beim **ersten** Start kurz
Internet, danach nicht mehr.

## Die Seiten

| Adresse | Inhalt |
|---|---|
| `/milano` | Startseite mit allen Abschnitten |
| `/milano/leistungen` | Preisliste nach Kategorien |
| `/milano/termin` | Buchungsstrecke einzeln — der Link für die Instagram-Bio |
| `/milano/impressum` | Impressum (Platzhalter) |
| `/milano/datenschutz` | Datenschutz (Platzhalter) |

## Auf dem Handy des Kunden zeigen

Im Laden am überzeugendsten: Er hält es selbst in der Hand.

```bash
npm run dev -- --hostname 0.0.0.0
```

Beim Start zeigt Next eine zweite Adresse an („Network: http://192.168.x.x:3000").
Handy und Laptop müssen im selben Netz sein — im Zweifel den Hotspot des
Laptops aufmachen. Dann ruft er `http://192.168.x.x:3000/milano` auf.

Rückfallebene, falls im Laden etwas klemmt: vorher eine Bildschirmaufnahme
machen.

## Was funktioniert — und was noch nicht

**Funktioniert und lässt sich vorführen**

- Alle Abschnitte der Startseite, mobil wie am Desktop
- Live-Öffnungsstatus („Jetzt geöffnet · bis 18:30") — rechnet mit der echten Uhrzeit
- Vollständig klickbare Buchungsstrecke: Leistung → Mitarbeiter → Tag → Uhrzeit → Kontakt → Bestätigung
- Preisliste, Klick-zum-Anrufen, Route zu Google Maps, aufklappbare FAQ
- Der Chat-Assistent unten rechts als Oberfläche

**Kommt im nächsten Schritt dazu (der Aufpreis-Teil)**

- Buchung wird wirklich gespeichert (Mandant `milano` in der Datenbank)
- Bestätigungsmail an den Kunden, Benachrichtigung an den Salon
- Erinnerung einen Tag vorher, Selbst-Absage über den Link
- Freie Zeiten aus dem echten Kalender statt erzeugt, Verfügbarkeit pro Stuhl
- Der Chat-Assistent antwortet wirklich (Widget aus `/embed/<mandant>`)
- Galerie mit echten Fotos, Instagram-Anbindung, Karte

Die Bestätigungsansicht sagt das dem Betrachter auch selbst — dort steht ein
Hinweis, dass noch nichts gespeichert und nichts verschickt wurde. Das ist
im Verkaufsgespräch eher Vorteil als Nachteil: Es zeigt genau die Stelle, an
der es weitergeht.

## Was du an einer Stelle änderst

Alles Inhaltliche liegt in **`src/lib/milano/content.ts`**:

- `leistungen` — Namen, Beschreibungen, Dauer, Preise
- `oeffnungszeiten` — Zeiten je Wochentag
- `team` — Mitarbeiter
- `faq`, `bewertungen`, `salon` — Fragen, Rezensionen, Kontaktdaten

Ganz oben stehen drei Schalter:

```ts
export const ZEITEN_BESTAETIGT = false;
export const PREISE_BESTAETIGT = false;
export const TEAM_BESTAETIGT   = false;
```

Solange sie auf `false` stehen, zeigt die Seite die betroffenen Werte in
[eckigen Klammern] und blendet den Hinweis „Beispielpreise" ein. Sobald der
Inhaber die echten Angaben geliefert hat: Werte eintragen, Schalter auf
`true` — und die Klammern verschwinden überall gleichzeitig.

## Gestaltung

Die Farben, Schriftgrößen und Bausteine stehen gesammelt in
**`src/app/milano/milano.css`**, ganz oben als Variablen unter `.milano`.
Wer die Messingfarbe ändern will, ändert `--messing` — und die ganze Seite
zieht nach.
