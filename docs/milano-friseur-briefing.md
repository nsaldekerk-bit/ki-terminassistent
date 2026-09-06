# Demo-Webseite „Milano Friseur", Geldern — Briefing & Bauplan

**Auftraggeber der Demo:** westfaliadigital (Eigenwerbung / Neukundengewinnung)
**Zielkunde:** Milano Friseur, Issumer Str. 3, 47608 Geldern
**Zweck:** Unverbindliche Demo-Webseite als Verkaufsargument — der Inhaber soll in 60 Sekunden
sehen, was ihm fehlt (24/7-Terminbuchung, Sichtbarkeit bei Google, Instagram → Termin).
**Stand:** 06.09.2026 · Bauphase startet am Folgetag
**Branch:** `claude/milano-friseur-demo-site-r2a5bu`

---

## 0. Der wichtigste strategische Punkt

Dieses Repo ist **nicht leer** — hier läuft bereits der `KI-Terminassistent`: Multi-Tenant,
Chat-Widget, Verfügbarkeitsberechnung, Buchung, Umbuchung/Absage per Link, E-Mail-Bestätigung,
24h-Erinnerungs-Cron, Admin-Dashboard, FAQ-Engine und ein 5-Sprachen-Switcher.

**Daraus folgt: Wir bauen keine Buchung neu.** Die Demo-Seite für Milano wird ein
neuer Mandant (Tenant `milano`) im bestehenden System — die Webseite ist die Schaufassade,
der Terminassistent ist der Motor, der schon läuft. Das ist gleichzeitig das
stärkste Verkaufsargument im Termin: „Das ist keine Bilder-Webseite, das ist ein
Mitarbeiter, der nachts um 23 Uhr Termine annimmt."

Vorhandene Bausteine, die wir wiederverwenden:

| Baustein | Datei | Nutzen für Milano |
|---|---|---|
| Chat-Widget (Bubble unten rechts) | `src/components/widget/ChatWidget.tsx`, `public/embed.js` | Terminbuchung im Dialog |
| Einbett-Seite pro Mandant | `src/app/embed/[tenantSlug]/page.tsx` | `/embed/milano` |
| Freie Slots berechnen | `src/lib/availability/slots.ts`, `widget.ts` | Kalender auf der Seite |
| Buchen + Konflikte | `src/lib/availability/book.ts`, `conflicts.ts` | echte Termine |
| Selbstbedienung Umbuchen/Absagen | `src/app/termin/[token]/` | „Ohne Anruf verschieben" |
| E-Mails (Bestätigung, Erinnerung) | `src/lib/mail/templates/` | Weniger No-Shows |
| Erinnerungs-Cron 17:00 | `src/app/api/cron/reminders/route.ts`, `vercel.json` | Läuft schon |
| FAQ-Regelwerk + Claude | `src/lib/faq/`, `src/lib/ai/` | „Habt ihr Samstag offen?" |
| Sprachen de/en/tr/pl/ru | `src/lib/i18n/` | Mehrsprachige Kundschaft |
| Admin-Dashboard | `src/app/admin/(dashboard)/` | Zeigt dem Inhaber „seine" Oberfläche |
| Mandant anlegen | `npm run create-tenant` | Tenant `milano` in 1 Minute |

---

## 1. Was wir über den Laden wissen — und was nicht

### 1.1 Gesicherte Fakten (aus Google Business & Instagram)

| Feld | Wert | Quelle |
|---|---|---|
| Name | Milano Friseur | Google |
| Branche | Friseur / Friseursalon | Google |
| Adresse | Issumer Str. 3, 47608 Geldern | Google |
| Telefon | 02831 9777887 | Google |
| Weitere Nummern | 0160 4245893, 02831 9167867 | Instagram-Bio |
| Instagram | @milano.friseur, ca. 320 Follower | Instagram |
| Website | (bisher nur Instagram verlinkt) | Google |
| Bewertung Google | 4,9 ★ aus 33 Rezensionen | Google |
| Bewertung Infobel | 4,9 ★ aus 29 Rezensionen | Infobel |
| Öffnungszeit | „Öffnet Mo um 09:00" — Rest unbekannt | Google |

### 1.2 Was wir NICHT wissen (⚠️ nicht erfinden, morgen als Platzhalter kennzeichnen)

