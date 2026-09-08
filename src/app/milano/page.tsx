import Link from "next/link";
import { Booking } from "@/components/milano/Booking";
import { Carousel } from "@/components/milano/Carousel";
import { Monogramm, Signatur } from "@/components/milano/Brand";
import { Icon } from "@/components/milano/Icon";
import {
  bewertungen,
  faq,
  leistungen,
  oeffnungszeiten,
  preis,
  salon,
  wochentage,
  PREISE_BESTAETIGT,
  ZEITEN_BESTAETIGT,
} from "@/lib/milano/content";

const STREIFEN = ["Fade", "Bart", "Klassiker", "Kinder", "Messerrasur"];

export default function MilanoStartseite() {
  return (
    <>
      <Carousel />

      {/* ---------- Drei Karten ---------- */}
      <section className="m-section" style={{ paddingTop: 56 }}>
        <div className="m-container">
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <Signatur>Milano</Signatur>
          </div>

          <div className="m-karten" data-reveal>
            <div className="m-karte">
              <span className="m-karte-bild" aria-hidden="true">
                <Monogramm size={110} />
              </span>
              <h2 className="m-titel m-titel-m">Unsere Preisliste</h2>
              <p className="m-fliess">
                Was wir genau anbieten? Hier findest du alle Leistungen und eine
                Preisübersicht.
              </p>
              <Link href="/milano/leistungen" className="m-knopf m-knopf-dunkel">
                Unsere Leistungen &amp; Preise
              </Link>
            </div>

            <div className="m-karte">
              <span className="m-karte-bild" aria-hidden="true">
                <Monogramm size={110} />
              </span>
              <h2 className="m-titel m-titel-m">{salon.name}</h2>
              <p className="m-fliess">
                Entdecke unseren Laden an der {salon.strasse} — wo Handwerk auf Präzision
                trifft.
              </p>
              <Link href="/milano#studio" className="m-knopf m-knopf-dunkel">
                Erfahre Mehr Über Uns
              </Link>
            </div>

            <div className="m-karte m-karte-dunkel">
              <span className="m-karte-bild" aria-hidden="true">
                <Monogramm size={110} />
              </span>
              <h2 className="m-titel m-titel-m">Termin buchen</h2>
              <p className="m-fliess">
                Jetzt Termin buchen für deinen Signature Cut by {salon.name}.
              </p>
              <Link href="/milano/termin" className="m-knopf m-knopf-hell">
                Buche Dir Jetzt Einen Termin!
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Leistungen ---------- */}
      <section className="m-section" id="leistungen" style={{ paddingTop: 0 }}>
        <div className="m-container">
          <div className="m-section-kopf m-section-kopf-zentriert" data-reveal>
            <p className="m-eyebrow">Leistungen</p>
            <h2 className="m-titel m-titel-xl">Was wir machen.</h2>
          </div>

          <div className="m-liste" data-reveal>
            {leistungen.slice(0, 6).map((l) => (
              <Link key={l.id} href={`/milano/termin?leistung=${l.id}`} className="m-zeile">
                <span className="m-zeile-name">{l.name}</span>
                <span className="m-zeile-desc">{l.beschreibung}</span>
                <span className="m-zeile-dauer m-num">{l.minuten} Min.</span>
                <span className="m-zeile-preis m-num">{preis(l.preisCent)}</span>
              </Link>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              marginTop: 26,
              flexWrap: "wrap",
            }}
          >
            <Link href="/milano/leistungen" className="m-link-inline">
              Vollständige Preisliste
              <Icon name="pfeil-rechts" size={14} />
            </Link>
            {PREISE_BESTAETIGT ? null : (
              <p className="m-mini">
                Beispielpreise — werden durch die echte Preisliste des Salons ersetzt.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Studio ---------- */}
      <section className="m-section" id="studio" style={{ paddingTop: 0 }}>
        <div className="m-container">
          <div className="m-karten" style={{ gridTemplateColumns: "1fr" }} data-reveal>
            <div
              className="m-karte"
              style={{ minHeight: 0, display: "grid", gap: 34, alignItems: "center" }}
            >
              <div className="m-studio-grid">
                <span className="m-karte-bild" aria-hidden="true" style={{ minHeight: 220 }}>
                  <Monogramm size={168} />
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <p className="m-eyebrow">Das Studio</p>
                  <h2 className="m-titel m-titel-l">{salon.name} in {salon.ort}.</h2>
                  <p className="m-fliess">
                    Wir sitzen an der {salon.strasse}, mitten in {salon.ort}. Herrenschnitte,
                    Fades, Bart und Kinder — ohne Hektik, dafür sauber. Bei Google stehen wir
                    bei {salon.bewertung} von 5 Sternen aus {salon.bewertungenAnzahl}{" "}
                    Bewertungen.
                  </p>

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

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                    <a
                      href={salon.mapsUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="m-knopf m-knopf-dunkel"
                    >
                      Route Öffnen
                    </a>
                    <a href={`tel:${salon.telefonLink}`} className="m-knopf m-knopf-linie">
                      Anrufen
                    </a>
                  </div>

                  {ZEITEN_BESTAETIGT ? null : (
                    <p className="m-mini">
                      Zeiten in Klammern sind Platzhalter — Google kennt bisher nur „öffnet Mo
                      09:00“.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Buchung ---------- */}
      <section className="m-section" id="termin" style={{ paddingTop: 0 }}>
        <div className="m-container">
          <div className="m-section-kopf m-section-kopf-zentriert" data-reveal>
            <p className="m-eyebrow">Termin</p>
            <h2 className="m-titel m-titel-xl">Buche deinen Platz.</h2>
            <p className="m-fliess" style={{ textAlign: "center" }}>
              Freie Zeiten kommen direkt aus dem Kalender des Salons. Kein Rückruf, keine
              Warteschleife — und absagen kannst du selbst.
            </p>
          </div>

          <div style={{ maxWidth: 620, margin: "0 auto" }} data-reveal>
            <Booking />
          </div>
        </div>
      </section>

      {/* ---------- FAQ auf dunklem Grund ---------- */}
      <section className="m-dunkel" id="faq">
        <div className="m-container m-section">
          <div className="m-faq-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }} data-reveal>
              <h2 className="m-titel m-titel-l">Häufig gestellte Fragen.</h2>
              <p className="m-fliess">
                Du hast eine Frage oder ein Anliegen? Hier findest du Antworten zu Fragen, die
                wir oft gestellt bekommen.
              </p>
              <a
                href={`tel:${salon.telefonLink}`}
                className="m-knopf m-knopf-hell"
                style={{ alignSelf: "flex-start" }}
              >
                Kontaktiere Uns
              </a>
            </div>

            <div className="m-faq" data-reveal>
              {faq.map((eintrag) => (
                <details key={eintrag.frage}>
                  <summary>
                    {eintrag.frage}
                    <span className="m-faq-plus" aria-hidden="true" />
                  </summary>
                  <p>{eintrag.antwort}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Bilderstreifen ---------- */}
      <section className="m-section" id="galerie">
        <div className="m-container">
          <div className="m-section-kopf m-section-kopf-zentriert" data-reveal>
            <p className="m-eyebrow">Galerie</p>
            <h2 className="m-titel m-titel-xl">Aus dem Salon.</h2>
          </div>

          <div className="m-streifen" data-reveal>
            {STREIFEN.map((titel) => (
              <div className="m-streifen-platte" key={titel}>
                <Monogramm size={64} />
                <span className="m-streifen-titel">{titel}</span>
              </div>
            ))}
          </div>

          <p className="m-mini" style={{ marginTop: 18, textAlign: "center" }}>
            Diese Flächen sind für die echten Salonfotos reserviert — sie treten an dieselbe
            Stelle, ohne dass sich am Aufbau etwas ändert.
          </p>
        </div>
      </section>

      {/* ---------- Bewertungen ---------- */}
      <section className="m-section" id="bewertungen" style={{ paddingTop: 0 }}>
        <div className="m-container">
          <div className="m-section-kopf m-section-kopf-zentriert" data-reveal>
            <p className="m-eyebrow">Bewertungen</p>
            <h2 className="m-titel m-titel-xl">
              {salon.bewertung} von 5 bei Google.
            </h2>
          </div>

          <div className="m-karten" data-reveal>
            {bewertungen.map((b) => (
              <figure key={b.autor} className="m-karte" style={{ minHeight: 0, gap: 16 }}>
                <span style={{ display: "flex", gap: 3 }} aria-label="5 von 5 Sternen">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Icon key={s} name="stern" size={13} gefuellt />
                  ))}
                </span>
                <blockquote
                  className="m-titel m-titel-m"
                  style={{ margin: 0, letterSpacing: "0.06em", lineHeight: 1.35 }}
                >
                  „{b.text}“
                </blockquote>
                <figcaption className="m-mini" style={{ marginTop: "auto" }}>
                  {b.autor} · {b.quelle}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Schlusszeile ---------- */}
      <section className="m-container m-schluss">
        <h2 className="m-titel m-titel-xl" data-reveal>
          Dein nächster Termin
          <br />
          bei {salon.name}.
        </h2>
        <Link href="/milano/termin" className="m-knopf m-knopf-dunkel" data-reveal>
          Buche Dir Jetzt Einen Termin!
        </Link>
      </section>
    </>
  );
}
