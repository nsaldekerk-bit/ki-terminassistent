/**
 * Der Assistent beantwortet eine Frage.
 *
 * Die Rechnung läuft auf dem Server, obwohl sie auch im Browser liefe: So
 * sitzt der Assistent schon an der Stelle, an der später das Widget mit
 * dem Sprachmodell steht, und die Oberfläche muss sich dafür nicht ändern.
 */

import { z } from "zod";
import { antwortAuf } from "@/lib/milano/assistent";

export const dynamic = "force-dynamic";

const Frage = z.object({ frage: z.string().max(500) });

export async function POST(request: Request) {
  const gelesen = Frage.safeParse(await request.json().catch(() => null));
  if (!gelesen.success) {
    return Response.json({ fehler: "Frage fehlt." }, { status: 400 });
  }
  return Response.json(antwortAuf(gelesen.data.frage));
}