- Vollständige Öffnungszeiten (nur Montag 09:00 bekannt), Ruhetag, Mittagspause
- Leistungen und Preise, Dauer je Leistung
- Ob **nur Herren** (Barbershop) oder **auch Damen** (Farbe, Strähnen, Hochsteckfrisuren)
- Team: Anzahl Stühle, Namen der Friseure, Sprachen
- Rechtsform, Inhabername, USt-IdNr. → **zwingend für das Impressum**
- Welche der drei Telefonnummern die offizielle ist
- E-Mail-Adresse (bisher keine öffentlich)
- Walk-in oder Termin, Zahlungsarten (Karte?), Parkmöglichkeiten
- Ob Gutscheine verkauft werden, ob Personal gesucht wird

### 1.3 Positionierung, die wir aus den Signalen ableiten

- 4,9 ★ bei 33 Bewertungen = **überdurchschnittlich gut bewertet, aber wenig Reichweite.**
  Der Laden ist gut, nur unsichtbar. Genau das ist unser Pitch.
- Rezensionstexte („beste Frisuren in Geldern", „sehr freundlich und respektvoll",
  internationale Namen) deuten auf **junge, mehrsprachige, männlich geprägte Stammkundschaft**
  hin — Fade/Skin-Fade/Bart-Kompetenz, Empfehlungsgeschäft.
- Der Name „Milano" gibt die Designrichtung vor: **italienischer Barbershop**,
  nicht Wellness-Salon.
- Einzugsgebiet: Geldern + Issum, Kevelaer, Straelen, Wachtendonk, Nieukerk, Kerken,
  Sevelen — ländlich, Auto, „Friseur in meiner Nähe"-Suchen.

---

## 2. Ziele der Demo-Seite

**Geschäftlich (für Milano):**
1. Termine ohne Telefon annehmen — auch nachts, sonntags, während des Schneidens.
2. Instagram-Follower (320) in Buchungen umwandeln — ein Link in der Bio statt DM-Chaos.
3. Bei Google für „Friseur Geldern" gefunden werden (heute: keine eigene Website).
4. No-Shows senken (Erinnerung + Selbst-Umbuchung).
5. Die 4,9 ★ sichtbar machen, statt sie in Google zu verstecken.

**Verkäuferisch (für uns):**
- Die Demo muss **auf dem Handy im Laden** funktionieren — der Inhaber schaut sie zwischen
  zwei Kunden auf dem eigenen Telefon an. Mobile-First ist keine Option, sondern die Demo selbst.
- Es muss **echt** wirken: echter Salonname, echte Adresse, echte Bewertungen (mit Quelle),
  aber klar als Entwurf gekennzeichnet (siehe § 9.4).
- Ein „Aha"-Moment muss eingebaut sein: Er tippt selbst auf „Termin buchen", bucht sich
  einen Testtermin, bekommt die Bestätigungsmail auf sein Handy. **Das** verkauft.

**Messbar (was wir auf dem Verkaufsblatt behaupten können):**
- Ladezeit < 2 s auf 4G, Lighthouse ≥ 95 in allen vier Kategorien
- Buchung in ≤ 4 Taps vom Hero bis zur Bestätigung

---

## 3. Seitenstruktur (Sitemap)

```
/                     Startseite (One-Pager mit Ankern, alle Kernsektionen)
/leistungen           Volle Preisliste, nach Kategorien filterbar
/team                 Die Friseure, je mit „Bei mir buchen"-Button
/galerie              Arbeiten, Vorher/Nachher, Instagram-Feed
/termin               Buchungsstrecke als eigene Seite (Instagram-Bio-Link!)
/termin/[token]       Umbuchen/Absagen (existiert bereits)
/kontakt              Karte, Anfahrt, Formular, WhatsApp
/gutschein            Gutschein anfragen/kaufen (optional, § 5 „Kür")
/jobs                 Friseur:in gesucht — Bewerbungsformular (optional)
/impressum            Pflicht
/datenschutz          Pflicht
/embed/milano         Widget-Ansicht (existiert bereits)
```

### Startseite, Sektion für Sektion

