/**
 * Lokaler Speicher der Demoseite.
 *
 * Die Seite soll sich mit `npm run dev` vorführen lassen, ohne dass vorher
 * Postgres steht. Gebuchte Termine landen deshalb in einer JSON-Datei
 * unter `.milano-demo/` im Projektordner — echt genug, dass eine Buchung
 * den Platz wirklich belegt und nach einem Neustart noch da ist, und
 * einfach genug, dass nichts einzurichten ist.
 *
 * Die Schnittstelle ist absichtlich so geschnitten wie die spätere
 * Prisma-Variante: Wer auf den Terminassistenten umstellt, tauscht dieses
 * Modul aus und lässt alles darüber unberührt.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { team } from "./content";
import * as mails from "./mails";
import { alsUhrzeit, heuteInGeldern, minuteInGeldern, plusTage } from "./slots";

const ORDNER = join(process.cwd(), ".milano-demo");
const DATEI = join(ORDNER, "daten.json");

/** Uhrzeit, zu der am Vortag erinnert wird. */
const ERINNERUNG_UM = "18:00";

export type TerminStatus = "gebucht" | "abgesagt";

export interface Termin {
  /** Buchungsnummer, zugleich Schlüssel des Absage-Links. */
  code: string;
  leistungId: string;
  /** Immer ein echter Stuhl — "egal" wird beim Buchen aufgelöst. */
  mitarbeiterId: string;
  /** "JJJJ-MM-TT" in Ortszeit. */
  datum: string;
  /** "HH:MM" in Ortszeit. */
  von: string;
  minuten: number;
  name: string;
  telefon: string;
  email: string;
  notiz: string;
  status: TerminStatus;
  /** Sortierbarer Ortszeit-Stempel "JJJJ-MM-TT HH:MM". */
  gebuchtAm: string;
  abgesagtAm: string | null;
  /** Wer abgesagt hat — der Gast über den Link oder der Salon. */
  abgesagtVon: "gast" | "salon" | null;
}

export type NachrichtArt =
  | "bestaetigung"
  | "salon-info"
  | "erinnerung"
  | "absage"
  | "anfrage";

export interface Nachricht {
  id: string;
  art: NachrichtArt;
  /** Empfänger: E-Mail des Gastes oder "Salon". */
  an: string;
  betreff: string;
  text: string;
  /** Ortszeit-Stempel, ab wann sie rausgeht. */
  faelligAm: string;
  /** Ortszeit-Stempel des Versands, solange null: steht noch aus. */
  verschicktAm: string | null;
  terminCode: string;
}

interface Daten {
  termine: Termin[];
  postausgang: Nachricht[];
}

/*
 * Jedes Mal ein frischer Satz Listen — bewusst eine Funktion und keine
 * Konstante. Eine geteilte Konstante mit `{ ...LEER }` zu kopieren wäre
 * flach: Beide Listen blieben dieselben Objekte, und das erste `push` nach
 * einer fehlenden Datei würde sie dauerhaft füllen. Danach hätte jeder
 * weitere Lesefehler Geistertermine geliefert und `zuruecksetzen()` sie
 * wieder zurückgeschrieben.
 */
function leer(): Daten {
  return { termine: [], postausgang: [] };
}

/** Sortierbarer Ortszeit-Stempel "JJJJ-MM-TT HH:MM". */
export function stempel(now: Date = new Date()): string {
  return `${heuteInGeldern(now)} ${alsUhrzeit(minuteInGeldern(now))}`;
}

/*
 * Schreibzugriffe hintereinander schalten. Der Dev-Server bedient mehrere
 * Anfragen gleichzeitig; ohne Reihenfolge könnten zwei Buchungen dieselbe
 * Datei lesen und die jeweils andere überschreiben.
 */
let kette: Promise<unknown> = Promise.resolve();

function nacheinander<T>(arbeit: () => Promise<T>): Promise<T> {
  const naechste = kette.then(arbeit, arbeit);
  kette = naechste.catch(() => undefined);
  return naechste;
}

async function lesen(): Promise<Daten> {
  try {
    const roh = await readFile(DATEI, "utf8");
    const daten = JSON.parse(roh) as Partial<Daten>;
    return {
      termine: Array.isArray(daten.termine) ? daten.termine : [],
      postausgang: Array.isArray(daten.postausgang) ? daten.postausgang : [],
    };
  } catch {
    // Noch nie gebucht, oder die Datei ist kaputt — dann fängt die Demo
    // eben leer an. Ein Absturz wäre hier die schlechtere Antwort.
    return leer();
  }
}

