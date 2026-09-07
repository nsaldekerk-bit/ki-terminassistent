import Link from "next/link";
import { Booking } from "@/components/milano/Booking";
import { Ecken, Monogramm, Siegel, Stange, Zierlinie } from "@/components/milano/Brand";
import { Icon } from "@/components/milano/Icon";
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

/** Für das Laufband — zweimal ausgegeben, damit die Schleife nahtlos läuft. */
const BAND = [
  "Haarschnitt",
  "Fade",
  "Skin Fade",
  "Bart",
  "Messerrasur",
  "Konturen",
  "Kinderschnitt",
  "Kopfrasur",
];

const PLATTEN = [
  { titel: "Fade", sub: "Verlauf & Kante" },
  { titel: "Bart", sub: "Form & Pflege" },
  { titel: "Klassiker", sub: "Schere & Kamm" },
  { titel: "Kinder", sub: "ohne Hektik" },
];

export default function MilanoStartseite() {
  const [gross, ...weitere] = bewertungen;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="m-hero">
        <div className="m-container m-hero-grid">
          <div className="m-hero-body" data-reveal>
            <OpenStatus />

            <h1 className="m-h1">
              Fade, Bart
              <br />
              und der klassische
              <br />
              <span className="m-kursiv">Schnitt.</span>
            </h1>

            <Zierlinie breit />

            <p className="m-lead">
              {salon.name} an der {salon.strasse} in {salon.ort}. Seit Jahren einer der am
              besten bewerteten Läden der Stadt — ab jetzt mit einem Termin, den du selbst
              buchst.
            </p>

            <div className="m-hero-cta">
              <Link href="/milano/termin" className="m-btn m-btn-primary">
                Termin buchen
              </Link>
              <a href={`tel:${salon.telefonLink}`} className="m-btn m-btn-ghost m-num">
                <Icon name="telefon" size={16} />
                {salon.telefon}
              </a>
            </div>
          </div>

          <div className="m-tafel" data-reveal>
            <Ecken />
            <Monogramm size={132} />
            <div className="m-tafel-reihe">
              <Stange hoehe={132} />
              <Siegel wert={salon.bewertung} anzahl={salon.bewertungenAnzahl} />
              <Stange hoehe={132} />
            </div>
            <span className="m-platte-sub">Issumer Straße · Geldern</span>
          </div>
        </div>
      </section>

      {/* ---------- Laufband ---------- */}
      <div className="m-band" aria-hidden="true">
        <div className="m-band-lauf">
          <span>
            {BAND.map((w) => (
              <span key={w} style={{ display: "contents" }}>
                {w}
                <i>◆</i>
              </span>
            ))}
          </span>
          <span>
            {BAND.map((w) => (
              <span key={w} style={{ display: "contents" }}>
                {w}
                <i>◆</i>
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* ---------- Kennzahlen ---------- */}
      <div className="m-container" style={{ paddingTop: 64 }}>
        <div className="m-zahlen" data-reveal>
          <div>
            <span className="m-zahl">
              {salon.bewertung}
              <small>
                <Icon name="stern" size={16} gefuellt />
              </small>
            </span>
            <span className="m-eyebrow">bei Google</span>
          </div>
          <div>
            <span className="m-zahl">{salon.bewertungenAnzahl}</span>
            <span className="m-eyebrow">Bewertungen</span>
          </div>
          <div>
            <span className="m-zahl">24/7</span>
            <span className="m-eyebrow">buchbar</span>
          </div>
          <div>
            <span className="m-zahl" style={{ fontSize: "1.5rem" }}>
              <span className="m-ph">[DE · TR · EN]</span>
            </span>
            <span className="m-eyebrow">wir sprechen</span>
          </div>
        </div>
      </div>

      {/* ---------- Leistungen ---------- */}
      <section className="m-container m-section" id="leistungen">
        <div className="m-section-head-row" data-reveal>
          <div className="m-section-head">
            <p className="m-eyebrow">Leistungen</p>
            <h2 className="m-h2">Was wir machen.</h2>
            <Zierlinie />
          </div>
          <Link href="/milano/leistungen" className="m-link-inline">
            Vollständige Preisliste
            <Icon name="pfeil-rechts" size={14} />
          </Link>
        </div>

        <div className="m-liste" data-reveal>
          {leistungen.slice(0, 6).map((l, i) => (
            <Link key={l.id} href={`/milano/termin?leistung=${l.id}`} className="m-zeile">
              <span className="m-zeile-nr">{String(i + 1).padStart(2, "0")}</span>
              <span className="m-zeile-name">{l.name}</span>
              <span className="m-zeile-desc">{l.beschreibung}</span>
              <span className="m-zeile-dauer m-num">{l.minuten} Min.</span>
              <span className="m-zeile-preis">{preis(l.preisCent)}</span>
            </Link>
          ))}
        </div>

        {PREISE_BESTAETIGT ? null : (
          <p className="m-hinweis">
            Beispielpreise — werden durch die echte Preisliste des Salons ersetzt.
          </p>
        )}
      </section>

      {/* ---------- Großes Zitat ---------- */}
      <section className="m-zitat">
        <div className="m-container m-zitat-inner" data-reveal>
          <Zierlinie breit />
          <blockquote className="m-display">„{gross.text}“</blockquote>
          <cite>
            {gross.autor} · {gross.quelle}
          </cite>
        </div>
      </section>

      {/* ---------- Buchung ---------- */}
      <section className="m-hell" id="termin">
        <div className="m-container m-hell-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} data-reveal>
            <p className="m-eyebrow">Termin</p>
            <h2 className="m-h2">
              Buchen, während
              <br />
              der Laden zu ist.
            </h2>
            <Zierlinie />
            <p className="m-lead">
              Freie Zeiten kommen direkt aus dem Kalender des Salons. Kein Rückruf, keine
              Warteschleife — und wer absagen will, macht das selbst über den Link in der
              Bestätigung.
            </p>
            <ul className="m-vorteile">
              <li>
                <span className="m-haken" aria-hidden="true">
                  <Icon name="haken" size={15} />
                </span>
                Erinnerung einen Tag vorher — weniger leere Stühle.
              </li>
              <li>
                <span className="m-haken" aria-hidden="true">
                  <Icon name="haken" size={15} />
                </span>
                Jeder Stuhl hat seinen eigenen Kalender.
              </li>
              <li>
                <span className="m-haken" aria-hidden="true">
                  <Icon name="haken" size={15} />
                </span>
                Urlaub eintragen — die Tage verschwinden aus der Auswahl.
              </li>
            </ul>
          </div>

          <div data-reveal>
            <Booking />
          </div>
        </div>
      </section>

      {/* ---------- Team ---------- */}
      <section className="m-container m-section" id="team">
        <div className="m-section-head" data-reveal>
          <p className="m-eyebrow">Team</p>
          <h2 className="m-h2">Wer schneidet.</h2>
          <Zierlinie />
        </div>

        <div className="m-team" data-reveal>
          {team.map((m) => (
            <div key={m.id} className="m-team-karte">
              <span className="m-medaillon" aria-hidden="true">
                M
              </span>
              <span className="m-h3">
                {TEAM_BESTAETIGT ? m.name : <span className="m-ph">[{m.name}]</span>}
              </span>
              <span className="m-platte-sub">{m.schwerpunkt}</span>
              <span style={{ fontSize: "0.84rem", color: "var(--text-weich)" }}>
                {TEAM_BESTAETIGT ? m.sprachen : <span className="m-ph">[{m.sprachen}]</span>}
              </span>
              <Link href="/milano/termin" className="m-link-inline" style={{ marginTop: 8 }}>
                Bei mir buchen
                <Icon name="pfeil-rechts" size={13} />
              </Link>
            </div>
          ))}
        </div>

        {TEAM_BESTAETIGT ? null : (
          <p className="m-hinweis">Namen, Fotos und Sprachen kommen vom Inhaber.</p>
        )}
      </section>

      {/* ---------- Arbeiten ---------- */}
      <section className="m-container m-section" id="arbeiten" style={{ paddingTop: 0 }}>
        <div className="m-section-head-row" data-reveal>
          <div className="m-section-head">
            <p className="m-eyebrow">Arbeiten</p>
            <h2 className="m-h2">Aus dem Salon.</h2>
            <Zierlinie />
          </div>
          <a
            href={salon.instagramUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="m-link-inline"
          >
            <Icon name="instagram" size={15} />@{salon.instagram}
          </a>
        </div>

        <div className="m-platten" data-reveal>
          {PLATTEN.map((p) => (
            <div key={p.titel} className="m-platte">
              <Ecken />
              <Monogramm size={54} />
              <span className="m-platte-titel">{p.titel}</span>
              <span className="m-platte-sub">{p.sub}</span>
            </div>
          ))}
        </div>

        <p className="m-hinweis">
          Diese vier Tafeln sind für die echten Salonfotos reserviert — sie treten an dieselbe
          Stelle, ohne dass sich am Aufbau etwas ändert.
        </p>
      </section>

      {/* ---------- Weitere Bewertungen ---------- */}
      <section className="m-container m-section" id="bewertungen" style={{ paddingTop: 0 }}>
        <div className="m-section-head" data-reveal>
          <p className="m-eyebrow">Bewertungen</p>
          <h2 className="m-h2">
            {salon.bewertung} von 5 — aus {salon.bewertungenAnzahl} Stimmen.
          </h2>
          <Zierlinie />
        </div>

        <div
          style={{ display: "grid", gap: 1, background: "var(--linie)", border: "1px solid var(--linie)" }}
          data-reveal
          className="m-reviews-grid"
        >
          {weitere.map((b) => (
            <figure
              key={b.autor}
              style={{
                margin: 0,
                background: "var(--ink)",
                padding: "34px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <span style={{ color: "var(--gold)", display: "flex", gap: 3 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Icon key={i} name="stern" size={13} gefuellt />
                ))}
              </span>
              <blockquote
                className="m-display"
                style={{ margin: 0, fontSize: "1.4rem", lineHeight: 1.3 }}
              >
                „{b.text}“
              </blockquote>
              <figcaption className="m-platte-sub" style={{ marginTop: "auto" }}>
                {b.autor} · {b.quelle}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- Öffnungszeiten & Anfahrt ---------- */}
      <section className="m-container m-section" id="anfahrt" style={{ paddingTop: 0 }}>
        <div className="m-anfahrt">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} data-reveal>
            <p className="m-eyebrow">Öffnungszeiten</p>
            <h2 className="m-h2">Wann wir da sind.</h2>
            <Zierlinie />

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
                        <span style={{ color: "var(--text-leise)" }}>Geschlossen</span>
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
          </div>

          <div className="m-adresstafel" data-reveal>
            <Ecken />
            <Monogramm size={72} />
            <p className="m-adresstafel-zeile" style={{ margin: 0 }}>
              {salon.strasse}
              <br />
              {salon.plz} {salon.ort}
            </p>
            <Zierlinie />
            <a href={`tel:${salon.telefonLink}`} className="m-num" style={{ color: "var(--gold)" }}>
              {salon.telefon}
            </a>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href={salon.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="m-btn m-btn-ghost"
              >
                <Icon name="pin" size={15} />
                Route öffnen
              </a>
            </div>
            <span className="m-platte-sub">Karte lädt erst nach Klick</span>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="m-container m-section" id="faq" style={{ paddingTop: 0 }}>
        <div className="m-section-head" data-reveal>
          <p className="m-eyebrow">Häufige Fragen</p>
          <h2 className="m-h2">Kurz gefragt.</h2>
          <Zierlinie />
        </div>

        <div className="m-faq" data-reveal>
          {faq.map((eintrag) => (
            <details key={eintrag.frage}>
              <summary>
                {eintrag.frage}
                <Icon name="chevron-unten" size={17} />
              </summary>
              <p>{eintrag.antwort}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
