/**
 * Buchen. Prüft den Wunsch noch einmal gegen die freien Zeiten, legt den
 * Termin an und schreibt Bestätigung, Salon-Benachrichtigung und
 * Erinnerung in den Postausgang.
 */

import { z } from "zod";
import { leistungen } from "@/lib/milano/content";
import { freieZeiten, heuteInGeldern, innerhalbOeffnungszeit } from "@/lib/milano/slots";
import { aktiveTermine, stuehle, terminAnlegen } from "@/lib/milano/store";

export const dynamic = "force-dynamic";

const Wunsch = z.object({
  leistung: z.string(),
  mitarbeiter: z.string(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  von: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(80),
  telefon: z.string().trim().min(5).max(40),
  email: z.string().trim().max(120).optional().default(""),
  notiz: z.string().trim().max(500).optional().default(""),
});

export async function POST(request: Request) {
  const rohdaten = await request.json().catch(() => null);
  const gelesen = Wunsch.safeParse(rohdaten);
  if (!gelesen.success) {
    return Response.json({ fehler: "Die Angaben sind unvollständig." }, { status: 400 });
  }
  const w = gelesen.data;

  // E-Mail ist freiwillig — wer eine angibt, soll sie aber richtig angeben,
  // sonst geht die Bestätigung ins Leere.
  if (w.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(w.email)) {
    return Response.json({ fehler: "Die E-Mail-Adresse sieht nicht richtig aus." }, { status: 400 });
  }

  const leistung = leistungen.find((l) => l.id === w.leistung);
  if (!leistung) {
    return Response.json({ fehler: "Diese Leistung gibt es nicht." }, { status: 400 });
  }
  if (w.datum < heuteInGeldern()) {
    return Response.json({ fehler: "Dieser Tag liegt in der Vergangenheit." }, { status: 400 });
  }
  if (!innerhalbOeffnungszeit(w.datum, w.von, leistung.minuten)) {
    return Response.json({ fehler: "Zu dieser Zeit hat der Laden zu." }, { status: 409 });
  }

  // Den Stuhl bestimmen: Bei „egal" nimmt die Rechnung den ersten freien.
  const belegt = (await aktiveTermine(w.datum)).map((t) => ({
    mitarbeiterId: t.mitarbeiterId,
    von: t.von,
    minuten: t.minuten,
  }));
  const passend = freieZeiten({
    datum: w.datum,
    dauer: leistung.minuten,
    mitarbeiterId: w.mitarbeiter,
    stuehle: stuehle(),
    belegt,
  }).find((z) => z.zeit === w.von);

  if (!passend) {
    return Response.json(
      { fehler: "Diese Zeit ist gerade vergeben worden. Bitte wähl eine andere." },
      { status: 409 },
    );
  }

  const ergebnis = await terminAnlegen({
    leistungId: leistung.id,
    mitarbeiterId: passend.mitarbeiterId,
    datum: w.datum,
    von: w.von,
    minuten: leistung.minuten,
    name: w.name,
    telefon: w.telefon,
    email: w.email,
    notiz: w.notiz,
    basis: new URL(request.url).origin,
  });

  if (!ergebnis.ok) {
    return Response.json(
      { fehler: "Diese Zeit ist gerade vergeben worden. Bitte wähl eine andere." },
      { status: 409 },
    );
  }

  return Response.json({ termin: ergebnis.termin }, { status: 201 });
}
