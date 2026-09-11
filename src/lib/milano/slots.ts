/**
 * Freie Zeiten für die Demoseite — echte Rechnung, keine Erfindung.
 *
 * Die Funktionen hier sind bewusst rein: Sie bekommen die vorhandenen
 * Buchungen übergeben und rechnen daraus, was noch frei ist. Damit läuft
 * dieselbe Logik in der API (mit dem lokalen Speicher) und später im
 * Terminassistenten (mit Prisma), ohne dass sich etwas ändert.
 *
 * Alle Zeiten sind Ortszeit des Salons. Datum immer "JJJJ-MM-TT",
 * Uhrzeit immer "HH:MM" — so gibt es keine Zeitzonen-Verschiebung
 * zwischen Server und Browser.
 */

import { oeffnungszeiten, type Wochentag } from "./content";

/** Abstand zwischen zwei angebotenen Startzeiten. */
export const RASTER_MINUTEN = 15;
/** So kurzfristig lässt sich nicht mehr buchen. */
export const VORLAUF_MINUTEN = 30;
/** So weit im Voraus zeigt die Seite Tage an. */
export const TAGE_VORAUS = 21;

const WOCHENTAG_KEYS: Wochentag[] = ["so", "mo", "di", "mi", "do", "fr", "sa"];

/** "09:30" → 570 */
export function minuten(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 570 → "09:30" */
export function alsUhrzeit(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/**
 * Wochentag eines Datums. Das Datum wird als UTC gelesen, damit die
 * Zeitzone des Rechners den Tag nicht um eins verschiebt.
 */
export function wochentagVon(datum: string): Wochentag {
  const d = new Date(`${datum}T12:00:00Z`);
  return WOCHENTAG_KEYS[d.getUTCDay()];
}

/** Heutiges Datum in Geldern als "JJJJ-MM-TT". */
export function heuteInGeldern(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Aktuelle Minute seit Mitternacht in Geldern. */
export function minuteInGeldern(now: Date = new Date()): number {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(teile.find((t) => t.type === "hour")?.value ?? "0");
  const m = Number(teile.find((t) => t.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

/** Datum um `tage` Tage weiter, wieder als "JJJJ-MM-TT". */
export function plusTage(datum: string, tage: number): string {
  const d = new Date(`${datum}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return d.toISOString().slice(0, 10);
}

/** Ein belegter Block auf einem Stuhl. */
export interface Belegung {
  mitarbeiterId: string;
  von: string;
  minuten: number;
}

export interface FreieZeit {
  /** Startzeit "HH:MM". */
  zeit: string;
  /** Stuhl, der diese Zeit bedienen würde. */
  mitarbeiterId: string;
}

interface FreieZeitenOptionen {
  datum: string;
  /** Dauer der gewünschten Leistung in Minuten. */
  dauer: number;
  /** Stuhl-ID oder "egal". */
  mitarbeiterId: string;
  /** Alle Stuhl-IDs des Salons. */
  stuehle: string[];
  /** Schon vergebene Blöcke an diesem Tag. */
  belegt: Belegung[];
  now?: Date;
}

/** Überschneiden sich zwei Blöcke? */
function kollidiert(startA: number, dauerA: number, startB: number, dauerB: number): boolean {
  return startA < startB + dauerB && startB < startA + dauerA;
}

/**
 * Freie Startzeiten eines Tages.
 *
 * Bei "egal" gilt eine Zeit als frei, sobald mindestens ein Stuhl sie
 * bedienen kann — zurückgegeben wird dann der erste freie Stuhl, damit die
 * Buchung ihn direkt festschreiben kann.
 */
export function freieZeiten(o: FreieZeitenOptionen): FreieZeit[] {
  const zeit = oeffnungszeiten[wochentagVon(o.datum)];
  if (!zeit) return [];

  const now = o.now ?? new Date();
  const frueheste =
    o.datum === heuteInGeldern(now) ? minuteInGeldern(now) + VORLAUF_MINUTEN : -1;

  const kandidaten = o.mitarbeiterId === "egal" ? o.stuehle : [o.mitarbeiterId];
  const oeffnet = minuten(zeit.von);
  const schliesst = minuten(zeit.bis);
  const ergebnis: FreieZeit[] = [];

  // Das Raster beginnt an der vollen Öffnungszeit, damit die angebotenen
  // Zeiten rund aussehen (09:00, 09:15 …) statt an einer Buchung zu kleben.
  for (let m = oeffnet; m + o.dauer <= schliesst; m += RASTER_MINUTEN) {
    if (m < frueheste) continue;

    const frei = kandidaten.find(
      (stuhl) =>
        !o.belegt.some(
          (b) => b.mitarbeiterId === stuhl && kollidiert(m, o.dauer, minuten(b.von), b.minuten),
        ),
    );

    if (frei) ergebnis.push({ zeit: alsUhrzeit(m), mitarbeiterId: frei });
  }

  return ergebnis;
}

/** Passt dieser Wunsch überhaupt in die Öffnungszeiten? */
export function innerhalbOeffnungszeit(datum: string, von: string, dauer: number): boolean {
  const zeit = oeffnungszeiten[wochentagVon(datum)];
  if (!zeit) return false;
  const start = minuten(von);
  return start >= minuten(zeit.von) && start + dauer <= minuten(zeit.bis);
}
