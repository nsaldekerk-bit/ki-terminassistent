/**
 * Der Assistent der Demoseite.
 *
 * Er antwortet wirklich — aber aus den eigenen Daten des Salons, nicht aus
 * einem Sprachmodell. Das hat für die Vorführung zwei Vorteile: Er
 * funktioniert ohne Internet und ohne Schlüssel, und er kann nichts
 * erfinden. Wo der Inhaber uns die Antwort noch nicht gegeben hat, sagt er
 * genau das und verweist ans Telefon.
 *
 * Im Ausbau tritt an diese Stelle das Widget aus /embed/<mandant>, das
 * dieselben Daten an Claude gibt und frei formuliert antwortet.
 */

import {
  PREISE_BESTAETIGT,
  TEAM_BESTAETIGT,
  ZEITEN_BESTAETIGT,
  faq,
  leistungen,
  oeffnungszeiten,
  preis,
  salon,
  team,
  wochentage,
  type Wochentag,
} from "./content";
import { status } from "./hours";

export interface AssistentAntwort {
  text: string;
  /** Weiterführende Fragen, die der Besucher antippen kann. */
  vorschlaege: string[];
  /** Ein Knopf unter der Antwort, wenn etwas zu tun ist. */
  link?: { text: string; href: string };
}

const STANDARD_VORSCHLAEGE = ["Termin buchen", "Wann habt ihr offen?", "Was kostet ein Fade?"];

