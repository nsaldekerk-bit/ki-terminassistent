import type { Metadata } from "next";
import { salon } from "@/lib/milano/content";

export const metadata: Metadata = {
  title: `Datenschutz — ${salon.name}`,
  robots: { index: false, follow: false },
};

export default function DatenschutzSeite() {
  return (
    <section className="m-container m-section">
      <div className="m-section-kopf">
        <p className="m-eyebrow">Rechtliches</p>
        <h1 className="m-titel m-titel-xl">Datenschutz</h1>
      </div>

      <div className="m-text">
        <p className="m-infobox" style={{ margin: 0 }}>
          <span>
            <strong>Entwurf.</strong> Dieser Text beschreibt, wie die Seite im fertigen Ausbau
            mit Daten umgeht. Die Vorführversion läuft örtlich auf einem Rechner, speichert
            nichts und verschickt keine Nachrichten.
          </span>
        </p>

        <h2>Wer verarbeitet die Daten</h2>
        <p>
          Verantwortlich ist <strong>[Rechtsform und Firmenname]</strong>, {salon.strasse},{" "}
          {salon.plz} {salon.ort}.
        </p>

        <h2>Was bei einer Terminbuchung erhoben wird</h2>
        <p>
          Name, Telefonnummer und — sofern angegeben — E-Mail-Adresse, dazu die gewählte
          Leistung und der Termin. Diese Angaben brauchen wir, um den Termin zu vergeben, ihn
          zu bestätigen und einen Tag vorher daran zu erinnern. Rechtsgrundlage ist Art. 6
          Abs. 1 lit. b DSGVO (Durchführung vorvertraglicher Maßnahmen).
        </p>

        <h2>Wie lange gespeichert wird</h2>
        <p>
          Termindaten werden gelöscht, sobald sie für den Betrieb nicht mehr gebraucht werden
          — spätestens nach <strong>[Frist festlegen]</strong>. Gesetzliche
          Aufbewahrungspflichten bleiben unberührt.
        </p>

        <h2>Schriften und Karten</h2>
        <p>
          Die Schriften werden vom eigenen Server ausgeliefert; es besteht keine Verbindung zu
          Google-Servern. Die Karte auf der Anfahrtsseite lädt erst, wenn sie ausdrücklich
          angeklickt wird — vorher wird kein Kartendienst kontaktiert.
        </p>

        <h2>Cookies</h2>
        <p>
          Die Seite setzt keine Cookies zu Werbe- oder Analysezwecken. Deshalb erscheint auch
          kein Einwilligungsbanner.
        </p>

        <h2>Deine Rechte</h2>
        <p>
          Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
          und Widerspruch. Dafür genügt eine formlose Nachricht an{" "}
          <strong>[E-Mail-Adresse]</strong>. Außerdem besteht ein Beschwerderecht bei einer
          Aufsichtsbehörde.
        </p>
      </div>
    </section>
  );
}
