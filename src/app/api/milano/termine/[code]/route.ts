/**
 * Ein einzelner Termin — abrufen und absagen.
 *
 * Die Buchungsnummer ist hier der Schlüssel: Wer den Link aus der
 * Bestätigung hat, darf seinen Termin sehen und absagen. Genau so arbeitet
 * auch der Terminassistent später, nur mit einem längeren Token.
 */

import { terminAbsagen, terminPerCode } from "@/lib/milano/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const termin = await terminPerCode(code);
  if (!termin) {
    return Response.json({ fehler: "Diesen Termin gibt es nicht." }, { status: 404 });
  }
  return Response.json({ termin });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ergebnis = await terminAbsagen(code, "gast");

  if (!ergebnis.ok) {
    const texte = {
      unbekannt: "Diesen Termin gibt es nicht.",
      "schon-abgesagt": "Dieser Termin ist bereits abgesagt.",
      vorbei: "Dieser Termin liegt schon in der Vergangenheit.",
    } as const;
    return Response.json(
      { fehler: texte[ergebnis.grund] },
      { status: ergebnis.grund === "unbekannt" ? 404 : 409 },
    );
  }

  return Response.json({ termin: ergebnis.termin });
}
