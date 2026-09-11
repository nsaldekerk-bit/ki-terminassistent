/**
 * Freie Zeiten der nächsten Wochen.
 *
 * Antwortet mit allen Tagen am Stück, damit die Buchungsstrecke den
 * Tagesstreifen sofort richtig zeichnen kann: geschlossene Tage grau,
 * ausgebuchte Tage gesperrt, freie Tage klickbar.
 */

import { leistungen } from "@/lib/milano/content";
import {
  TAGE_VORAUS,
  freieZeiten,
  heuteInGeldern,
  plusTage,
  wochentagVon,
  type FreieZeit,
} from "@/lib/milano/slots";
import { aktiveTermine, stuehle } from "@/lib/milano/store";
import { oeffnungszeiten } from "@/lib/milano/content";

export const dynamic = "force-dynamic";

export interface TagAntwort {
  datum: string;
  wochentag: string;
  geschlossen: boolean;
  zeiten: FreieZeit[];
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const leistung = leistungen.find((l) => l.id === params.get("leistung"));
  const mitarbeiterId = params.get("mitarbeiter") ?? "egal";

  if (!leistung) {
    return Response.json({ fehler: "Leistung unbekannt" }, { status: 400 });
  }
  if (mitarbeiterId !== "egal" && !stuehle().includes(mitarbeiterId)) {
    return Response.json({ fehler: "Mitarbeiter unbekannt" }, { status: 400 });
  }

  const now = new Date();
  const heute = heuteInGeldern(now);
  const termine = await aktiveTermine();

  const tage: TagAntwort[] = [];
  for (let i = 0; i < TAGE_VORAUS; i++) {
    const datum = plusTage(heute, i);
    const wochentag = wochentagVon(datum);
    const geschlossen = oeffnungszeiten[wochentag] === null;

    tage.push({
      datum,
      wochentag,
      geschlossen,
      zeiten: geschlossen
        ? []
        : freieZeiten({
            datum,
            dauer: leistung.minuten,
            mitarbeiterId,
            stuehle: stuehle(),
            belegt: termine
              .filter((t) => t.datum === datum)
              .map((t) => ({ mitarbeiterId: t.mitarbeiterId, von: t.von, minuten: t.minuten })),
            now,
          }),
    });
  }

  return Response.json({ tage });
}
