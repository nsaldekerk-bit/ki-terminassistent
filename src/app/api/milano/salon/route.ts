/**
 * Die Innenansicht des Salons: alle Buchungen und der Postausgang.
 *
 * Sie ist nicht Teil der Kundenseite, sondern das Gegenstück dazu — im
 * Verkaufsgespräch die Antwort auf „und was sehe ich davon?".
 */

import { z } from "zod";
import {
  alleTermine,
  faelligeVerschicken,
  postausgang,
  terminAbsagen,
  zuruecksetzen,
} from "@/lib/milano/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [termine, nachrichten] = await Promise.all([alleTermine(), postausgang()]);
  return Response.json({ termine, postausgang: nachrichten });
}

const Befehl = z.object({
  aktion: z.enum(["verschicken", "absagen", "zuruecksetzen"]),
  code: z.string().optional(),
});

export async function POST(request: Request) {
  const gelesen = Befehl.safeParse(await request.json().catch(() => null));
  if (!gelesen.success) {
    return Response.json({ fehler: "Unbekannter Befehl." }, { status: 400 });
  }

  if (gelesen.data.aktion === "verschicken") {
    const raus = await faelligeVerschicken();
    return Response.json({ verschickt: raus.length });
  }

  if (gelesen.data.aktion === "zuruecksetzen") {
    await zuruecksetzen();
    return Response.json({ ok: true });
  }

  const code = gelesen.data.code;
  if (!code) {
    return Response.json({ fehler: "Es fehlt die Buchungsnummer." }, { status: 400 });
  }
  const ergebnis = await terminAbsagen(code, "salon");
  if (!ergebnis.ok) {
    return Response.json({ fehler: ergebnis.grund }, { status: 409 });
  }
  return Response.json({ termin: ergebnis.termin });
}
