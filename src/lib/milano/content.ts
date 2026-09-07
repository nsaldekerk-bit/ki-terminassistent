/**
 * Alle Inhalte der Milano-Demoseite an einer Stelle.
 *
 * Die Seite läuft bewusst ohne Datenbank, damit sie sich mit `npm run dev`
 * vorführen lässt, ohne dass vorher Postgres stehen muss. Sobald der Kunde
 * zusagt, wandern genau diese Daten in den Mandanten `milano` und die Seite
 * liest sie über Prisma — die Struktur hier ist deshalb schon so geschnitten
 * wie die Tabellen im Terminassistenten.
 *
 * WICHTIG: Was wir vom Inhaber noch nicht wissen, ist als Platzhalter
 * markiert und wird auf der Seite in eckigen Klammern angezeigt. Nichts
 * davon darf wie eine gesicherte Angabe aussehen.
 */

/** Auf `true` stellen, sobald die echten Öffnungszeiten vorliegen. */
export const ZEITEN_BESTAETIGT = false;
/** Auf `true` stellen, sobald die echte Preisliste vorliegt. */
export const PREISE_BESTAETIGT = false;
/** Auf `true` stellen, sobald Namen und Fotos des Teams vorliegen. */
export const TEAM_BESTAETIGT = false;

export const salon = {
  name: "Milano Friseur",
  kurz: "MILANO",
  strasse: "Issumer Str. 3",
  plz: "47608",
  ort: "Geldern",
  telefon: "02831 9777887",
  telefonLink: "+4928319777887",
  instagram: "milano.friseur",
  instagramUrl: "https://www.instagram.com/milano.friseur/",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Issumer+Str.+3,+47608+Geldern",
  bewertung: "4,9",
  bewertungenAnzahl: 33,
} as const;

export type Wochentag = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";

export const wochentage: { key: Wochentag; lang: string; kurz: string }[] = [
  { key: "mo", lang: "Montag", kurz: "Mo" },
  { key: "di", lang: "Dienstag", kurz: "Di" },
  { key: "mi", lang: "Mittwoch", kurz: "Mi" },
  { key: "do", lang: "Donnerstag", kurz: "Do" },
  { key: "fr", lang: "Freitag", kurz: "Fr" },
  { key: "sa", lang: "Samstag", kurz: "Sa" },
  { key: "so", lang: "Sonntag", kurz: "So" },
];

/**
 * Öffnungszeiten. Gesichert ist nur „öffnet Mo um 09:00" aus dem
 * Google-Profil — alles andere sind Annahmen, die der Inhaber bestätigen
 * muss. Solange ZEITEN_BESTAETIGT false ist, zeigt die Seite sie in
 * eckigen Klammern.
 */
export const oeffnungszeiten: Record<Wochentag, { von: string; bis: string } | null> = {
  mo: { von: "09:00", bis: "18:30" },
  di: { von: "09:00", bis: "18:30" },
  mi: { von: "09:00", bis: "18:30" },
  do: { von: "09:00", bis: "18:30" },
  fr: { von: "09:00", bis: "19:00" },
  sa: { von: "08:00", bis: "18:00" },
  so: null,
};

export type Kategorie = "herren" | "bart" | "kinder";

export const kategorien: { key: Kategorie; name: string }[] = [
  { key: "herren", name: "Herren" },
  { key: "bart", name: "Bart & Gesicht" },
  { key: "kinder", name: "Kinder" },
];

export interface Leistung {
  id: string;
  name: string;
  beschreibung: string;
  minuten: number;
  preisCent: number;
  kategorie: Kategorie;
  /** Icon-Schlüssel, siehe components/milano/Icon.tsx */
  icon: "schere" | "fade" | "bart" | "messer" | "rasur" | "kind" | "brauen";
}