| # | Sektion | Inhalt | Funktion |
|---|---|---|---|
| 1 | Sticky Header | Logo, Navigation, Sprachwahl, Telefon-Icon, Button „Termin buchen" | Schrumpft beim Scrollen |
| 2 | Hero | Großes Salonfoto/Video-Loop, H1 „Friseur in Geldern", Bewertungs-Badge 4,9 ★ (33), **Live-Öffnungsstatus** („Jetzt geöffnet · schließt um 18:30"), 2 CTAs | Öffnungsstatus aus der DB berechnet, nicht statisch |
| 3 | Vertrauensleiste | 4,9 ★ Google · 33 Bewertungen · Sprachen · Termin in 30 Sekunden | Zahlen, keine Floskeln |
| 4 | Leistungen & Preise | Karten mit Dauer, Preis, Kurzbeschreibung; Tabs Herren/Damen/Bart/Kinder | Jede Karte hat „Diesen Termin buchen" → springt vorbelegt in die Buchung |
| 5 | Terminbuchung | **Inline**-Strecke: Leistung → Mitarbeiter → Tag → Uhrzeit → Name/Telefon → fertig | Kein Popup. Conversion-Kern der Seite |
| 6 | Team | Foto, Name, Spezialgebiet, gesprochene Sprachen, „Bei mir buchen" | Bindung an den Lieblingsfriseur |
| 7 | Galerie | Masonry-Grid, Lightbox, Vorher/Nachher-Slider | Instagram-Inhalte zweitverwerten |
| 8 | Bewertungen | Echte Google-Rezensionen mit Quellenangabe, Karussell, Button „Bei Google bewerten" | Aktiv neue Bewertungen einsammeln |
| 9 | Über uns | Kurze Salon-Geschichte, Foto des Teams | Persönlichkeit |
| 10 | Öffnungszeiten & Anfahrt | Wochentabelle (heute hervorgehoben), Karte (Zwei-Klick), Parken, Bus | Karte erst nach Klick laden (DSGVO) |
| 11 | FAQ | Aufklappbar, 8–10 Fragen | Speist zugleich den KI-Assistenten (`FaqEntry`) |
| 12 | Kontakt | Formular, WhatsApp, Instagram, Anruf | Für alles, was kein Termin ist |
| 13 | Footer | Adresse, Zeiten, Rechtliches, Social, „Website von westfaliadigital" | Unser Absender |
| — | Mobile Sticky-Bar | Anrufen · Route · Termin buchen | Immer sichtbar, unten |

---

## 4. Funktionsumfang

### 4.1 Muss (ohne das gehen wir nicht in den Termin)

- [ ] **Online-Terminbuchung 24/7**, inline auf der Seite, mit echten freien Zeiten aus der DB
- [ ] **KI-Chat-Assistent** (Bubble) für Fragen + Buchung im Dialog
- [ ] **Bestätigungs-E-Mail** an den Kunden, **Benachrichtigung** an den Salon
- [ ] **Selbst umbuchen/absagen** über den Link in der Mail
- [ ] **Erinnerung 24 h vorher** (Cron läuft bereits)
- [ ] Klick-zum-Anrufen, WhatsApp-Direktlink, „Route" (Google Maps Deeplink)
- [ ] **Live-Öffnungsstatus** aus den hinterlegten Zeiten
- [ ] Leistungen mit Preis und Dauer
- [ ] Mobile-First, Dark/Light, Tastaturbedienbar, Kontrast AA
- [ ] Local SEO: `HairSalon`-Schema, Sitemap, robots, Open-Graph-Bild
- [ ] Impressum, Datenschutz, Cookie-Hinweis, Zwei-Klick-Karte
- [ ] Mehrsprachig (de/en/tr — vorhanden)

### 4.2 Soll (macht die Demo rund)

