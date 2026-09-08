import type { Metadata } from "next";
import { Booking } from "@/components/milano/Booking";
import { OpenStatus } from "@/components/milano/OpenStatus";
import { leistungen, salon } from "@/lib/milano/content";

export const metadata: Metadata = {
  title: `Termin buchen — ${salon.name} Geldern`,
  description: "Freie Zeiten ansehen und in dreißig Sekunden einen Platz sichern.",
  robots: { index: false, follow: false },
};

/**
 * Eigene Seite für die Buchung — kurz und ohne Ablenkung. Genau diesen
 * Link kann der Salon in die Instagram-Bio setzen.
 */
export default async function TerminSeite({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const gewuenscht = typeof params.leistung === "string" ? params.leistung : undefined;
  const vorauswahl = leistungen.some((l) => l.id === gewuenscht) ? gewuenscht : undefined;

  return (
    <section className="m-container m-section">
      <div className="m-section-kopf">
        <p className="m-eyebrow">Termin</p>
        <h1 className="m-titel m-titel-xl">Such dir einen Platz aus.</h1>
        <p className="m-fliess" style={{ marginTop: 6 }}>
          Vier Schritte, keine Anmeldung. Wer lieber anruft, erreicht den Laden unter{" "}
          <a href={`tel:${salon.telefonLink}`} className="m-num" style={{ color: "var(--messing)" }}>
            {salon.telefon}
          </a>
          .
        </p>
        <div style={{ marginTop: 6 }}>
          <OpenStatus />
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <Booking vorauswahl={vorauswahl} />
      </div>
    </section>
  );
}
