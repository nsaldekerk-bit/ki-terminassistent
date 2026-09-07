import type { Metadata } from "next";
import { salon } from "@/lib/milano/content";
import { Zierlinie } from "@/components/milano/Brand";

export const metadata: Metadata = {
  title: `Impressum — ${salon.name}`,
  robots: { index: false, follow: false },
};

export default function ImpressumSeite() {
  return (
    <section className="m-container m-section">
      <div className="m-section-head">
        <p className="m-eyebrow">Rechtliches</p>
        <h1 className="m-h2">Impressum</h1>
        <Zierlinie />
      </div>

      <div className="m-text">
        <p className="m-infobox" style={{ margin: 0 }}>
          <span>
            <strong>Entwurf.</strong> Die Angaben in eckigen Klammern fehlen uns noch. Ein
            Impressum ist erst Pflicht, wenn die Seite veröffentlicht wird — vorher brauchen
            wir vom Inhaber Rechtsform, vollständigen Namen und Steuernummer.
          </span>
        </p>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          <strong>[Rechtsform und Firmenname]</strong>
          <br />
          {salon.strasse}
          <br />
          {salon.plz} {salon.ort}
        </p>

        <h2>Vertreten durch</h2>
        <p>
          <strong>[Vor- und Nachname des Inhabers]</strong>
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: <span className="m-num">{salon.telefon}</span>
          <br />
          E-Mail: <strong>[E-Mail-Adresse]</strong>
        </p>

        <h2>Umsatzsteuer</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: <strong>[USt-IdNr.]</strong>
        </p>

        <h2>Berufsrechtliche Angaben</h2>
        <p>
          Berufsbezeichnung: Friseur (verliehen in der Bundesrepublik Deutschland)
          <br />
          Zuständige Kammer: <strong>[Handwerkskammer]</strong>
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>
          <strong>[Vor- und Nachname]</strong>, Anschrift wie oben.
        </p>

        <h2>Streitschlichtung</h2>
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </div>
    </section>
  );
}