/** Kleinschreibung ohne Umlaute und Satzzeichen — damit "Öffnungszeiten?" trifft. */
function normalisieren(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function zeitenZeile(key: Wochentag): string {
  const tag = wochentage.find((w) => w.key === key);
  const zeit = oeffnungszeiten[key];
  const wert = zeit ? `${zeit.von} – ${zeit.bis}` : "geschlossen";
  return `${tag?.lang}: ${ZEITEN_BESTAETIGT || !zeit ? wert : `[${wert}]`}`;
}

function alleZeiten(): string {
  return wochentage.map((w) => zeitenZeile(w.key)).join("\n");
}

const ZEITEN_HINWEIS = ZEITEN_BESTAETIGT
  ? ""
  : "\n\nDie Zeiten in Klammern bestätigt der Inhaber noch.";

const PREIS_HINWEIS = PREISE_BESTAETIGT ? "" : " (Beispielpreise, noch nicht bestätigt)";

/** Die Leistung, nach der gefragt wurde — oder nichts. */
function erkannteLeistung(frage: string) {
  const treffer: { id: string; laenge: number }[] = [];
  const stichworte: Record<string, string[]> = {
    fade: ["fade", "skin fade", "verlauf", "ubergang"],
    haarschnitt: ["haarschnitt", "haare schneiden", "schneiden", "klassiker", "herrenschnitt"],
    "schnitt-bart": ["schnitt und bart", "schnitt bart", "komplett", "alles zusammen"],
    kopfrasur: ["kopfrasur", "glatze", "kahl", "glatt rasieren"],
    "bart-trimmen": ["bart trimmen", "bart", "konturen", "barttrimmen"],
    messerrasur: ["messerrasur", "messer", "rasur", "rasieren", "klinge"],
    augenbrauen: ["augenbrauen", "brauen", "fadeln", "zupfen"],
    kinderhaarschnitt: ["kind", "kinder", "sohn", "junge", "kleiner"],
  };

  for (const [id, worte] of Object.entries(stichworte)) {
    for (const wort of worte) {
      if (frage.includes(wort)) treffer.push({ id, laenge: wort.length });
    }
  }
  if (treffer.length === 0) return null;

  // Das längste Stichwort gewinnt: "schnitt bart" schlägt "bart".
  treffer.sort((a, b) => b.laenge - a.laenge);
  return leistungen.find((l) => l.id === treffer[0].id) ?? null;
}

/** Der Wochentag, nach dem gefragt wurde — oder nichts. */
function erkannterTag(frage: string): Wochentag | null {
  const namen: Record<string, Wochentag> = {
    montag: "mo",
    dienstag: "di",
    mittwoch: "mi",
    donnerstag: "do",
    freitag: "fr",
    samstag: "sa",
    sonnabend: "sa",
    sonntag: "so",
  };
  for (const [wort, key] of Object.entries(namen)) {
    if (frage.includes(wort)) return key;
  }
  return null;
}

interface Thema {
  name: string;
  worte: string[];
  antwort: (frage: string, now: Date) => AssistentAntwort;
}

const THEMEN: Thema[] = [
  {
    name: "buchen",
    worte: ["termin", "buchen", "buchung", "reservieren", "platz", "anmelden", "slot"],
    antwort: () => ({
      text: "Am schnellsten geht es hier direkt: Leistung wählen, Tag und Uhrzeit aussuchen, Name und Telefonnummer eintragen. Das dauert keine Minute, und du bekommst die Bestätigung sofort.",
      vorschlaege: ["Was kostet ein Fade?", "Wann habt ihr offen?", "Wie sage ich ab?"],
      link: { text: "Freie Zeiten ansehen", href: "/milano/termin" },
    }),
  },
  {
    name: "oeffnungszeiten",
    worte: [
      "offen", "geoffnet", "auf", "zu", "offnungszeiten", "offnungszeit", "zeiten",
      "wann", "feierabend", "ruhetag", "geschlossen", "macht ihr auf", "aufmachen",
      "macht ihr zu", "zumachen",
    ],
    antwort: (frage, now) => {
      const tag = erkannterTag(frage);
      if (tag) {
        const zeit = oeffnungszeiten[tag];
        const name = wochentage.find((w) => w.key === tag)?.lang;
        return {
          text: zeit
            ? `${name} haben wir von ${ZEITEN_BESTAETIGT ? zeit.von : `[${zeit.von}]`} bis ${ZEITEN_BESTAETIGT ? zeit.bis : `[${zeit.bis}]`} geöffnet.${ZEITEN_HINWEIS}`
            : `${name} ist Ruhetag — da bleibt der Laden zu.`,
          vorschlaege: ["Termin buchen", "Alle Öffnungszeiten", "Wo finde ich euch?"],
          link: zeit ? { text: "Termin an dem Tag", href: "/milano/termin" } : undefined,
        };
      }
      const jetzt = status(now);
      return {
        text: `${jetzt.offen ? `Gerade geöffnet — ${jetzt.detail}.` : `Gerade geschlossen — ${jetzt.detail}.`}\n\n${alleZeiten()}${ZEITEN_HINWEIS}`,
        vorschlaege: ["Termin buchen", "Was kostet ein Haarschnitt?", "Wo finde ich euch?"],
        link: { text: "Termin buchen", href: "/milano/termin" },
      };
    },
  },
  {
    name: "preise",
    worte: ["preis", "preise", "kostet", "kosten", "teuer", "euro", "geld", "preisliste"],
    antwort: (frage) => {
      const l = erkannteLeistung(frage);
      if (l) {
        return {
          text: `${l.name} kostet ${preis(l.preisCent)} und dauert ${l.minuten} Minuten.${PREIS_HINWEIS}\n\n${l.beschreibung}`,
          vorschlaege: ["Termin buchen", "Alle Preise", "Wie lange dauert das?"],
          link: { text: `${l.name} buchen`, href: `/milano/termin?leistung=${l.id}` },
        };
      }
      return {
        text: `Die häufigsten:\n\n${leistungen
          .slice(0, 5)
          .map((s) => `${s.name}: ${preis(s.preisCent)}`)
          .join("\n")}${PREIS_HINWEIS}`,
        vorschlaege: ["Alle Leistungen", "Termin buchen", "Was kostet ein Fade?"],
        link: { text: "Ganze Preisliste", href: "/milano/leistungen" },
      };
    },
  },
  {
    name: "leistungen",
    worte: ["leistung", "leistungen", "angebot", "macht ihr", "konnt ihr", "bietet"],
    antwort: (frage) => {
      const l = erkannteLeistung(frage);
      if (l) {
        return {
          text: `Ja. ${l.name}: ${l.beschreibung} ${l.minuten} Minuten, ${preis(l.preisCent)}.${PREIS_HINWEIS}`,
          vorschlaege: ["Termin buchen", "Alle Preise", "Wann habt ihr offen?"],
          link: { text: `${l.name} buchen`, href: `/milano/termin?leistung=${l.id}` },
        };
      }
      return {
        text: `Schnitt, Fade, Bart, Messerrasur, Kopfrasur, Augenbrauen und Kinderhaarschnitt — ${leistungen.length} Leistungen insgesamt.`,
        vorschlaege: ["Was kostet ein Fade?", "Schneidet ihr Kinder?", "Termin buchen"],
        link: { text: "Alle Leistungen ansehen", href: "/milano/leistungen" },
      };
    },
  },
  {
    name: "dauer",
    worte: ["wie lange", "dauert", "dauer", "minuten", "schnell"],
    antwort: (frage) => {
      const l = erkannteLeistung(frage);
      if (l) {
        return {
          text: `Für ${l.name} planen wir ${l.minuten} Minuten ein.`,
          vorschlaege: ["Termin buchen", "Was kostet das?", "Wann habt ihr offen?"],
          link: { text: `${l.name} buchen`, href: `/milano/termin?leistung=${l.id}` },
        };
      }
      return {
        text: "Je nach Leistung zwischen 10 und 50 Minuten: Augenbrauen 10, Bart trimmen 15, Haarschnitt 30, Fade 40, Schnitt mit Bart 50.",
        vorschlaege: ["Termin buchen", "Alle Preise", "Was kostet ein Fade?"],
        link: { text: "Termin buchen", href: "/milano/termin" },
      };
    },
  },
  {
    name: "anfahrt",
    worte: ["wo", "adresse", "anfahrt", "finden", "finde", "strasse", "liegt", "weg", "maps"],
    antwort: () => ({
      text: `${salon.strasse}, ${salon.plz} ${salon.ort} — mitten in Geldern.`,
      vorschlaege: ["Wann habt ihr offen?", "Termin buchen", "Wo kann ich parken?"],
      link: { text: "Route bei Google Maps", href: salon.mapsUrl },
    }),
  },
  {
    name: "parken",
    worte: ["parken", "parkplatz", "parkplatze", "auto", "stellplatz"],
    antwort: () => ({
      text: `Das müssen wir dir ehrlich schuldig bleiben — die Parkfrage hat uns der Inhaber noch nicht beantwortet. Ruf kurz an, dann weißt du es sicher: ${salon.telefon}.`,
      vorschlaege: ["Wo finde ich euch?", "Termin buchen", "Wann habt ihr offen?"],
      link: { text: "Anrufen", href: `tel:${salon.telefonLink}` },
    }),
  },
  {
    name: "zahlen",
    worte: ["karte", "bar", "zahlen", "bezahlen", "ec", "paypal", "kreditkarte", "girocard"],
    antwort: () => ({
      text: `Ob Kartenzahlung geht, hat uns der Inhaber noch nicht bestätigt — deshalb steht hier lieber nichts Falsches. Kurz anrufen klärt es: ${salon.telefon}.`,
      vorschlaege: ["Termin buchen", "Was kostet ein Haarschnitt?", "Wo finde ich euch?"],
      link: { text: "Anrufen", href: `tel:${salon.telefonLink}` },
    }),
  },
  {
    name: "spontan",
    worte: ["spontan", "ohne termin", "warten", "wartezeit", "vorbeikommen", "reinkommen", "schlange"],
    antwort: () => ({
      text: "Beides geht. Ohne Termin vorbeikommen kannst du weiterhin — dann kann es aber Wartezeit geben. Wer einen festen Platz will, bucht ihn hier in dreißig Sekunden.",
      vorschlaege: ["Termin buchen", "Wann habt ihr offen?", "Wie sage ich ab?"],
      link: { text: "Platz sichern", href: "/milano/termin" },
    }),
  },
  {
    name: "absagen",
    worte: [
      "absagen", "absage", "abgesagt", "abzusagen", "abmelden", "termin ab",
      "stornieren", "storno", "verschieben", "umbuchen", "kann nicht",
    ],
    antwort: () => ({
      text: "Über den Link in deiner Bestätigung — damit sagst du selbst ab, rund um die Uhr und ohne anzurufen. Sag möglichst zwei Stunden vorher Bescheid, dann bekommt jemand anderes den Platz.",
      vorschlaege: ["Termin buchen", "Wann habt ihr offen?", "Wo finde ich euch?"],
    }),
  },
  {
    name: "kinder",
    worte: ["kind", "kinder", "sohn", "junge", "baby", "erster haarschnitt"],
    antwort: () => {
      const l = leistungen.find((s) => s.id === "kinderhaarschnitt");
      return {
        text: `Ja, gern. Für Kinder bis zwölf Jahre nehmen wir uns ${l?.minuten ?? 20} Minuten Zeit — in Ruhe und ohne Hektik, auch beim allerersten Mal. ${l ? preis(l.preisCent) : ""}${PREIS_HINWEIS}`,
        vorschlaege: ["Termin buchen", "Wann habt ihr offen?", "Alle Preise"],
        link: { text: "Kindertermin buchen", href: "/milano/termin?leistung=kinderhaarschnitt" },
      };
    },
  },
  {
    name: "team",
    worte: ["wer", "team", "mitarbeiter", "friseur", "barbier", "personal", "chef", "inhaber"],
    antwort: () => ({
      text: TEAM_BESTAETIGT
        ? `Bei uns schneiden ${team.map((m) => m.name).join(", ")}. Bei der Buchung kannst du wählen — oder „egal“ nehmen, dann bekommst du den nächsten freien Platz.`
        : "Die Namen des Teams tragen wir noch ein, sobald der Inhaber sie uns gegeben hat. Bei der Buchung kannst du trotzdem schon einen Stuhl wählen — oder „egal“ nehmen, dann bekommst du den nächsten freien Platz.",
      vorschlaege: ["Termin buchen", "Was kostet ein Fade?", "Wann habt ihr offen?"],
      link: { text: "Termin buchen", href: "/milano/termin" },
    }),
  },
  {
    name: "sprachen",
    worte: ["sprache", "sprechen", "turkisch", "arabisch", "englisch", "deutsch", "kurdisch"],
    antwort: () => ({
      text: `Welche Sprachen im Laden gesprochen werden, trägt der Inhaber noch nach. Am Telefon klärt sich das sofort: ${salon.telefon}.`,
      vorschlaege: ["Termin buchen", "Wo finde ich euch?", "Wann habt ihr offen?"],
      link: { text: "Anrufen", href: `tel:${salon.telefonLink}` },
    }),
  },
  {
    name: "bewertungen",
    worte: ["bewertung", "bewertungen", "google", "rezension", "sterne", "erfahrung", "gut"],
    antwort: () => ({
      text: `${salon.bewertung} von 5 Sternen bei ${salon.bewertungenAnzahl} Google-Bewertungen. Am häufigsten genannt: die Fades und dass man freundlich behandelt wird.`,
      vorschlaege: ["Termin buchen", "Was kostet ein Fade?", "Wo finde ich euch?"],
      link: { text: "Termin buchen", href: "/milano/termin" },
    }),
  },
  {
    name: "instagram",
    worte: ["instagram", "insta", "fotos", "bilder", "galerie", "arbeiten"],
    antwort: () => ({
      text: `Aktuelle Schnitte zeigt der Laden auf Instagram unter @${salon.instagram}.`,
      vorschlaege: ["Termin buchen", "Was kostet ein Fade?", "Wann habt ihr offen?"],
      link: { text: `@${salon.instagram} ansehen`, href: salon.instagramUrl },
    }),
  },
  {
    name: "telefon",
    worte: ["telefon", "nummer", "anrufen", "erreichen", "kontakt", "handy"],
    antwort: () => ({
      text: `Der Laden ist unter ${salon.telefon} erreichbar. Wenn gerade geschnitten wird, dauert es manchmal — buchen geht hier ohne Warten.`,
      vorschlaege: ["Termin buchen", "Wann habt ihr offen?", "Wo finde ich euch?"],
      link: { text: "Anrufen", href: `tel:${salon.telefonLink}` },
    }),
  },
  {
    name: "gruss",
    worte: ["hallo", "hi", "hey", "moin", "guten tag", "servus", "danke", "tschuss"],
    antwort: () => ({
      text: "Hallo! Frag mich nach Preisen, Öffnungszeiten oder freien Terminen — oder buch direkt.",
      vorschlaege: STANDARD_VORSCHLAEGE,
      link: { text: "Termin buchen", href: "/milano/termin" },
    }),
  },
];

/**
 * Die Antwort auf eine Frage.
 *
 * Es gewinnt das Thema, dessen Stichwörter am meisten Text abdecken. Die
 * Länge zählt, nicht die Anzahl: „ohne termin" schlägt damit „termin", und
 * „parken" schlägt das „wo" der Anfahrt. Bei Gleichstand gewinnt das Thema,
 * das weiter oben steht.
 */
export function antwortAuf(frage: string, now: Date = new Date()): AssistentAntwort {
  const text = normalisieren(frage);

  if (text.length === 0) {
    return {
      text: "Frag einfach los — Preise, Öffnungszeiten, freie Termine.",
      vorschlaege: STANDARD_VORSCHLAEGE,
    };
  }

  const woerter = new Set(text.split(" "));

  let bestes: Thema | null = null;
  let bestePunkte = 0;
  for (const thema of THEMEN) {
    const punkte = thema.worte.reduce((summe, wort) => {
      // Einzelne Wörter nur als ganzes Wort: sonst träfe "zu" auch in
      // "zufrieden" und "wo" in "Wochen".
      const trifft = wort.includes(" ") ? text.includes(wort) : woerter.has(wort);
      return trifft ? summe + wort.length : summe;
    }, 0);
    if (punkte > bestePunkte) {
      bestePunkte = punkte;
      bestes = thema;
    }
  }

  if (bestes) return bestes.antwort(text, now);

  // Kein Thema getroffen, aber vielleicht eine Leistung genannt.
  const l = erkannteLeistung(text);
  if (l) {
    return {
      text: `${l.name}: ${l.beschreibung} ${l.minuten} Minuten, ${preis(l.preisCent)}.${PREIS_HINWEIS}`,
      vorschlaege: ["Termin buchen", "Alle Preise", "Wann habt ihr offen?"],
      link: { text: `${l.name} buchen`, href: `/milano/termin?leistung=${l.id}` },
    };
  }

  // Vielleicht steht es in den FAQ.
  const treffer = faq.find((f) => {
    const worte = normalisieren(f.frage).split(" ").filter((w) => w.length > 4);
    return worte.some((w) => text.includes(w));
  });
  if (treffer && !treffer.antwort.startsWith("[")) {
    return {
      text: treffer.antwort,
      vorschlaege: STANDARD_VORSCHLAEGE,
      link: { text: "Termin buchen", href: "/milano/termin" },
    };
  }

  return {
    text: `Das kann ich dir gerade nicht beantworten — ich kenne Preise, Öffnungszeiten, Leistungen und freie Termine. Alles andere weiß der Laden selbst am besten: ${salon.telefon}.`,
    vorschlaege: STANDARD_VORSCHLAEGE,
    link: { text: "Anrufen", href: `tel:${salon.telefonLink}` },
  };
}
