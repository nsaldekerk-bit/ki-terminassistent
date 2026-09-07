import type { Metadata } from "next";
import Link from "next/link";
import { Zierlinie } from "@/components/milano/Brand";
import { Icon } from "@/components/milano/Icon";
import {
  kategorien,
  leistungen,
  preis,
  salon,
  PREISE_BESTAETIGT,
} from "@/lib/milano/content";

export const metadata: Metadata = {
  title: `Leistungen & Preise — ${salon.name} Geldern`,
  description:
    "Herrenhaarschnitt, Fade, Bart und Kinderschnitt — mit Dauer und Preis je Leistung.",
  robots: { index: false, follow: false },
};

export default function LeistungenSeite() {
  return (
    <section className="m-container m-section">
      <div className="m-section-head">
        <p className="m-eyebrow">Leistungen &amp; Preise</p>
        <h1 className="m-h1" style={{ fontSize: "clamp(2.6rem, 8vw, 4.6rem)" }}>
          Alles, was
          <br />
          hier geschnitten wird.
        </h1>
        <Zierlinie breit />
        <p className="m-lead" style={{ marginTop: 4 }}>
          Preise inklusive Waschen und Styling. Bei jeder Leistung steht, wie lange sie dauert
          — der Kalender rechnet damit, sodass keine Wartezeit entsteht.
        </p>
      </div>

      {kategorien.map((kategorie) => {
        const eintraege = leistungen.filter((l) => l.kategorie === kategorie.key);
        if (eintraege.length === 0) return null;

        return (
          <div key={kategorie.key} className="m-preis-gruppe">
            <div className="m-preis-kopf">
              <h2 className="m-h2" style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
                {kategorie.name}
              </h2>
              <span className="m-eyebrow">
                {eintraege.length} {eintraege.length === 1 ? "Leistung" : "Leistungen"}
              </span>
            </div>

            <div className="m-liste">
              {eintraege.map((l, i) => (
                <Link key={l.id} href={`/milano/termin?leistung=${l.id}`} className="m-zeile">
                  <span className="m-zeile-nr">{String(i + 1).padStart(2, "0")}</span>
                  <span className="m-zeile-name">{l.name}</span>
                  <span className="m-zeile-desc">{l.beschreibung}</span>
                  <span className="m-zeile-dauer m-num">{l.minuten} Min.</span>
                  <span className="m-zeile-preis">{preis(l.preisCent)}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {PREISE_BESTAETIGT ? null : (
        <p className="m-infobox">
          <span style={{ flex: "none", color: "var(--gold)", marginTop: 3 }}>
            <Icon name="stern" size={17} gefuellt />
          </span>
          <span>
            Sämtliche Preise und Dauern auf dieser Seite sind{" "}
            <strong>Beispielwerte für den Entwurf</strong>. Sie werden eins zu eins durch die
            echte Preisliste ersetzt — später im Dashboard, ohne dass jemand am Code arbeiten
            muss.
          </span>
        </p>
      )}
    </section>
  );
}
