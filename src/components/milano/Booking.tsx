"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import {
  leistungen,
  preis,
  team,
  wochentage,
  TEAM_BESTAETIGT,
  type Wochentag,
} from "@/lib/milano/content";

/*
 * Buchungsstrecke der Demoseite — vollständig funktionsfähig.
 *
 * Die freien Zeiten kommen aus /api/milano/zeiten und sind echt gerechnet:
 * Öffnungszeiten minus das, was auf den Stühlen schon vergeben ist. Der
 * letzte Schritt legt den Termin wirklich an, schreibt Bestätigung,
 * Salon-Benachrichtigung und Erinnerung in den Postausgang und gibt eine
 * Buchungsnummer samt Absage-Link zurück.
 *
 * Gespeichert wird lokal in `.milano-demo/daten.json` — kein Server, keine
 * Datenbank, nichts verlässt den Rechner.
 */

interface FreieZeit {
  zeit: string;
  mitarbeiterId: string;
}

interface Tag {
  datum: string;
  wochentag: Wochentag;
  geschlossen: boolean;
  zeiten: FreieZeit[];
}

interface Termin {
  code: string;
  leistungId: string;
  mitarbeiterId: string;
  datum: string;
  von: string;
  minuten: number;
  name: string;
}

type Schritt = 1 | 2 | 3 | 4 | 5;

/** "2026-09-12" → "Fr., 12. September" */
function datumText(datum: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date(`${datum}T12:00:00Z`));
}

/** Tagesziffer für den Streifen. */
function tagesZiffer(datum: string): string {
  return String(Number(datum.slice(8, 10)));
}

