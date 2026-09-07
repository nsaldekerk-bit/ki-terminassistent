import Link from "next/link";
import { Booking } from "@/components/milano/Booking";
import { Icon, Sterne } from "@/components/milano/Icon";
import { OpenStatus } from "@/components/milano/OpenStatus";
import {
  bewertungen,
  faq,
  leistungen,
  oeffnungszeiten,
  preis,
  salon,
  team,
  wochentage,
  PREISE_BESTAETIGT,
  TEAM_BESTAETIGT,
  ZEITEN_BESTAETIGT,
} from "@/lib/milano/content";

const STARTSEITE_LEISTUNGEN = [
  "haarschnitt",
  "fade",
  "schnitt-bart",
  "bart-trimmen",
  "messerrasur",
  "kinderhaarschnitt",
];

export default function MilanoStartseite() {
  const gezeigt = STARTSEITE_LEISTUNGEN.map(
    (id) => leistungen.find((l) => l.id === id)!,
  );

  return (
    <>
      {/* Hero */}
      <div className="m-container">
        <section className="m-hero">
          <div className="m-hero-body">
            <OpenStatus />

            <h1 className="m-h1">
              Fade, Bart
              <br />
              und der klassische
              <br />
              <span className="m-kursiv">Schnitt.</span>
            </h1>

            <p className="m-lead">
              {salon.name} an der {salon.strasse} in {salon.ort}. {salon.bewertung} Sterne aus{" "}
              {salon.bewertungenAnzahl} Google-Bewertungen — und ab jetzt ein Termin, den du
              selbst buchst.
            </p>

            <div className="m-hero-cta">
              <Link href="/milano/termin" className="m-btn m-btn-primary">
                <Icon name="kalender" size={18} />
                Termin buchen
              </Link>
              <a href={`tel:${salon.telefonLink}`} className="m-btn m-btn-ghost m-num">
                <Icon name="telefon" size={17} />
                {salon.telefon}
              </a>
            </div>
          </div>

          <div className="m-hero-media">
            <span className="m-platzhalter-media">
              <Icon name="bild" size={26} />
              Salonfoto folgt
            </span>
          </div>
        </section>
      </div>

      {/* Vertrauensleiste */}
      <div className="m-container">
        <div className="m-trust">
          <div>
            <span className="m-trust-wert">
              {salon.bewertung}
              <Icon name="stern" size={15} gefuellt />
            </span>
            <span className="m-eyebrow">bei Google</span>
          </div>
          <div>
            <span className="m-trust-wert m-num">{salon.bewertungenAnzahl}</span>
            <span className="m-eyebrow">Bewertungen</span>
          </div>
          <div>
            <span className="m-trust-wert">24/7</span>
            <span className="m-eyebrow">buchbar</span>
          </div>
          <div>
            <span className="m-trust-wert">
              <span className="m-ph">[DE · TR · EN]</span>
            </span>
            <span className="m-eyebrow">wir sprechen</span>
          </div>
        </div>
      </div>

      {/* Leistungen */}
      <section className="m-container m-section" id="leistungen">
        <div className="m-section-head-row">
          <div className="m-section-head">
            <p className="m-eyebrow">Leistungen</p>
            <h2 className="m-h2">Was wir machen.</h2>
            <hr className="m-rule" />
          </div>
          <Link href="/milano/leistungen" className="m-link-inline">
            Alle Leistungen und Preise
            <Icon name="pfeil-rechts" size={16} />
          </Link>
        </div>

        <div className="m-svc-liste">
          {gezeigt.map((l) => (
            <Link key={l.id} href={`/milano/termin?leistung=${l.id}`} className="m-svc">
              <span className="m-svc-icon">
                <Icon name={l.icon} size={20} />
              </span>
              <span className="m-svc-text">
                <span className="m-svc-name">{l.name}</span>
                <span className="m-svc-desc">
                  {l.beschreibung} <span className="m-num">· {l.minuten} Min.</span>
                </span>
              </span>
              <span className="m-svc-preis m-svc-preis-mobil m-num">{preis(l.preisCent)}</span>
              <span className="m-svc-fuss">
                <span className="m-num" style={{ fontSize: "0.85rem", color: "#8e8981" }}>
                  {l.minuten} Min.
                </span>
                <span className="m-svc-preis m-num">{preis(l.preisCent)}</span>
              </span>
            </Link>
          ))}
        </div>

        {PREISE_BESTAETIGT ? null : (
          <p className="m-hinweis">
            Beispielpreise — werden durch die echte Preisliste des Salons ersetzt.
          </p>
        )}
      </section>

      {/* Buchung */}
      <section className="m-hell" id="termin">
        <div className="m-container m-hell-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p className="m-eyebrow">Termin</p>
            <h2 className="m-h2">
              Buchen, während
              <br />
              der Laden zu ist.
            </h2>
            <hr className="m-rule" />
            <p className="m-lead">
              Freie Zeiten kommen direkt aus dem Kalender des Salons. Kein Rückruf, keine
              Warteschleife — und wer absagen will, macht das selbst über den Link in der
              Bestätigung.
            </p>
            <ul className="m-vorteile">
              <li>
                <span className="m-haken" aria-hidden="true">
                  <Icon name="haken" size={13} />
                </span>
                Erinnerung einen Tag vorher — weniger leere Stühle.
              </li>
              <li>
                <span className="m-haken" aria-hidden="true">
                  <Icon name="haken" size={13} />
                </span>
                Jeder Stuhl hat seinen eigenen Kalender.
              </li>
              <li>
                <span className="m-haken" aria-hidden="true">
                  <Icon name="haken" size={13} />
                </span>
                Urlaub eintragen — die Tage verschwinden aus der Auswahl.
              </li>
            </ul>
          </div>

          <Booking />
        </div>
      </section>

      {/* Team */}
      <section className="m-container m-section" id="team">
        <div className="m-section-head">
          <p className="m-eyebrow">Team</p>
          <h2 className="m-h2">Wer schneidet.</h2>
          <hr className="m-rule" />
        </div>

        <div className="m-team">
          {team.map((m) => (
            <div key={m.id} className="m-team-karte">
              <span className="m-team-bild">
                <Icon name="person" size={22} />
              </span>
              <span className="m-team-text">
                <span className="m-h3">
                  {TEAM_BESTAETIGT ? m.name : <span className="m-ph">[{m.name}]</span>}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#8e8981" }}>
                  {m.schwerpunkt} ·{" "}
                  {TEAM_BESTAETIGT ? m.sprachen : <span className="m-ph">[{m.sprachen}]</span>}
                </span>
                <Link
                  href="/milano/termin"
                  className="m-link-inline"
                  style={{ marginTop: 4, fontSize: "0.85rem" }}
                >
                  Bei mir buchen
                  <Icon name="pfeil-rechts" size={14} />
                </Link>
              </span>
            </div>
          ))}
        </div>

        {TEAM_BESTAETIGT ? null : (
          <p className="m-hinweis">Namen, Fotos und Sprachen kommen vom Inhaber.</p>
        )}
      </section>

      {/* Arbeiten */}
      <section className="m-container m-section" id="arbeiten" style={{ paddingTop: 0 }}>
        <div className="m-section-head-row">
          <div className="m-section-head">
            <p className="m-eyebrow">Arbeiten</p>
            <h2 className="m-h2">Aus dem Salon.</h2>
            <hr className="m-rule" />
          </div>
          <a
            href={salon.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="m-link-inline"
          >
            <Icon name="instagram" size={17} />@{salon.instagram}
          </a>
        </div>

        <div className="m-galerie">
          <div>Foto</div>
          <div>Foto</div>
          <div>Foto</div>
          <div>Foto</div>
        </div>
      </section>

      {/* Bewertungen */}
      <section className="m-container m-section" id="bewertungen" style={{ paddingTop: 0 }}>
        <div className="m-section-head-row">
          <div className="m-section-head">
            <p className="m-eyebrow">Bewertungen</p>
            <h2 className="m-h2">
              {salon.bewertung} von 5 — aus {salon.bewertungenAnzahl} Stimmen.
            </h2>
            <hr className="m-rule" />
          </div>
        </div>

        <div className="m-reviews">
          {bewertungen.map((b) => (
            <figure key={b.autor} className="m-review" style={{ margin: 0 }}>
              <Sterne />
              <blockquote className="m-review-text" style={{ margin: 0 }}>
                „{b.text}“
              </blockquote>
              <figcaption className="m-review-autor">
                {b.autor} · {b.quelle}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Öffnungszeiten & Anfahrt */}
      <section className="m-container m-section" id="anfahrt" style={{ paddingTop: 0 }}>
        <div className="m-anfahrt">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p className="m-eyebrow">Öffnungszeiten &amp; Anfahrt</p>
            <h2 className="m-h2">
              {salon.strasse},
              <br />
              {salon.plz} {salon.ort}.
            </h2>
            <hr className="m-rule" />

            <dl className="m-zeiten">
              {wochentage.map((tag) => {
                const zeit = oeffnungszeiten[tag.key];
                return (
                  <div key={tag.key}>
                    <dt>{tag.lang}</dt>
                    <dd className="m-num">
                      {zeit ? (
                        ZEITEN_BESTAETIGT ? (
                          `${zeit.von} – ${zeit.bis}`
                        ) : (
                          <span className="m-ph">
                            [{zeit.von} – {zeit.bis}]
                          </span>
                        )
                      ) : (
                        <span style={{ color: "var(--rot)" }}>Geschlossen</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {ZEITEN_BESTAETIGT ? null : (
              <p className="m-hinweis">
                Zeiten in Klammern sind Platzhalter — Google kennt bisher nur „öffnet Mo 09:00“.
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={salon.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="m-btn m-btn-ghost"
                style={{ flex: 1 }}
              >
                Route
              </a>
              <a href={`tel:${salon.telefonLink}`} className="m-btn m-btn-ghost" style={{ flex: 1 }}>
                Anrufen
              </a>
            </div>
          </div>

          <div className="m-karte">
            <span className="m-platzhalter-media">
              <Icon name="pin" size={26} />
              Karte lädt erst nach Klick
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="m-container m-section" id="faq" style={{ paddingTop: 0 }}>
        <div className="m-section-head">
          <p className="m-eyebrow">Häufige Fragen</p>
          <h2 className="m-h2">Kurz gefragt.</h2>
          <hr className="m-rule" />
        </div>

        <div className="m-faq">
          {faq.map((eintrag) => (
            <details key={eintrag.frage}>
              <summary>
                {eintrag.frage}
                <Icon name="chevron-unten" size={16} />
              </summary>
              <p>{eintrag.antwort}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
