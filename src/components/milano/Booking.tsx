"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import {
  leistungen,
  oeffnungszeiten,
  preis,
  team,
  wochentage,
  TEAM_BESTAETIGT,
  type Leistung,
  type Wochentag,
} from "@/lib/milano/content";

/*
 * Buchungsstrecke der Demoseite.
 *
 * Sie ist vollständig bedienbar, spricht aber noch keine Datenbank an: Die
 * freien Zeiten werden aus den Öffnungszeiten erzeugt, und der letzte
 * Schritt speichert nichts und verschickt keine Mail. Das Anschließen an
 * den Terminassistenten (echte Slots, Buchung, Bestätigungsmail,
 * Erinnerung, Selbst-Absage) ist der nächste Ausbauschritt.
 */

const TAGE_VORAUS = 14;
const RASTER_MINUTEN = 15;
const WOCHENTAG_KEYS: Wochentag[] = ["so", "mo", "di", "mi", "do", "fr", "sa"];

interface Tag {
  datum: Date;
  key: Wochentag;
  geschlossen: boolean;
}

function minuten(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function alsUhrzeit(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Stabiler Streuwert — damit Server und Client dieselben Slots zeigen. */
function streu(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Freie Zeiten eines Tages. Im Ausbau kommt das aus
 * lib/availability/slots.ts; hier wird es aus den Öffnungszeiten erzeugt
 * und ein Teil als belegt ausgeblendet, damit die Auswahl realistisch
 * aussieht statt lückenlos.
 */
function freieZeiten(tag: Tag, dienst: Leistung, mitarbeiter: string): string[] {
  const zeit = oeffnungszeiten[tag.key];
  if (!zeit) return [];

  const datum = tag.datum.toISOString().slice(0, 10);
  const zeiten: string[] = [];

  for (
    let m = minuten(zeit.von);
    m + dienst.minuten <= minuten(zeit.bis);
    m += RASTER_MINUTEN
  ) {
    if (streu(`${datum}|${dienst.id}|${mitarbeiter}|${m}`) > 0.72) {
      zeiten.push(alsUhrzeit(m));
    }
  }

  return zeiten.slice(0, 12);
}

type Schritt = 1 | 2 | 3 | 4 | 5;

export function Booking({ vorauswahl }: { vorauswahl?: string }) {
  const [schritt, setSchritt] = useState<Schritt>(1);
  const [dienstId, setDienstId] = useState<string | null>(vorauswahl ?? null);
  const [mitarbeiterId, setMitarbeiterId] = useState<string>("egal");
  const [tagIndex, setTagIndex] = useState<number | null>(null);
  const [uhrzeit, setUhrzeit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [tage, setTage] = useState<Tag[]>([]);
  const karte = useRef<HTMLDivElement>(null);

  // Die Tage erst im Browser bilden: Auf dem Server wäre „heute" eine
  // andere Sekunde und React meldete eine Hydration-Abweichung.
  useEffect(() => {
    const heute = new Date();
    const liste: Tag[] = [];
    for (let i = 0; i < TAGE_VORAUS; i++) {
      const datum = new Date(heute);
      datum.setDate(heute.getDate() + i);
      const key = WOCHENTAG_KEYS[datum.getDay()];
      liste.push({ datum, key, geschlossen: oeffnungszeiten[key] === null });
    }
    setTage(liste);
  }, []);

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

  const dienst = useMemo(
    () => leistungen.find((l) => l.id === dienstId) ?? null,
    [dienstId],
  );

  const tag = tagIndex !== null ? (tage[tagIndex] ?? null) : null;

  const zeiten = useMemo(() => {
    if (!tag || !dienst) return [];
    return freieZeiten(tag, dienst, mitarbeiterId);
  }, [tag, dienst, mitarbeiterId]);

  const mitarbeiterName =
    mitarbeiterId === "egal"
      ? "wer gerade frei ist"
      : (team.find((m) => m.id === mitarbeiterId)?.name ?? "");

  const datumText = tag
    ? tag.datum.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "numeric",
        month: "long",
      })
    : "";

  const fortschritt = [0, 20, 45, 70, 90, 100][schritt];
  const kontaktOk = name.trim().length > 1 && telefon.trim().length > 5;

  function zurueck() {
    setSchritt((s) => (s > 1 ? ((s - 1) as Schritt) : s));
  }

  function neuStarten() {
    setSchritt(1);
    setDienstId(vorauswahl ?? null);
    setMitarbeiterId("egal");
    setTagIndex(null);
    setUhrzeit(null);
    setName("");
    setTelefon("");
    setEmail("");
  }

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
          {tage.length === 0 ? (
            <p className="m-mini">Freie Zeiten werden geladen …</p>
          ) : (
            <>
              <div className="m-book-tage">
                {tage.slice(0, 7).map((t, i) => (
                  <button
                    key={t.datum.toISOString()}
                    type="button"
                    className="m-book-tag"
                    disabled={t.geschlossen}
                    aria-pressed={tagIndex === i}
                    onClick={() => {
                      setTagIndex(i);
                      setUhrzeit(null);
                    }}
                  >
                    <span className="m-book-tag-wt">
                      {wochentage.find((w) => w.key === t.key)?.kurz}
                    </span>
                    <span className="m-book-tag-nr">{t.datum.getDate()}</span>
                  </button>
                ))}
              </div>

              {tag ? (
                zeiten.length > 0 ? (
                  <>
                    <span className="m-book-schritt">Freie Zeiten · {datumText}</span>
                    <div className="m-book-slots">
                      {zeiten.map((z) => (
                        <button
                          key={z}
                          type="button"
                          className="m-slot"
                          aria-pressed={uhrzeit === z}
                          onClick={() => setUhrzeit(z)}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                    <p className="m-mini">
                      15-Minuten-Raster — so passt auch ein Barttermin dazwischen.
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
          </div>

          <button
            type="button"
            className="m-knopf m-knopf-dunkel m-knopf-block"
            disabled={!kontaktOk}
            onClick={() => setSchritt(5)}
          >
            Termin buchen
          </button>
          <p className="m-mini" style={{ textAlign: "center" }}>
            Kostenlos · jederzeit selbst absagbar
          </p>
        </>
      ) : null}

      {/* 5 — Fertig */}
      {schritt === 5 ? (
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
              <dd>{dienst?.name}</dd>
            </div>
            <div>
              <dt>Wann</dt>
              <dd className="m-num">
                {datumText} · {uhrzeit}
              </dd>
            </div>
            <div>
              <dt>Bei</dt>
              <dd>{mitarbeiterId === "egal" ? mitarbeiterName : `[${mitarbeiterName}]`}</dd>
            </div>
            <div>
              <dt>Auf den Namen</dt>
              <dd>{name}</dd>
            </div>
            <div>
              <dt>Dauer</dt>
              <dd className="m-num">
                {dienst?.minuten} Min. · {dienst ? preis(dienst.preisCent) : ""}
              </dd>
            </div>
          </dl>

          <p className="m-demo-notiz">
            <span style={{ flex: "none", color: "var(--messing-tief)", marginTop: 1 }}>
              <Icon name="kalender" size={16} />
            </span>
            <span>
              <strong>Vorführ-Ansicht.</strong> Der Termin wurde noch nicht gespeichert und es
              ging keine Mail raus. Genau hier wird der Terminassistent angeschlossen:
              echte freie Zeiten, Bestätigung per Mail, Erinnerung am Vortag und
              Selbst-Absage über einen Link.
            </span>
          </p>

          <button type="button" className="m-knopf m-knopf-linie m-knopf-block" onClick={neuStarten}>
            Nochmal ansehen
          </button>
        </div>
      ) : null}
    </div>
  );
}