async function schreiben(daten: Daten): Promise<void> {
  await mkdir(ORDNER, { recursive: true });
  // Erst daneben schreiben, dann umbenennen: Ein Abbruch mittendrin lässt
  // dann die alte Datei heil statt eine halbe zurück.
  const temp = `${DATEI}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(daten, null, 2), "utf8");
  await rename(temp, DATEI);
}

/** Buchungsnummer ohne Zeichen, die man am Telefon verwechselt. */
function neuerCode(vergeben: Set<string>): string {
  const zeichen = "ACDEFHJKLMNPRTUVWXY3456789";
  for (let versuch = 0; versuch < 50; versuch++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += zeichen[Math.floor(Math.random() * zeichen.length)];
    }
    if (!vergeben.has(code)) return code;
  }
  return randomUUID().slice(0, 6).toUpperCase();
}

export async function alleTermine(): Promise<Termin[]> {
  const daten = await lesen();
  return daten.termine;
}

/** Nur die Buchungen, die einen Platz belegen. */
export async function aktiveTermine(datum?: string): Promise<Termin[]> {
  const termine = await alleTermine();
  return termine.filter(
    (t) => t.status === "gebucht" && (datum === undefined || t.datum === datum),
  );
}

export async function terminPerCode(code: string): Promise<Termin | null> {
  const termine = await alleTermine();
  return termine.find((t) => t.code === code.toUpperCase()) ?? null;
}

export async function postausgang(): Promise<Nachricht[]> {
  const daten = await lesen();
  return daten.postausgang;
}

export interface Buchungswunsch {
  leistungId: string;
  mitarbeiterId: string;
  datum: string;
  von: string;
  minuten: number;
  name: string;
  telefon: string;
  email: string;
  notiz: string;
  /** Basis für den Absage-Link, z. B. "http://localhost:3000". */
  basis: string;
}

export type BuchungsErgebnis =
  | { ok: true; termin: Termin }
  | { ok: false; grund: "belegt" | "fehler" };

/**
 * Termin anlegen. Der Stuhl ist hier schon aufgelöst; die Prüfung auf
 * Überschneidung passiert trotzdem noch einmal beim Schreiben — zwischen
 * dem Anzeigen der freien Zeiten und dem Klick kann jemand anderes gebucht
 * haben.
 */
export function terminAnlegen(wunsch: Buchungswunsch): Promise<BuchungsErgebnis> {
  return nacheinander(async () => {
    const daten = await lesen();
    const jetzt = stempel();

    const start = zeitAlsMinuten(wunsch.von);
    const kollision = daten.termine.some(
      (t) =>
        t.status === "gebucht" &&
        t.datum === wunsch.datum &&
        t.mitarbeiterId === wunsch.mitarbeiterId &&
        start < zeitAlsMinuten(t.von) + t.minuten &&
        zeitAlsMinuten(t.von) < start + wunsch.minuten,
    );
    if (kollision) return { ok: false, grund: "belegt" };

    const termin: Termin = {
      code: neuerCode(new Set(daten.termine.map((t) => t.code))),
      leistungId: wunsch.leistungId,
      mitarbeiterId: wunsch.mitarbeiterId,
      datum: wunsch.datum,
      von: wunsch.von,
      minuten: wunsch.minuten,
      name: wunsch.name,
      telefon: wunsch.telefon,
      email: wunsch.email,
      notiz: wunsch.notiz,
      status: "gebucht",
      gebuchtAm: jetzt,
      abgesagtAm: null,
      abgesagtVon: null,
    };

    const bestaetigung = mails.bestaetigung(termin, wunsch.basis);
    const info = mails.salonInfo(termin);
    const erinnerung = mails.erinnerung(termin, wunsch.basis);

    // Die Erinnerung geht am Vortag um 18:00 raus. Wer kurzfristig bucht,
    // bekommt keine mehr — sie wäre dann nach dem Termin fällig.
    const erinnerungFaellig = `${plusTage(termin.datum, -1)} ${ERINNERUNG_UM}`;
    const erinnerungSinnvoll = erinnerungFaellig > jetzt;

    // Der Salon erfährt von jeder Buchung. Zum Gast geht nur etwas raus,
    // wenn er eine Adresse hinterlassen hat — wer ohne bucht, hat den
    // Termin am Telefon oder auf dem Bildschirm und will keine Post.
    daten.postausgang.push(nachricht("salon-info", "Salon", info, jetzt, termin.code));
    if (termin.email) {
      daten.postausgang.push(
        nachricht("bestaetigung", termin.email, bestaetigung, jetzt, termin.code),
      );
      if (erinnerungSinnvoll) {
        daten.postausgang.push(
          nachricht("erinnerung", termin.email, erinnerung, erinnerungFaellig, termin.code),
        );
      }
    }

    daten.termine.push(termin);
    await schreiben(daten);
    return { ok: true, termin };
  });
}

export type AbsageErgebnis =
  | { ok: true; termin: Termin }
  | { ok: false; grund: "unbekannt" | "schon-abgesagt" | "vorbei" };

/** Termin absagen — über den Link des Gastes oder aus der Salonansicht. */
export function terminAbsagen(
  code: string,
  wer: "gast" | "salon",
): Promise<AbsageErgebnis> {
  return nacheinander(async () => {
    const daten = await lesen();
    const termin = daten.termine.find((t) => t.code === code.toUpperCase());
    if (!termin) return { ok: false, grund: "unbekannt" };
    if (termin.status === "abgesagt") return { ok: false, grund: "schon-abgesagt" };

    const jetzt = stempel();
    if (`${termin.datum} ${termin.von}` < jetzt) return { ok: false, grund: "vorbei" };

    termin.status = "abgesagt";
    termin.abgesagtAm = jetzt;
    termin.abgesagtVon = wer;

    // Eine Erinnerung zu einem abgesagten Termin darf nicht mehr rausgehen.
    daten.postausgang = daten.postausgang.filter(
      (n) => !(n.terminCode === termin.code && n.art === "erinnerung" && n.verschicktAm === null),
    );

    daten.postausgang.push(
      nachricht("absage", "Salon", mails.absageAnSalon(termin), jetzt, termin.code),
    );
    if (termin.email) {
      daten.postausgang.push(
        nachricht("absage", termin.email, mails.absageAnGast(termin), jetzt, termin.code),
      );
    }

    await schreiben(daten);
    return { ok: true, termin };
  });
}

/**
 * Alles verschicken, was fällig ist. In der Demo heißt „verschicken":
 * im Postausgang als raus markieren. Der Aufruf steckt in der Salonansicht
 * hinter einem Knopf, damit sich die Erinnerung vorführen lässt, ohne bis
 * zum Vorabend zu warten.
 */
export function faelligeVerschicken(): Promise<Nachricht[]> {
  return nacheinander(async () => {
    const daten = await lesen();
    const jetzt = stempel();
    const raus = daten.postausgang.filter((n) => n.verschicktAm === null && n.faelligAm <= jetzt);
    if (raus.length === 0) return [];
    for (const n of raus) n.verschicktAm = jetzt;
    await schreiben(daten);
    return raus;
  });
}

export interface Anfrage {
  name: string;
  email: string;
  telefon: string;
  text: string;
}

/**
 * Nachricht aus dem Kontaktformular. Sie landet im selben Postausgang wie
 * die Buchungsmails — der Inhaber hat damit alles an einer Stelle.
 */
export function anfrageAnlegen(anfrage: Anfrage): Promise<Nachricht> {
  return nacheinander(async () => {
    const daten = await lesen();
    const jetzt = stempel();

    const eintrag: Nachricht = {
      id: randomUUID(),
      art: "anfrage",
      an: "Salon",
      betreff: `Nachricht über die Webseite: ${anfrage.name}`,
      text: [
        `${anfrage.name} hat über das Kontaktformular geschrieben.`,
        ``,
        `  Telefon: ${anfrage.telefon || "—"}`,
        `  E-Mail:  ${anfrage.email || "—"}`,
        ``,
        anfrage.text,
      ].join("\n"),
      faelligAm: jetzt,
      verschicktAm: null,
      terminCode: "",
    };

    daten.postausgang.push(eintrag);
    await schreiben(daten);
    return eintrag;
  });
}

/** Alles löschen — für den sauberen Stand vor einem Kundentermin. */
export function zuruecksetzen(): Promise<void> {
  return nacheinander(async () => {
    await schreiben(leer());
  });
}

function nachricht(
  art: NachrichtArt,
  an: string,
  inhalt: mails.MailText,
  faelligAm: string,
  terminCode: string,
): Nachricht {
  return {
    id: randomUUID(),
    art,
    an,
    betreff: inhalt.betreff,
    text: inhalt.text,
    faelligAm,
    verschicktAm: null,
    terminCode,
  };
}

function zeitAlsMinuten(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Alle Stuhl-IDs des Salons. */
export function stuehle(): string[] {
  return team.map((m) => m.id);
}
