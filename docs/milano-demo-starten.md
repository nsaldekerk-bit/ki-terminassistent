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
lädt Next die drei Schriften (Jost, Geist und Parisienne) einmal herunter
und legt sie lokal ab — dafür braucht der Rechner beim **ersten** Start kurz
Internet, danach nicht mehr.

## Die Seiten

| Adresse | Inhalt |
|---|---|
| `/milano` | Startseite mit allen Abschnitten |
| `/milano/leistungen` | Preisliste nach Kategorien |
| `/milano/termin` | Buchungsstrecke einzeln — der Link für die Instagram-Bio |
| `/milano/termin/<nummer>` | Der gebuchte Termin, mit Selbst-Absage |
| `/milano/galerie` | Galerie |
| `/milano/kontakt` | Adresse, Zeiten, Anfahrt und Kontaktformular |
| `/milano/impressum` | Impressum (Platzhalter) |
| `/milano/datenschutz` | Datenschutz (Platzhalter) |
| `/milano/salon` | **Innenansicht für den Inhaber** — nicht verlinkt |

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

## Was funktioniert

Alles, was man im Gespräch anfassen würde — und zwar echt, nicht nachgestellt:

- **Buchen.** Leistung → Stuhl → Tag → Uhrzeit → Kontakt. Der Termin wird
  gespeichert, bekommt eine Buchungsnummer und belegt den Platz wirklich.
- **Freie Zeiten.** Aus den Öffnungszeiten minus dem, was auf den Stühlen
  schon vergeben ist. 15-Minuten-Raster, Dauer der Leistung wird
  eingerechnet, keine Zeiten in der Vergangenheit, drei Wochen im Voraus.
  Wer „egal" wählt, bekommt den ersten freien Stuhl.
- **Doppelbuchung ist unmöglich.** Wird derselbe Platz zweimal gewählt,
  kommt eine Fehlermeldung und die Auswahl lädt neu.
- **Bestätigung, Benachrichtigung, Erinnerung.** Alle drei entstehen beim
  Buchen im Wortlaut und liegen im Postausgang unter `/milano/salon`. Die
  Erinnerung ist auf den Vortag, 18:00 Uhr terminiert.
- **Selbst-Absage.** Der Link aus der Bestätigung führt auf
  `/milano/termin/<nummer>`. Absagen gibt den Platz sofort wieder frei und
  löscht die noch ausstehende Erinnerung.
- **Innenansicht für den Inhaber** unter `/milano/salon`: Terminbuch nach
  Tagen, Postausgang zum Aufklappen, Absagen aus dem Laden heraus.
- **Chat-Assistent.** Er antwortet wirklich — auf Preise, Öffnungszeiten,
  Leistungen, Anfahrt, Absage, Kinder, Parken, Zahlung. Er rechnet dabei mit
  den Daten des Salons und der echten Uhrzeit.
- **Kontaktformular** auf `/milano/kontakt`. Die Nachricht landet im selben
  Postausgang.
- Live-Öffnungsstatus, Preisliste, Klick-zum-Anrufen, Route zu Google Maps,
  aufklappbare FAQ, Galerie — mobil wie am Desktop.

### Was bewusst nicht passiert

**Es wird nichts verschickt.** Keine Mail, keine SMS. Die Texte stehen im
Postausgang, damit man sie vorlesen kann. Das ist im Verkaufsgespräch eher
Vorteil als Nachteil: Es zeigt genau die Stelle, an der es weitergeht.

**Es liegt nichts in einer Datenbank.** Alles steht in
`.milano-demo/daten.json` im Projektordner. Der Ordner ist von Git
ausgenommen und verlässt den Rechner nicht.

### Was der Ausbau dazugibt (der Aufpreis-Teil)

- Echter Mailversand: Bestätigung, Erinnerung und Absage gehen wirklich raus
- Daten im Mandanten `milano` der Datenbank statt in einer Datei
- Der Assistent antwortet mit dem Sprachmodell statt nach festen Regeln
  (Widget aus `/embed/<mandant>`)
