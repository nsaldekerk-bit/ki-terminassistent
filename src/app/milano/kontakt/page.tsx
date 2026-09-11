import type { Metadata } from "next";
import Link from "next/link";
import { Kontaktformular } from "@/components/milano/Kontaktformular";
import { OpenStatus } from "@/components/milano/OpenStatus";
import { Icon } from "@/components/milano/Icon";
import {
  ZEITEN_BESTAETIGT,
  oeffnungszeiten,
  salon,
  wochentage,
} from "@/lib/milano/content";

export const metadata: Metadata = {
  title: `Kontakt — ${salon.name} Geldern`,
  description: `${salon.strasse}, ${salon.plz} ${salon.ort}. Telefon ${salon.telefon}. Öffnungszeiten und Anfahrt.`,
  robots: { index: false, follow: false },
};

/**
 * Eigene Kontaktseite — wie in der Vorlage. Adresse, Zeiten, Anfahrt und
 * ein Formular, dessen Nachricht wirklich im Postausgang des Salons
 * ankommt.
 */
export default function KontaktSeite() {
  return (
    <section className="m-container m-section">
      <div className="m-section-kopf m-section-kopf-zentriert">
        <p className="m-eyebrow">Kontakt</p>
        <h1 className="m-titel m-titel-xl">Sag uns Bescheid.</h1>
        <p className="m-fliess" style={{ textAlign: "center" }}>
          Am schnellsten geht ein Anruf. Wer lieber schreibt, nutzt das Formular — und wer
          einfach einen Platz will, bucht ihn direkt.
        </p>
        <div style={{ marginTop: 6 }}>
          <OpenStatus />
        </div>
      </div>

      <div className="m-kontakt">
        <div className="m-kontakt-spalte">
          <div className="m-kontakt-block">
            <h2>Im Laden</h2>
            <p className="m-fliess" style={{ margin: 0 }}>
              {salon.strasse}
              <br />
              {salon.plz} {salon.ort}
            </p>
            <a className="m-kontakt-link" href={salon.mapsUrl} target="_blank" rel="noreferrer">
              <Icon name="pin" size={16} />
              Route bei Google Maps
            </a>
          </div>

          <div className="m-kontakt-block">
            <h2>Am Telefon</h2>
            <a className="m-kontakt-nummer m-num" href={`tel:${salon.telefonLink}`}>
              {salon.telefon}
            </a>
            <p className="m-mini" style={{ margin: 0 }}>
              Wenn gerade geschnitten wird, dauert es manchmal — buchen geht ohne Warten.
            </p>
            <Link className="m-kontakt-link" href="/milano/termin">
              <Icon name="kalender" size={16} />
              Freie Zeiten ansehen
            </Link>
          </div>

          <div className="m-kontakt-block">
            <h2>Öffnungszeiten</h2>
            <dl className="m-zeiten-mini">
              {wochentage.map((tag) => {
                const zeit = oeffnungszeiten[tag.key];
                return (
                  <div key={tag.key}>
                    <dt>{tag.kurz}</dt>
                    <dd className="m-num">
                      {zeit ? (
                        ZEITEN_BESTAETIGT ? (
                          `${zeit.von}–${zeit.bis}`
                        ) : (
                          <span className="m-ph">
                            [{zeit.von}–{zeit.bis}]
                          </span>
                        )
                      ) : (
                        "geschlossen"
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {ZEITEN_BESTAETIGT ? null : (
              <p className="m-mini" style={{ margin: 0 }}>
                Die Zeiten in Klammern bestätigt der Inhaber noch.
              </p>
            )}
          </div>

          <div className="m-kontakt-block">
            <h2>Instagram</h2>
            <a
              className="m-kontakt-link"
              href={salon.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="instagram" size={16} />@{salon.instagram}
            </a>
          </div>
        </div>

        <div className="m-kontakt-spalte">
          <Kontaktformular />
        </div>
      </div>
    </section>
  );
}