export const leistungen: Leistung[] = [
  {
    id: "haarschnitt",
    name: "Haarschnitt",
    beschreibung: "Waschen, schneiden, stylen. Der Klassiker, sauber ausgeführt.",
    minuten: 30,
    preisCent: 2000,
    kategorie: "herren",
    icon: "schere",
  },
  {
    id: "fade",
    name: "Fade / Skin Fade",
    beschreibung: "Sauberer Verlauf, harte Kante. Wofür die Bewertungen sprechen.",
    minuten: 40,
    preisCent: 2500,
    kategorie: "herren",
    icon: "fade",
  },
  {
    id: "schnitt-bart",
    name: "Schnitt + Bart",
    beschreibung: "Das komplette Programm in einem Termin.",
    minuten: 50,
    preisCent: 3200,
    kategorie: "herren",
    icon: "messer",
  },
  {
    id: "kopfrasur",
    name: "Kopfrasur",
    beschreibung: "Glatt bis zur Haut, mit Pflege danach.",
    minuten: 20,
    preisCent: 1500,
    kategorie: "herren",
    icon: "rasur",
  },
  {
    id: "bart-trimmen",
    name: "Bart trimmen",
    beschreibung: "Konturen, Form, Öl. Zwischendurch, wenn es schnell gehen muss.",
    minuten: 15,
    preisCent: 1200,
    kategorie: "bart",
    icon: "bart",
  },
  {
    id: "messerrasur",
    name: "Rasur mit dem Messer",
    beschreibung: "Heiße Tücher, klassische Klinge. Zwanzig Minuten Ruhe.",
    minuten: 30,
    preisCent: 2000,
    kategorie: "bart",
    icon: "messer",
  },
  {
    id: "augenbrauen",
    name: "Augenbrauen",
    beschreibung: "Zupfen oder fadeln, sauber in Form.",
    minuten: 10,
    preisCent: 800,
    kategorie: "bart",
    icon: "brauen",
  },
  {
    id: "kinderhaarschnitt",
    name: "Kinderhaarschnitt",
    beschreibung: "Bis 12 Jahre. Geduldig und ohne Stress — auch beim ersten Mal.",
    minuten: 20,
    preisCent: 1400,
    kategorie: "kinder",
    icon: "kind",
  },
];

export interface Mitarbeiter {
  id: string;
  name: string;
  schwerpunkt: string;
  sprachen: string;
}

/** Namen und Sprachen sind Platzhalter, bis der Inhaber sie nennt. */
export const team: Mitarbeiter[] = [
  { id: "stuhl-1", name: "Name 1", schwerpunkt: "Fades & Konturen", sprachen: "Sprachen" },
  { id: "stuhl-2", name: "Name 2", schwerpunkt: "Bart & Messerrasur", sprachen: "Sprachen" },
  { id: "stuhl-3", name: "Name 3", schwerpunkt: "Klassiker & Kinder", sprachen: "Sprachen" },
];

/**
 * Echte, öffentlich einsehbare Google-Rezensionen. Es werden ausschließlich
 * echte Bewertungen mit Quellenangabe gezeigt — erfundene wären
 * wettbewerbsrechtlich angreifbar und bei 4,9 Sternen ohnehin unnötig.
 */
export const bewertungen = [
  {
    text: "Der Friseursalon ist sehr freundlich und hat eine tolle Atmosphäre. Sie machen die besten Frisuren in Geldern!",
    autor: "Rezgar Pahlke",
    quelle: "Google-Rezension",
  },
  {
    text: "Beste Frisur in überall Geldern, sehr freundlich und Respektful. Ich empfehle das.",
    autor: "hiwad rahim",
    quelle: "Google-Rezension",
  },
  {
    text: "Beste Frisur in Geldern, ich bin sehr zufrieden.",
    autor: "Ako Ra",
    quelle: "Google-Rezension",
  },
] as const;

export const faq = [
  {
    frage: "Muss ich einen Termin machen oder geht auch spontan?",
    antwort:
      "Beides. Wer einen festen Platz will, bucht ihn hier in dreißig Sekunden. Spontan vorbeikommen geht weiterhin — dann kann es allerdings Wartezeit geben.",
  },
  {
    frage: "Was kostet ein Haarschnitt?",
    antwort:
      "Ein Herrenhaarschnitt liegt bei 20 €, ein Fade bei 25 €, Schnitt und Bart zusammen bei 32 €. Die vollständige Liste steht unter „Leistungen“.",
  },
  {
    frage: "Kann ich mit Karte zahlen?",
    antwort: "[Antwort vom Inhaber — Karte, bar oder beides?]",
  },
  {
    frage: "Wo kann ich parken?",
    antwort: "[Antwort vom Inhaber — Parkplätze in der Nähe der Issumer Straße?]",
  },
  {
    frage: "Schneidet ihr auch Kinder?",
    antwort:
      "Ja. Für Kinder bis zwölf Jahre gibt es einen eigenen Termin mit zwanzig Minuten — in Ruhe und ohne Hektik.",
  },
  {
    frage: "Wie sage ich einen Termin ab?",
    antwort:
      "Über den Link in der Bestätigungsmail. Damit verschiebst oder stornierst du selbst, ohne im Laden anzurufen.",
  },
];

/** Preis in Cent als „20 €“ bzw. „20,50 €“. */
export function preis(cent: number): string {
  const euro = cent / 100;
  return Number.isInteger(euro)
    ? `${euro} €`
    : `${euro.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;
}
