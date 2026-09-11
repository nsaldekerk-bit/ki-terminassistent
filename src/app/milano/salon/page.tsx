import type { Metadata } from "next";
import { SalonAnsicht } from "@/components/milano/SalonAnsicht";
import { salon } from "@/lib/milano/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Innenansicht — ${salon.name}`,
  robots: { index: false, follow: false },
};

/**
 * Was der Salon von seiner Webseite hat: das Terminbuch und der
 * Postausgang. Nicht Teil der Kundenseite — sie ist nicht verlinkt und
 * wird nur im Verkaufsgespräch aufgerufen.
 */
export default function SalonSeite() {
  return (
    <section className="m-container m-section">
      <div className="m-section-kopf m-section-kopf-zentriert">
        <p className="m-eyebrow">Nur für den Inhaber</p>
        <h1 className="m-titel m-titel-xl">Was im Laden ankommt.</h1>
        <p className="m-fliess" style={{ textAlign: "center" }}>
          Diese Seite sieht kein Gast. Hier steht, was die Webseite für den Salon tut:
          jede Buchung im Terminbuch, jede Nachricht im Postausgang.
        </p>
      </div>

      <SalonAnsicht />
    </section>
  );
}
