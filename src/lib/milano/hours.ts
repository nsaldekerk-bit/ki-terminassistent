import { oeffnungszeiten, wochentage, type Wochentag } from "./content";

const REIHENFOLGE: Wochentag[] = ["so", "mo", "di", "mi", "do", "fr", "sa"];

/** Minuten seit Mitternacht aus "09:00". */
function minuten(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Aktuelle Uhrzeit in der Zeitzone des Salons, unabhängig davon, wo der
 * Besucher sitzt. Gibt Wochentag-Index (0 = Sonntag) und Minuten zurück.
 */
function jetztInGeldern(now: Date): { tag: number; minute: number } {
  const teile = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const wochentagKurz = teile.find((t) => t.type === "weekday")?.value ?? "Mo";
  const stunde = Number(teile.find((t) => t.type === "hour")?.value ?? "0");
  const minute = Number(teile.find((t) => t.type === "minute")?.value ?? "0");

  const map: Record<string, number> = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };
  return { tag: map[wochentagKurz.slice(0, 2)] ?? 1, minute: stunde * 60 + minute };
}

export interface Status {
  offen: boolean;
  /** Kurztext für das Statusabzeichen, z. B. "bis 18:30". */
  detail: string;
}

/** Ist gerade geöffnet — und wenn nicht, wann geht es weiter? */
export function status(now: Date = new Date()): Status {
  const { tag, minute } = jetztInGeldern(now);
  const heute = oeffnungszeiten[REIHENFOLGE[tag]];

  if (heute && minute >= minuten(heute.von) && minute < minuten(heute.bis)) {
    return { offen: true, detail: `bis ${heute.bis}` };
  }

  // Heute noch nicht auf? Dann ist heute der nächste Termin.
  if (heute && minute < minuten(heute.von)) {
    return { offen: false, detail: `öffnet heute ${heute.von}` };
  }

  // Sonst den nächsten Tag mit Öffnungszeiten suchen.
  for (let i = 1; i <= 7; i++) {
    const index = (tag + i) % 7;
    const zeit = oeffnungszeiten[REIHENFOLGE[index]];
    if (zeit) {
      const name = wochentage.find((w) => w.key === REIHENFOLGE[index])?.kurz ?? "";
      return { offen: false, detail: `öffnet ${name} ${zeit.von}` };
    }
  }

  return { offen: false, detail: "geschlossen" };
}
