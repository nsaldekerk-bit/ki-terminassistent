"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { leistungen, preis, team, TEAM_BESTAETIGT } from "@/lib/milano/content";

/**
 * Die Innenansicht des Salons: was gebucht wurde und was rausgegangen
 * wäre. Sie ist absichtlich schlicht — im Ausbau ist das der bestehende
 * Mandanten-Bereich des Terminassistenten, hier geht es nur darum, im
 * Gespräch zeigen zu können, dass hinten wirklich etwas ankommt.
 */

interface Termin {
  code: string;
  leistungId: string;
  mitarbeiterId: string;
  datum: string;
  von: string;
  minuten: number;
  name: string;
  telefon: string;
  email: string;
  notiz: string;
  status: "gebucht" | "abgesagt";
  gebuchtAm: string;
  abgesagtVon: "gast" | "salon" | null;
}

interface Nachricht {
  id: string;
  art: "bestaetigung" | "salon-info" | "erinnerung" | "absage" | "anfrage";
  an: string;
  betreff: string;
  text: string;
  faelligAm: string;
  verschicktAm: string | null;
  terminCode: string;
}

const ART_NAME: Record<Nachricht["art"], string> = {
  bestaetigung: "Bestätigung an den Gast",
  "salon-info": "Benachrichtigung an den Salon",
  erinnerung: "Erinnerung am Vortag",
  absage: "Absage",
  anfrage: "Nachricht über das Kontaktformular",
};