- [ ] Buchung **pro Mitarbeiter** (mehrere Stühle parallel) — siehe § 6.3, echte Arbeit
- [ ] Galerie mit Lightbox + Vorher/Nachher-Slider
- [ ] Bewertungssektion + „Jetzt bewerten"-Aufforderung nach dem Termin
- [ ] Preisliste als eigene, filterbare Seite
- [ ] Kontaktformular mit Spam-Schutz (Honeypot + Rate-Limit, kein Captcha)
- [ ] Instagram-Feed (statisch gecacht, nicht per Fremd-Skript → DSGVO)
- [ ] `/termin` als schlanke Landeseite für den Instagram-Bio-Link
- [ ] Admin-Dashboard mit Milano-Daten bestückt (er soll „seine" Termine sehen)

### 4.3 Kann (der Wow-Effekt, wenn Zeit bleibt)

- [ ] **Frisuren-Berater**: 4 Fragen (Haartyp, Länge, Anlass, Pflegeaufwand) → 3 Vorschläge
      aus der Galerie + passende Leistung vorbelegt. Nutzt den vorhandenen Claude-Zugang.
- [ ] **Walk-in-Ampel**: „Gerade wenig los" / „Volles Haus" — aus den gebuchten Slots berechnet
- [ ] **Digitale Treuekarte**: 10. Schnitt gratis, QR-Code im Buchungsbestätigungs-Mail
- [ ] **Gutschein** zum Selbstausdrucken (PDF)
- [ ] **Jobs-Seite** mit Bewerbungsformular (Fachkräftemangel ist im Friseurhandwerk real)
- [ ] **Arabisch** als 6. Sprache (`dir: "rtl"` ist in `src/lib/i18n/config.ts` bereits vorgesehen)
- [ ] WhatsApp-Erinnerung statt/zusätzlich zur E-Mail

### 4.4 Bewusst NICHT (Scope-Grenze)

- Kein Online-Bezahlen / keine Anzahlung (PSD2, AGB, Rückerstattung — sprengt die Demo)
- Kein Kundenkonto mit Passwort (Buchung per Token-Link genügt)
- Kein Shop für Pflegeprodukte
- Keine echte Instagram-API-Anbindung (Token-Pflege), nur gecachte Inhalte

---

## 5. Design-Konzept

### 5.1 Richtung: „Milano Noir"

Italienischer Barbershop: dunkel, warm, hochwertig — Messing statt Neon, Foto statt Illustration.
Dunkle Sektionen lassen Haarfotos besser wirken; helle Sektionen dazwischen halten die Seite
luftig und die Preisliste lesbar.

**Alternative zur Auswahl (§ 11, Frage 2):** „Studio Bianco" — hell, viel Weiß, warmes Beige,
tiefes Grün. Wirkt eher Damen-/Familiensalon.

### 5.2 Farbtoken (Vorschlag „Milano Noir")

| Rolle | Hex | Einsatz |
|---|---|---|
| Ink (Grund dunkel) | `#0E0F11` | Hero, Footer, Bildsektionen |
| Kohle | `#1A1C20` | Karten auf dunklem Grund |
| Creme (Grund hell) | `#F6F2EB` | Preisliste, FAQ, Texte |
| Weiß | `#FFFFFF` | Karten auf hellem Grund |
| **Messing (Akzent)** | `#C8A35A` | Buttons, Linien, Preise, aktive Zustände |
| Messing hell | `#E3C889` | Hover, Fokusring |
| Erfolg | `#3E9B6B` | „Termin bestätigt", „Jetzt geöffnet" |
| Warnung/Zu | `#C4523A` | „Geschlossen" |
| Text auf dunkel | `#EDE8E0` | |
| Text gedämpft | `#9A958C` | |

Italienische Trikolore nur als **Haarlinie** (3-px-Streifen im Footer/Logo), nie flächig —
sonst Pizzeria-Optik.

### 5.3 Typografie

- **Display:** eine Serif mit Charakter für H1/H2 — `Instrument Serif`, `Fraunces` oder
  `Playfair Display`. Über `next/font/google` einbinden: Next lädt sie **zur Build-Zeit
  herunter und hostet sie selbst**, es gibt also keine Verbindung des Besuchers zu Google → DSGVO-sauber.
- **Text:** `Geist` (im Repo bereits eingerichtet, `src/app/layout.tsx`).
- Skala: H1 clamp(2.5rem, 6vw, 4.5rem) · H2 2rem · H3 1.25rem · Body 1.0625rem/1.65 ·
  Klein 0.875rem. Zahlen (Preise, Uhrzeiten) tabellarisch (`font-variant-numeric: tabular-nums`).

### 5.4 Layout & Bewegung

- 8-pt-Raster, Container max. 1200 px, Sektionsabstand 96 px (Desktop) / 64 px (Mobil)
- Radius: 14 px Karten, 999 px Buttons/Chips
- Schatten sparsam, dafür Messing-Hairlines (1 px, 20 % Deckkraft)
- Bewegung: Fade-Up beim Scrollen (`IntersectionObserver`, 300 ms), Bild-Zoom bei Hover 1.03,
  **`prefers-reduced-motion` respektieren** (alles abschalten)
- Kein Karussell-Autoplay im Hero — Ladezeit und Barrierefreiheit

### 5.5 Bildsprache

- Warm, körnig, hoher Kontrast, wenig Sättigung; Nahaufnahmen von Schnittkanten,
  Hände/Schere/Rasiermesser, Ladenatmosphäre.
- **Bis echte Fotos vorliegen:** neutrale Platzhalter mit sichtbarer Kennzeichnung
  „Platzhalter — hier steht später ein Foto aus dem Salon". Niemals fremde Salonfotos oder
  KI-Bilder als echte Aufnahmen des Ladens ausgeben (§ 9.3).
- Format: `next/image`, AVIF/WebP, `sizes` korrekt, LCP-Bild mit `priority`.

### 5.6 Barrierefreiheit (fest eingeplant, nicht optional)

- Kontrast ≥ 4,5:1 für Text; Messing auf Ink prüfen (ggf. `#D9B978` für kleine Schrift)
- Sichtbarer Fokusring auf allem Bedienbaren, Touch-Ziele ≥ 44 px
- Buchungsstrecke vollständig per Tastatur, Slots als echte `<button>`, ARIA-Live für Schritte
- Alt-Texte für alle Bilder, sinnvolle Überschriftenhierarchie, `lang` je Sprache

---

## 6. Technik

### 6.1 Stack (steht fest, ist im Repo)

Next.js **16.2.10** (App Router) · React 19.2.4 · TypeScript · Tailwind **v4** (CSS-first,
`@theme` in `globals.css`) · Prisma 6 + PostgreSQL · NextAuth · Resend/SMTP ·
`@anthropic-ai/sdk` · `date-fns-tz` · `zod` · Deployment Vercel.

> ⚠️ **Regel aus `AGENTS.md`:** Diese Next-Version hat Breaking Changes gegenüber dem
> Trainingsstand. **Vor dem ersten Code** die passende Anleitung in
> `node_modules/next/dist/docs/` lesen (Metadata, Bilder, Fonts, Server Actions, Caching).
> `node_modules` ist derzeit nicht installiert → erster Schritt morgen: `npm install`.

### 6.2 Wo die Seite im Repo lebt

**Empfehlung:** gleiches Repo, eigene Route-Gruppe — die Buchungslogik liegt schon da,
ein zweites Repo würde sie duplizieren.

```
src/app/(sites)/milano/
  layout.tsx          Fonts, Design-Token, Header/Footer, Metadata
  page.tsx            Startseite (Sektionen als Server Components)
  leistungen/page.tsx
  team/page.tsx
  galerie/page.tsx
  termin/page.tsx
  kontakt/page.tsx
  impressum/page.tsx
  datenschutz/page.tsx
src/components/milano/…   Nur für diese Seite: Hero, PriceCard, BookingInline, Gallery, …
src/lib/milano/…          Öffnungsstatus, Content-Konstanten
prisma/seed-milano.ts     Tenant, Standort, Leistungen, Team, FAQ
```

Alle Daten (Leistungen, Zeiten, FAQ) kommen aus der **Datenbank über den Tenant `milano`**,
nicht aus hartkodierten Arrays — dann zeigt das Admin-Dashboard dieselben Daten, und genau
das ist im Verkaufsgespräch der Beweis, dass es kein Bilderrahmen ist.

### 6.3 Technische Befunde, die morgen Arbeit bedeuten

1. **Verfügbarkeit ist pro Standort, nicht pro Mitarbeiter.**
   `src/lib/availability/slots.ts` prüft Terminkonflikte nur gegen `locationId`
   (`slots.ts:30–38`). Für einen Handwerker mit einem Monteur stimmt das; ein Friseursalon
   mit 3 Stühlen kann 3 Termine gleichzeitig. **Ohne Fix zeigt die Demo viel zu wenige freie
   Zeiten.** → Konflikte optional pro `employeeId` filtern, Kapazität = Anzahl Stühle,
   wenn kein Mitarbeiter gewählt wurde.
2. **Slot-Raster 30 Min, Vorlauf 60 Min** (`slots.ts:10–11`, `widget.ts:10`).
   Friseurleistungen dauern 15–20 Min (Bart, Kinder). → Raster auf 15 Min, Vorlauf auf
   30 Min; am besten pro Standort konfigurierbar statt als Konstante.
3. **Handwerker-Sprache im Widget und in den Prompts.**
   `src/lib/ai/prompts.ts`, die Notfall-Felder (`emergencyPhone`, „Wasserrohrbruch") und
   das Einzugsgebiet (`serviceAreaPostcodes`) passen nicht zum Friseur.
   → Für Milano: Notfallpfad aus, Einzugsgebiet leer, `bufferMinutes = 0`
   (kein Anfahrtspuffer), Branchentexte im Prompt.
4. **`Service` hat kein Feld für Beschreibung/Bild.** Die Preiskarten brauchen einen
   Beschreibungstext. → entweder Migration (`description`, `imageUrl`, `sortOrder`) oder
   Texte in `src/lib/milano/content.ts`. Migration ist sauberer und nützt allen Mandanten.
5. **Kein `sitemap.ts`/`robots.ts` im Repo.** Für Local SEO anlegen.
6. **`globals.css` ist auf das Dashboard getrimmt** (Orange-Akzent, `data-theme="dark"`).
   Die Milano-Token dürfen das nicht überschreiben → eigene Token im
   `(sites)/milano/layout.tsx` scopen (z. B. `.milano { --brand: … }`).

### 6.4 Datenmodell-Abbildung für Milano

| Modell | Milano-Inhalt |
|---|---|
| `Tenant` | name „Milano Friseur", slug `milano` |
| `Location` | Issumer Str. 3, 47608 Geldern · Telefon · `Europe/Berlin` · `openingHours` · `bufferMinutes: 0` · `serviceAreaPostcodes: []` |
| `Employee` | Ein Eintrag je Stuhl/Friseur mit `workingHours` |
| `Service` | Leistungen mit `durationMinutes`, `priceCents`, `category` |
| `FaqEntry` | 8–10 Fragen, `sortOrder` steuert zugleich die Vorschläge im Widget |
| `Absence` | Urlaub/Feiertage — für die Demo einen Beispiel-Urlaub setzen |
| `AdminUser` | Demo-Login für den Verkaufstermin |

### 6.5 Umgebungsvariablen (`.env`)

`DATABASE_URL`, `DIRECT_URL` (Neon), `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`,
`CRON_SECRET`, `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` + `EMAIL_FROM`,
`ANTHROPIC_API_KEY` + `ANTHROPIC_MODEL`, optional `NEXT_PUBLIC_DEMO_SLUG=milano`.

---

## 7. Beispiel-Leistungen (⚠️ PLATZHALTER — vom Inhaber bestätigen lassen)

Diese Liste ist eine **branchenübliche Annahme zum Befüllen der Demo**, keine Preise von
Milano. Auf der Demo-Seite als „Beispielpreise" kennzeichnen, bis die echte Liste vorliegt.

**Herren**

| Leistung | Dauer | Beispielpreis |
|---|---|---|
| Haarschnitt (Waschen, Schneiden, Styling) | 30 Min | 20 € |
| Maschinenschnitt / eine Länge | 20 Min | 15 € |
| Fade / Skin Fade | 40 Min | 25 € |
| Haarschnitt + Bart | 50 Min | 32 € |
| Kinderhaarschnitt (bis 12 J.) | 20 Min | 14 € |
| Kopfrasur | 20 Min | 15 € |

**Bart & Gesicht**

| Leistung | Dauer | Beispielpreis |
|---|---|---|
| Bart trimmen & in Form bringen | 15 Min | 12 € |
| Rasur mit dem Messer (heiße Tücher) | 30 Min | 20 € |
| Augenbrauen zupfen/fadeln | 10 Min | 8 € |

**Damen** (nur falls angeboten — offene Frage!)

| Leistung | Dauer | Beispielpreis |
|---|---|---|
| Waschen, Schneiden, Föhnen | 50 Min | 35 € |
| Ansatzfarbe | 90 Min | 55 € |
| Strähnen / Balayage | 150 Min | ab 95 € |
| Hochsteckfrisur | 60 Min | 50 € |
| Pflege-/Kur-Behandlung | 30 Min | 20 € |

**FAQ-Startset** (wird zu `FaqEntry`, erscheint zugleich als Chat-Vorschlag):
Öffnungszeiten · Muss ich einen Termin machen oder geht auch spontan? · Was kostet ein
Haarschnitt? · Kann ich mit Karte zahlen? · Wo kann ich parken? · Schneidet ihr auch Kinder? ·
Welche Sprachen sprecht ihr? · Wie sage ich einen Termin ab? · Macht ihr auch Bart? ·
Gibt es Gutscheine?

---

## 8. SEO & Auffindbarkeit

- **Title:** „Milano Friseur Geldern — Termin online buchen | Herren & Bart"
  **Description:** 4,9 ★ aus 33 Bewertungen · Issumer Str. 3 · online in 30 Sekunden buchen.
- **Keywords:** friseur geldern · barbershop geldern · herrenfriseur geldern · fade geldern ·
  bart trimmen geldern · friseur issumer straße · friseur in meiner nähe · türkischer friseur geldern
- **Strukturierte Daten** (JSON-LD über die Metadata-API von Next 16):
  `HairSalon` (Adresse, `geo`, `openingHoursSpecification`, `telephone`, `sameAs` → Instagram),
  `Service` je Leistung, `FAQPage`, `BreadcrumbList`.
  `aggregateRating` **nur** mit den echten Google-Zahlen und nur, wenn die Bewertungen auch
  auf der Seite stehen — sonst verstößt es gegen Googles Richtlinien.
- `sitemap.ts` + `robots.ts` anlegen (in der Demo-Phase auf `noindex`, siehe § 9.4).
- **Core Web Vitals-Ziele:** LCP < 2,0 s · CLS < 0,05 · INP < 200 ms.
  Mittel: `next/image`, keine Fremd-Skripte, Fonts self-hosted, Karte erst nach Klick.
- **Zusatzverkauf fürs Gespräch:** Google-Unternehmensprofil pflegen (Fotos, Beiträge,
  Leistungen, Bewertungen beantworten) — dort passiert bei einem lokalen Friseur mehr
  als auf der Website.

---

## 9. Recht & Datenschutz

### 9.1 Pflichtseiten
- **Impressum** nach § 5 DDG: Inhaber, Anschrift, Telefon, E-Mail, ggf. USt-IdNr.,
  Handwerkskammer + Berufsbezeichnung. → Daten fehlen uns noch (§ 1.2).
- **Datenschutzerklärung**: Buchungsdaten (Name, Telefon, E-Mail, Termin), Rechtsgrundlage
  Art. 6 (1) b DSGVO, Speicherdauer/Löschkonzept, Auftragsverarbeiter (Hosting, E-Mail-Versand,
  KI-Anbieter), Betroffenenrechte.

### 9.2 Technischer Datenschutz
- Fonts über `next/font` = self-hosted, **keine** Google-Fonts-CDN-Verbindung.
- **Google Maps erst nach aktivem Klick** laden (Zwei-Klick-Lösung), vorher statisches Bild.
- Instagram-Inhalte gecacht ausliefern, kein Fremd-Skript im Seitenkopf.
- Cookie-Banner nur, wenn wirklich nicht-essentielle Dienste geladen werden — mit unserem
  Aufbau brauchen wir idealerweise **keinen**; das ist ein Verkaufsargument.
- Kontakt-/Buchungsformular: TLS, Datensparsamkeit, Einwilligungstext, Honeypot statt Captcha.
- Bei echtem Betrieb: **AV-Vertrag** zwischen westfaliadigital und Milano; EU-Region für
  Hosting und Datenbank wählen.

### 9.3 Inhalte
- **Bewertungen:** ausschließlich die echten Google-Rezensionen verwenden, mit Quelle
  („Google-Rezension") und Datum. **Keine erfundenen Bewertungen** — das ist wettbewerbs-
  rechtlich abmahnfähig und in einer Demo schlicht nicht nötig.
- **Fotos:** nur lizenzierte oder eigene Bilder; keine Fotos anderer Salons.
  Platzhalter als solche kennzeichnen.
- **Preise:** in der Demo klar als „Beispielpreise" markieren, solange die echte Liste fehlt.

### 9.4 Kennzeichnung als Demo (wichtig)
Die Seite trägt einen echten Firmennamen, ist aber nicht vom Inhaber beauftragt. Deshalb:
- schmales Band oben: **„Demo-Entwurf von westfaliadigital · keine offizielle Seite von
  Milano Friseur"** (im Verkaufsgespräch ausblendbar)
- `robots: noindex, nofollow` + `robots.txt` disallow, bis der Kunde zusagt
- Buchungen im Demo-Tenant lösen **keine** Mails an den Salon aus — Empfänger auf unsere
  eigene Adresse setzen
- Vor dem Zeigen: unaufgefordert sagen, dass es ein unverbindlicher Entwurf ist. Das ist
  fair und verkauft besser als ein Überrumpelungsversuch.

---

## 10. Ablaufplan für morgen früh

| Block | Zeit | Inhalt |
|---|---|---|
| 0 | 15 Min | `npm install`, Datenbank (Neon oder lokal), `.env` füllen, `prisma migrate dev`, Next-16-Doku in `node_modules/next/dist/docs/` querlesen |
| 1 | 45 Min | Tenant `milano` anlegen (`npm run create-tenant`), `prisma/seed-milano.ts`: Standort, Öffnungszeiten, Leistungen, Team, FAQ; Notfall/Einzugsgebiet aus, `bufferMinutes: 0` |
| 2 | 60 Min | § 6.3 Punkte 1+2: Verfügbarkeit pro Mitarbeiter, 15-Min-Raster, Vorlauf konfigurierbar — **erst die Mechanik, dann die Optik** |
| 3 | 90 Min | Design-System + Shell: Token, Fonts, Header, Sticky-Mobile-Bar, Footer, `layout.tsx` |
| 4 | 120 Min | Startseiten-Sektionen 2–13 (§ 3), mobil zuerst |
| 5 | 75 Min | Inline-Buchungsstrecke + Mitarbeiterwahl + Bestätigungsansicht |
| 6 | 45 Min | Unterseiten: Leistungen, Team, Galerie, Kontakt, Impressum, Datenschutz |
| 7 | 45 Min | SEO: Metadata, JSON-LD, `sitemap.ts`, `robots.ts`, OG-Bild, `noindex`-Schalter |
| 8 | 30 Min | QA: Lighthouse, Tastaturtest, 360-px-Viewport, echte Testbuchung durchklicken |
| 9 | 15 Min | Vercel-Preview deployen, Link fürs Handy, Demo-Skript für das Gespräch |

**Regel für den Bau:** erst Datenmodell + Buchungsmechanik, dann Optik. Eine schöne Seite mit
kaputter Buchung verkauft nichts, eine schlichte Seite mit funktionierender Buchung schon.

---

## 11. Entscheidungen, die ich morgen früh von dir brauche

1. **Repo:** Demo im bestehenden Repo als `(sites)/milano` (meine Empfehlung — die Buchung
   ist schon da) oder als eigenständiges Projekt?
2. **Design:** „Milano Noir" (dunkel, Barbershop — meine Empfehlung) oder „Studio Bianco" (hell)?
3. **Zielgruppe:** reiner Herren-Barbershop oder auch Damenleistungen abbilden?
4. **Buchung:** echt funktionsfähig mit Datenbank + E-Mail (empfohlen, das ist der Wow-Moment)
   oder Klick-Attrappe ohne Backend?
5. **Sprachen:** de/en/tr reichen — oder Arabisch als sechste Sprache ergänzen (RTL, ca. 2 h)?
6. **Kür aus § 4.3:** Welche ein bis zwei Extras bauen wir? (Mein Tipp: Frisuren-Berater +
   Walk-in-Ampel — beides zeigt „KI" im wörtlichen Sinn.)
7. **Kundendaten:** Rufst du im Laden an, um Öffnungszeiten/Preise/Impressumsdaten zu holen,
   oder bauen wir bewusst mit gekennzeichneten Platzhaltern und fragen die Daten erst
   im Verkaufsgespräch ab?

---

## 12. Checkliste: Was wir vom Kunden brauchen (fürs Gespräch)

**Betrieb**
- [ ] Vollständige Öffnungszeiten inkl. Ruhetag und Pausen
- [ ] Offizielle Telefonnummer (welche der drei?) und E-Mail-Adresse
- [ ] Inhaber, Rechtsform, Anschrift, USt-IdNr., Handwerkskammer → Impressum
- [ ] Walk-in möglich oder nur Termin? Zahlungsarten? Parken?

**Leistungen**
- [ ] Preisliste mit Dauer je Leistung
- [ ] Herren / Damen / Kinder — was wird tatsächlich angeboten?
- [ ] Gutscheine? Kundenkarte? Aktionen (z. B. Rentner-Dienstag)?

**Team**
- [ ] Anzahl Stühle / gleichzeitig arbeitende Friseure
- [ ] Namen, Spezialgebiete, gesprochene Sprachen, Fotos
- [ ] Arbeitszeiten je Mitarbeiter (für die Terminvergabe)

**Material**
- [ ] Logo als Vektor (SVG/AI/PDF), sonst als große PNG
- [ ] 15–25 Fotos: Laden außen/innen, Stühle, Team, mindestens 10 Arbeiten
- [ ] Zugang oder Freigabe für Instagram-Inhalte
- [ ] Google-Unternehmensprofil: Zugriff/Inhaberschaft geklärt?
- [ ] Wunschdomain (z. B. `milano-friseur-geldern.de`) — verfügbar?

**Betrieb der Seite**
- [ ] Wer pflegt Preise/Zeiten künftig — er im Dashboard oder wir?
- [ ] E-Mail-Adresse, an die Terminbenachrichtigungen gehen sollen
- [ ] Wartungspaket / Laufzeit / Preis (unser Angebot)

---

## 13. Demo-Skript fürs Verkaufsgespräch (60 Sekunden)

1. Handy hinhalten: **„Das ist Ihr Laden bei Google — 4,9 Sterne. Und das hier wäre Ihre Seite."**
2. Scrollen bis zur Buchung: **„Suchen Sie sich einen Termin aus."** — Er tippt selbst.
3. Bestätigungsmail kommt auf sein Handy an. **Stille wirken lassen.**
4. **„Das läuft nachts um halb zwölf genauso. Sie schneiden, der Assistent nimmt an."**
5. Dashboard zeigen: **„Und hier sehen Sie jeden Termin — Preise ändern Sie selbst."**
6. Abschluss: **„Soll ich Ihnen das mit Ihren echten Preisen und Fotos fertig machen?"**

---

*Erstellt von westfaliadigital für den Bau am Folgetag. Alle mit ⚠️ markierten Angaben sind
Annahmen und müssen vor der Veröffentlichung durch echte Kundendaten ersetzt werden.*