- Verfügbarkeit aus dem echten Kalender des Ladens, Urlaub und Krankheit
- Echte Salonfotos in der Galerie, Instagram-Anbindung, eingebettete Karte

## Vorschlag für die Vorführung

Zehn Minuten, in dieser Reihenfolge:

1. `/milano` auf dem Handy zeigen — scrollen, Öffnungsstatus zeigen.
2. Den Assistenten öffnen und **„Was kostet ein Fade?"** tippen. Dann
   **„Wo kann ich parken?"** — er sagt ehrlich, dass die Antwort fehlt. Das
   ist der Moment, in dem der Inhaber merkt, dass er etwas beitragen muss.
3. Einen Termin buchen. Die Buchungsnummer vorlesen.
4. **Denselben Platz noch einmal buchen wollen** — er ist weg.
5. `/milano/salon` aufmachen: Da steht die Buchung. Postausgang aufklappen,
   die Bestätigung vorlesen. Auf die Erinnerung zeigen, die auf den Vortag
   terminiert ist.
6. Zurück auf den Absage-Link, absagen — der Platz ist sofort wieder frei.

Vor dem nächsten Kunden auf `/milano/salon` **„Demo zurücksetzen"** drücken.
Dasselbe tut auch `rm -rf .milano-demo` im Projektordner.

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

## Wo was liegt

| Datei | Wofür |
|---|---|
| `src/lib/milano/content.ts` | Alle Inhalte und die drei Bestätigt-Schalter |
| `src/lib/milano/slots.ts` | Rechnung der freien Zeiten (rein, ohne Speicher) |
| `src/lib/milano/store.ts` | Lesen und Schreiben von `.milano-demo/daten.json` |
| `src/lib/milano/mails.ts` | Wortlaut von Bestätigung, Erinnerung, Absage |
| `src/lib/milano/assistent.ts` | Die Regeln, nach denen der Chat antwortet |
| `src/lib/milano/hours.ts` | Live-Öffnungsstatus |
| `src/app/api/milano/*` | Die Schnittstellen dahinter |

`slots.ts` und `store.ts` sind absichtlich getrennt: Die Rechnung kennt den
Speicher nicht, sie bekommt die belegten Blöcke übergeben. Beim Ausbau
tauscht man `store.ts` gegen Prisma aus und lässt alles andere unberührt.

## Gestaltung

Die Seite folgt der Vorlage, die der Kunde vorgegeben hat
(larimar-studios.com): weißer Grund, fast schwarze Bänder für FAQ und
Fußzeile, helles Grau für Karten und Bildflächen — **kein Akzentton**.
Überschriften sind leichte, weit gesperrte Versalien mit Punkt am Ende,
Knöpfe sind Pillen in Title Case.

Alle Farben und Maße stehen gesammelt in **`src/app/milano/milano.css`**,
ganz oben als Variablen unter `.milano`:

| Variable | Bedeutung |
|---|---|
| `--weiss`, `--dunkel` | Grund hell bzw. die dunklen Bänder |
| `--grau-karte` | Karten und Bildflächen |
| `--text`, `--text-grau` | Fließtext und sekundärer Text |
| `--r-bild`, `--r-knopf` | Eckenradius für Bilder bzw. Knöpfe |

Die Schriften setzt `src/app/milano/layout.tsx`: **Jost** für Überschriften,
**Geist** für Fließtext, **Parisienne** für die Handschrift unter der
Wortmarke.

**Bilder:** Überall, wo ein Foto hingehört, steht das Milano-Monogramm aus
`src/components/milano/Brand.tsx` auf grauer Fläche — im Karussell, in den
drei Karten, im Bilderstreifen. Die Flächen haben schon das richtige
Format; ein echtes Foto tritt an dieselbe Stelle, ohne dass sich am Aufbau
etwas ändert.
