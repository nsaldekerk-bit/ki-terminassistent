/**
 * Nachricht aus dem Kontaktformular entgegennehmen.
 *
 * Sie wird gespeichert und im Postausgang unter /milano/salon sichtbar —
 * verschickt wird in der Vorführung nichts.
 */

import { z } from "zod";
import { anfrageAnlegen } from "@/lib/milano/store";

export const dynamic = "force-dynamic";

const Formular = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120).optional().default(""),
  telefon: z.string().trim().max(40).optional().default(""),
  text: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request) {
  const gelesen = Formular.safeParse(await request.json().catch(() => null));
  if (!gelesen.success) {
    return Response.json({ fehler: "Bitte Name und Nachricht ausfüllen." }, { status: 400 });
  }
  const a = gelesen.data;

  if (a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) {
    return Response.json({ fehler: "Die E-Mail-Adresse sieht nicht richtig aus." }, { status: 400 });
  }
  // Ohne Rückweg kann der Laden nicht antworten.
  if (!a.email && !a.telefon) {
    return Response.json(
      { fehler: "Bitte gib eine E-Mail-Adresse oder eine Telefonnummer an." },
      { status: 400 },
    );
  }

  await anfrageAnlegen(a);
  return Response.json({ ok: true }, { status: 201 });
}
