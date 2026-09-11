import type { Metadata } from "next";
import Link from "next/link";
import { TerminAnsicht } from "@/components/milano/TerminAnsicht";
import { salon } from "@/lib/milano/content";
import { terminPerCode } from "@/lib/milano/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Dein Termin — ${salon.name}`,
  robots: { index: false, follow: false },
};

/**
 * Die Seite hinter dem Link aus der Bestätigungsmail. Die Buchungsnummer
 * ist der Schlüssel: Wer sie hat, sieht seinen Termin und kann ihn absagen.
 */
export default async function TerminDetailSeite({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const termin = await terminPerCode(code);

  return (
    <section className="m-container m-section">
      <div className="m-section-kopf m-section-kopf-zentriert">
        <p className="m-eyebrow">Dein Termin</p>
        <h1 className="m-titel m-titel-xl">
          {termin ? "Alles notiert." : "Nicht gefunden."}
        </h1>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {termin ? (
          <TerminAnsicht termin={termin} />
        ) : (
          <div className="m-book">
            <p className="m-fliess" style={{ textAlign: "center", margin: 0 }}>
              Zu der Buchungsnummer <span className="m-num">{code.toUpperCase()}</span> gibt
              es keinen Termin. Vielleicht ein Tippfehler im Link — oder der Termin wurde
              schon gelöscht.
            </p>
            <Link
              href="/milano/termin"
              className="m-knopf m-knopf-dunkel m-knopf-block"
              style={{ marginTop: 18 }}
            >
              Neuen Termin buchen
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