export function Booking({ vorauswahl }: { vorauswahl?: string }) {
  const [schritt, setSchritt] = useState<Schritt>(1);
  const [dienstId, setDienstId] = useState<string | null>(vorauswahl ?? null);
  const [mitarbeiterId, setMitarbeiterId] = useState<string>("egal");
  const [datum, setDatum] = useState<string | null>(null);
  const [uhrzeit, setUhrzeit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [notiz, setNotiz] = useState("");

  const [woche, setWoche] = useState(0);
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [termin, setTermin] = useState<Termin | null>(null);

  const karte = useRef<HTMLDivElement>(null);

  const dienst = useMemo(
    () => leistungen.find((l) => l.id === dienstId) ?? null,
    [dienstId],
  );

  /*
   * Die geladenen Tage tragen den Schlüssel, zu dem sie gehören. Passt er
   * nicht mehr zur Auswahl, gilt die Liste als „wird geladen“. So muss der
   * Effekt keinen Ladezustand setzen und löst keine zweite Renderrunde aus.
   * `stand` hochzählen heißt: dieselbe Auswahl noch einmal frisch holen.
   */
  const schluessel = dienstId ? `${dienstId}|${mitarbeiterId}` : null;
  const [geladen, setGeladen] = useState<{ schluessel: string; tage: Tag[] } | null>(null);
  const [stand, setStand] = useState(0);
  const tage = geladen && geladen.schluessel === schluessel ? geladen.tage : null;

  useEffect(() => {
    if (!dienstId || !schluessel) return;
    let abgebrochen = false;

    void (async () => {
      try {
        const antwort = await fetch(
          `/api/milano/zeiten?leistung=${encodeURIComponent(dienstId)}&mitarbeiter=${encodeURIComponent(mitarbeiterId)}`,
          { cache: "no-store" },
        );
        const daten = await antwort.json();
        if (!abgebrochen) setGeladen({ schluessel, tage: antwort.ok ? daten.tage : [] });
      } catch {
        if (!abgebrochen) setGeladen({ schluessel, tage: [] });
      }
    })();

    // Wer schnell zwischen Leistungen springt, darf keine veraltete Antwort
    // über die neue gelegt bekommen.
    return () => {
      abgebrochen = true;
    };
  }, [dienstId, mitarbeiterId, schluessel, stand]);

  // Nach einem Schritt kann der Kopf der Karte aus dem Bild gerutscht sein —
  // vor allem auf dem Handy. Dann nachziehen, damit der neue Schritt (und am
  // Ende die Bestätigung) auch wirklich zu sehen ist.
  useEffect(() => {
    const el = karte.current;
    if (!el || schritt === 1) return;
    if (el.getBoundingClientRect().top < 0) {
      const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "start", behavior: ruhig ? "auto" : "smooth" });
    }
  }, [schritt]);

  const tag = tage?.find((t) => t.datum === datum) ?? null;
  const zeiten = tag?.zeiten ?? [];

  const fortschritt = [0, 20, 45, 70, 90, 100][schritt];
  const kontaktOk = name.trim().length > 1 && telefon.trim().length > 5;

  /** Die sieben Tage, die der Streifen gerade zeigt. */
  const streifen = (tage ?? []).slice(woche * 7, woche * 7 + 7);
  const letzteWoche = Math.max(0, Math.ceil((tage?.length ?? 0) / 7) - 1);

  function zurueck() {
    setFehler(null);
    setSchritt((s) => (s > 1 ? ((s - 1) as Schritt) : s));
  }

  function neuStarten() {
    setSchritt(1);
    setDienstId(vorauswahl ?? null);
    setMitarbeiterId("egal");
    setDatum(null);
    setUhrzeit(null);
    setName("");
    setTelefon("");
    setEmail("");
    setNotiz("");
    setTermin(null);
    setFehler(null);
    setWoche(0);
  }

  async function buchen() {
    if (!dienstId || !datum || !uhrzeit) return;
    setSendet(true);
    setFehler(null);
    try {
      const antwort = await fetch("/api/milano/termine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leistung: dienstId,
          mitarbeiter: mitarbeiterId,
          datum,
          von: uhrzeit,
          name: name.trim(),
          telefon: telefon.trim(),
          email: email.trim(),
          notiz: notiz.trim(),
        }),
      });
      const daten = await antwort.json();

      if (!antwort.ok) {
        setFehler(daten.fehler ?? "Das hat gerade nicht geklappt.");
        // Der Platz kann in der Zwischenzeit weg sein — dann zurück zur
        // Auswahl mit frisch geholten Zeiten.
        if (antwort.status === 409) {
          setUhrzeit(null);
          setSchritt(3);
          setStand((v) => v + 1);
        }
        return;
      }

      setTermin(daten.termin);
      setSchritt(5);
    } catch {
      setFehler("Keine Verbindung zum Server. Läuft `npm run dev` noch?");
    } finally {
      setSendet(false);
    }
  }

  const gebuchterMitarbeiter = termin
    ? (team.find((m) => m.id === termin.mitarbeiterId)?.name ?? termin.mitarbeiterId)
    : "";

  return (
    <div className="m-book" ref={karte}>
      <div className="m-book-fortschritt" aria-hidden="true">
        <i style={{ width: `${fortschritt}%` }} />
      </div>

      {schritt < 5 ? (
        <div className="m-book-kopf">
          {schritt > 1 ? (
            <button type="button" className="m-book-zurueck" onClick={zurueck} aria-label="Zurück">
              <Icon name="pfeil-links" size={16} />
            </button>
          ) : null}
          <span className="m-book-schritt">
            Schritt {schritt} von 4 ·{" "}
            {["Leistung", "Wer schneidet", "Tag & Uhrzeit", "Kontakt"][schritt - 1]}
          </span>
        </div>
      ) : null}

      {fehler && schritt < 5 ? (
        <p className="m-book-fehler" role="alert">
          {fehler}
        </p>
      ) : null}

      {/* 1 — Leistung */}
      {schritt === 1 ? (
        <>
          <div className="m-book-optionen">
            {leistungen.map((l) => (
              <button
                key={l.id}
                type="button"
                className="m-book-option"
                aria-pressed={dienstId === l.id}
                onClick={() => {
                  setDienstId(l.id);
                  setUhrzeit(null);
                  setDatum(null);
                }}
              >
                <span className="m-book-option-name">{l.name}</span>
                <span className="m-book-option-meta m-num">
                  {l.minuten} Min. · {preis(l.preisCent)}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="m-knopf m-knopf-dunkel m-knopf-block"
            disabled={!dienst}
            onClick={() => setSchritt(2)}
          >
            Weiter
            <Icon name="pfeil-rechts" size={17} />
          </button>
        </>
      ) : null}

      {/* 2 — Mitarbeiter */}
      {schritt === 2 ? (
        <>
          <div className="m-book-optionen">
            <button
              type="button"
              className="m-book-option"
              aria-pressed={mitarbeiterId === "egal"}
              onClick={() => {
                setMitarbeiterId("egal");
                setUhrzeit(null);
              }}
            >
              <span className="m-book-option-name">Egal, Hauptsache bald</span>
              <span className="m-book-option-meta">meiste freie Zeiten</span>
            </button>
            {team.map((m) => (
              <button
                key={m.id}
                type="button"
                className="m-book-option"
                aria-pressed={mitarbeiterId === m.id}
                onClick={() => {
                  setMitarbeiterId(m.id);
                  setUhrzeit(null);
                }}
              >
                <span className="m-book-option-name">
                  {TEAM_BESTAETIGT ? m.name : `[${m.name}]`}
                </span>
                <span className="m-book-option-meta">{m.schwerpunkt}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="m-knopf m-knopf-dunkel m-knopf-block"
            onClick={() => setSchritt(3)}
          >
            Weiter
            <Icon name="pfeil-rechts" size={17} />
          </button>
        </>
      ) : null}

      {/* 3 — Tag & Uhrzeit */}
      {schritt === 3 ? (
        <>
          {tage === null ? (
            <p className="m-mini">Freie Zeiten werden geladen …</p>
          ) : (
            <>
              <div className="m-book-wochen">
                <button
                  type="button"
                  onClick={() => setWoche((w) => Math.max(0, w - 1))}
                  disabled={woche === 0}
                  aria-label="Woche zurück"
                >
                  <Icon name="pfeil-links" size={15} />
                </button>
                <span className="m-book-schritt">
                  {woche === 0 ? "Diese Woche" : woche === 1 ? "Nächste Woche" : "In zwei Wochen"}
                </span>
                <button
                  type="button"
                  onClick={() => setWoche((w) => Math.min(letzteWoche, w + 1))}
                  disabled={woche >= letzteWoche}
                  aria-label="Woche vor"
                >
                  <Icon name="pfeil-rechts" size={15} />
                </button>
              </div>

              <div className="m-book-tage">
                {streifen.map((t) => (
                  <button
                    key={t.datum}
                    type="button"
                    className="m-book-tag"
                    disabled={t.geschlossen || t.zeiten.length === 0}
                    aria-pressed={datum === t.datum}
                    title={
                      t.geschlossen
                        ? "Ruhetag"
                        : t.zeiten.length === 0
                          ? "Ausgebucht"
                          : `${t.zeiten.length} freie Zeiten`
                    }
                    onClick={() => {
                      setDatum(t.datum);
                      setUhrzeit(null);
                    }}
                  >
                    <span className="m-book-tag-wt">
                      {wochentage.find((w) => w.key === t.wochentag)?.kurz}
                    </span>
                    <span className="m-book-tag-nr">{tagesZiffer(t.datum)}</span>
                  </button>
                ))}
              </div>

              {tag ? (
                zeiten.length > 0 ? (
                  <>
                    <span className="m-book-schritt">
                      Freie Zeiten · {datumText(tag.datum)}
                    </span>
                    <div className="m-book-slots">
                      {zeiten.map((z) => (
                        <button
                          key={z.zeit}
                          type="button"
                          className="m-slot"
                          aria-pressed={uhrzeit === z.zeit}
                          onClick={() => setUhrzeit(z.zeit)}
                        >
                          {z.zeit}
                        </button>
                      ))}
                    </div>
                    <p className="m-mini">
                      Echte Belegung: Was hier fehlt, ist schon vergeben.
                    </p>
                  </>
                ) : (
                  <p className="m-mini">
                    An diesem Tag ist nichts mehr frei. Probier einen anderen Tag.
                  </p>
                )
              ) : (
                <p className="m-mini">Wähle zuerst einen Tag.</p>
              )}
            </>
          )}

          <button
            type="button"
            className="m-knopf m-knopf-dunkel m-knopf-block"
            disabled={!uhrzeit}
            onClick={() => setSchritt(4)}
          >
            Weiter
            <Icon name="pfeil-rechts" size={17} />
          </button>
        </>
      ) : null}

      {/* 4 — Kontakt */}
      {schritt === 4 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="m-feld">
              <label htmlFor="m-name">Name</label>
              <input
                id="m-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="m-feld">
              <label htmlFor="m-tel">Handynummer</label>
              <input
                id="m-tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="0151 …"
              />
            </div>
            <div className="m-feld">
              <label htmlFor="m-mail">E-Mail — für Bestätigung und Erinnerung (optional)</label>
              <input
                id="m-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="name@beispiel.de"
              />
            </div>
            <div className="m-feld">
              <label htmlFor="m-notiz">Anmerkung (optional)</label>
              <input
                id="m-notiz"
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="z. B. Seiten kurz, oben länger"
              />
            </div>
          </div>

          <button
            type="button"
            className="m-knopf m-knopf-dunkel m-knopf-block"
            disabled={!kontaktOk || sendet}
            onClick={buchen}
          >
            {sendet ? "Einen Moment …" : "Termin verbindlich buchen"}
          </button>
          <p className="m-mini" style={{ textAlign: "center" }}>
            Kostenlos · jederzeit selbst absagbar
          </p>
        </>
      ) : null}

      {/* 5 — Fertig */}
      {schritt === 5 && termin ? (
        <div className="m-book-fertig">
          <span className="m-book-haken" aria-hidden="true">
            <Icon name="haken" size={32} />
          </span>
          <h3 className="m-titel m-titel-m" style={{ margin: 0 }}>
            Termin steht.
          </h3>

          <dl className="m-book-zusammenfassung">
            <div>
              <dt>Leistung</dt>
              <dd>{leistungen.find((l) => l.id === termin.leistungId)?.name}</dd>
            </div>
            <div>
              <dt>Wann</dt>
              <dd className="m-num">
                {datumText(termin.datum)} · {termin.von}
              </dd>
            </div>
            <div>
              <dt>Bei</dt>
              <dd>{TEAM_BESTAETIGT ? gebuchterMitarbeiter : `[${gebuchterMitarbeiter}]`}</dd>
            </div>
            <div>
              <dt>Auf den Namen</dt>
              <dd>{termin.name}</dd>
            </div>
            <div>
              <dt>Buchungsnummer</dt>
              <dd className="m-num">{termin.code}</dd>
            </div>
          </dl>

          <a
            href={`/milano/termin/${termin.code}`}
            className="m-knopf m-knopf-dunkel m-knopf-block"
          >
            Termin ansehen oder absagen
          </a>

          <p className="m-demo-notiz">
            <span style={{ flex: "none", color: "var(--text-grau)", marginTop: 1 }}>
              <Icon name="kalender" size={16} />
            </span>
            <span>
              <strong>Vorführ-Ansicht.</strong> Der Termin ist wirklich gespeichert — der
              Platz ist jetzt belegt und taucht nicht mehr in den freien Zeiten auf. Was
              daraufhin rausginge — Bestätigung an dich, Benachrichtigung an den Laden,
              Erinnerung am Vortag —, liegt im Postausgang unter{" "}
              <a href="/milano/salon" style={{ borderBottom: "1px solid currentColor" }}>
                /milano/salon
              </a>
              . Verschickt wird in der Vorführung nichts.
            </span>
          </p>

          <button type="button" className="m-knopf m-knopf-linie m-knopf-block" onClick={neuStarten}>
            Noch einen Termin buchen
          </button>
        </div>
      ) : null}
    </div>
  );
}