function langesDatum(datum: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${datum}T12:00:00Z`));
}

export function SalonAnsicht() {
  const [termine, setTermine] = useState<Termin[] | null>(null);
  const [post, setPost] = useState<Nachricht[]>([]);
  const [offen, setOffen] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [arbeitet, setArbeitet] = useState(false);

  // `stand` hochzählen heißt: neu laden. Der Effekt setzt selbst nichts
  // synchron, sondern erst in der Antwort — sonst rendert die Seite zweimal
  // im selben Durchgang.
  const [stand, setStand] = useState(0);

  useEffect(() => {
    let abgebrochen = false;

    void (async () => {
      try {
        const antwort = await fetch("/api/milano/salon", { cache: "no-store" });
        const daten = await antwort.json();
        if (abgebrochen) return;
        setTermine(daten.termine ?? []);
        setPost(daten.postausgang ?? []);
      } catch {
        if (!abgebrochen) setTermine([]);
      }
    })();

    return () => {
      abgebrochen = true;
    };
  }, [stand]);

  async function befehl(aktion: "verschicken" | "absagen" | "zuruecksetzen", code?: string) {
    setArbeitet(true);
    setMeldung(null);
    try {
      const antwort = await fetch("/api/milano/salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktion, code }),
      });
      const daten = await antwort.json();
      if (aktion === "verschicken") {
        setMeldung(
          daten.verschickt > 0
            ? `${daten.verschickt} Nachricht${daten.verschickt === 1 ? "" : "en"} rausgegangen.`
            : "Gerade ist nichts fällig.",
        );
      }
      if (aktion === "zuruecksetzen") setMeldung("Alles zurückgesetzt.");
      setStand((v) => v + 1);
    } finally {
      setArbeitet(false);
    }
  }

  if (termine === null) {
    return <p className="m-mini">Wird geladen …</p>;
  }

  const kommend = termine
    .filter((t) => t.status === "gebucht")
    .sort((a, b) => `${a.datum} ${a.von}`.localeCompare(`${b.datum} ${b.von}`));
  const abgesagt = termine.filter((t) => t.status === "abgesagt");
  const offeneNachrichten = post.filter((n) => n.verschicktAm === null);

  // Nach Tag gruppieren, damit die Liste aussieht wie ein Terminbuch.
  const tage: { datum: string; termine: Termin[] }[] = [];
  for (const t of kommend) {
    const letzter = tage[tage.length - 1];
    if (letzter && letzter.datum === t.datum) letzter.termine.push(t);
    else tage.push({ datum: t.datum, termine: [t] });
  }

  return (
    <div className="m-salon">
      <div className="m-salon-zahlen">
        <div>
          <strong className="m-num">{kommend.length}</strong>
          <span>{kommend.length === 1 ? "offener Termin" : "offene Termine"}</span>
        </div>
        <div>
          <strong className="m-num">{offeneNachrichten.length}</strong>
          <span>Nachrichten stehen aus</span>
        </div>
        <div>
          <strong className="m-num">{abgesagt.length}</strong>
          <span>abgesagt</span>
        </div>
      </div>

      <div className="m-salon-knoepfe">
        <button
          type="button"
          className="m-knopf m-knopf-dunkel"
          disabled={arbeitet}
          onClick={() => befehl("verschicken")}
        >
          Fällige Nachrichten verschicken
        </button>
        <button
          type="button"
          className="m-knopf m-knopf-linie"
          disabled={arbeitet}
          onClick={() => befehl("zuruecksetzen")}
        >
          Demo zurücksetzen
        </button>
      </div>

      {meldung ? <p className="m-salon-meldung">{meldung}</p> : null}

      <h2 className="m-titel m-titel-m m-salon-h">Terminbuch</h2>

      {tage.length === 0 ? (
        <p className="m-fliess" style={{ margin: 0 }}>
          Noch nichts gebucht. Leg auf{" "}
          <Link href="/milano/termin" style={{ borderBottom: "1px solid currentColor" }}>
            /milano/termin
          </Link>{" "}
          einen Termin an — er taucht hier sofort auf.
        </p>
      ) : (
        tage.map((tag) => (
          <div key={tag.datum} className="m-salon-tag">
            <h3>{langesDatum(tag.datum)}</h3>
            {tag.termine.map((t) => {
              const l = leistungen.find((s) => s.id === t.leistungId);
              const m = team.find((s) => s.id === t.mitarbeiterId);
              return (
                <div key={t.code} className="m-salon-termin">
                  <span className="m-salon-zeit m-num">{t.von}</span>
                  <span className="m-salon-inhalt">
                    <strong>{t.name}</strong>
                    <span className="m-mini">
                      {l?.name} · {t.minuten} Min.
                      {l ? ` · ${preis(l.preisCent)}` : ""} ·{" "}
                      {TEAM_BESTAETIGT ? (m?.name ?? "") : `[${m?.name ?? ""}]`}
                    </span>
                    <span className="m-mini m-num">
                      {t.telefon}
                      {t.email ? ` · ${t.email}` : ""}
                    </span>
                    {t.notiz ? <span className="m-mini">„{t.notiz}“</span> : null}
                  </span>
                  <span className="m-salon-aktion">
                    <Link href={`/milano/termin/${t.code}`} className="m-num" title="Gastansicht">
                      {t.code}
                    </Link>
                    <button
                      type="button"
                      disabled={arbeitet}
                      onClick={() => befehl("absagen", t.code)}
                    >
                      absagen
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        ))
      )}

      <h2 className="m-titel m-titel-m m-salon-h">Postausgang</h2>
      <p className="m-mini" style={{ marginTop: -8 }}>
        In der Vorführung wird nichts verschickt — hier steht, was rausgegangen wäre.
        Aufklappen zeigt den vollständigen Text.
      </p>

      {post.length === 0 ? (
        <p className="m-fliess" style={{ margin: 0 }}>
          Noch keine Nachrichten.
        </p>
      ) : (
        <div className="m-salon-post">
          {[...post].reverse().map((n) => (
            <div key={n.id} className="m-salon-brief">
              <button
                type="button"
                onClick={() => setOffen(offen === n.id ? null : n.id)}
                aria-expanded={offen === n.id}
              >
                <span className="m-salon-brief-kopf">
                  <span
                    className={`m-salon-marke ${n.verschicktAm ? "m-salon-marke-raus" : ""}`}
                  >
                    {n.verschicktAm ? "raus" : "steht aus"}
                  </span>
                  <span>{ART_NAME[n.art]}</span>
                </span>
                <span className="m-mini">
                  an {n.an} · fällig {n.faelligAm}
                </span>
                <span className="m-salon-betreff">{n.betreff}</span>
              </button>
              {offen === n.id ? <pre className="m-salon-text">{n.text}</pre> : null}
            </div>
          ))}
        </div>
      )}

      {abgesagt.length > 0 ? (
        <>
          <h2 className="m-titel m-titel-m m-salon-h">Abgesagt</h2>
          <div className="m-salon-post">
            {abgesagt.map((t) => (
              <p key={t.code} className="m-mini" style={{ margin: 0 }}>
                <span className="m-num">{t.code}</span> · {t.name} ·{" "}
                {langesDatum(t.datum)}, {t.von} Uhr · abgesagt vom{" "}
                {t.abgesagtVon === "salon" ? "Salon" : "Gast"}
              </p>
            ))}
          </div>
        </>
      ) : null}

      <p className="m-demo-notiz" style={{ marginTop: 30 }}>
        <span style={{ flex: "none", color: "var(--text-grau)", marginTop: 1 }}>
          <Icon name="kalender" size={16} />
        </span>
        <span>
          Alles hier liegt in <span className="m-num">.milano-demo/daten.json</span> im
          Projektordner — kein Server, keine Datenbank, nichts verlässt diesen Rechner.
          Im Ausbau übernimmt das der Terminassistent mit echtem Mailversand.
        </span>
      </p>
    </div>
  );
}
