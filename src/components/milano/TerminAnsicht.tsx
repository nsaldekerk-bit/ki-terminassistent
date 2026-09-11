"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { leistungen, preis, salon, team, TEAM_BESTAETIGT } from "@/lib/milano/content";

/**
 * Ein gebuchter Termin, wie ihn der Gast über den Link aus der Bestätigung
 * sieht. Die Absage läuft wirklich durch: Sie ändert den Status, gibt den
 * Platz wieder frei und legt die Absagemails in den Postausgang.
 */

export interface TerminDaten {
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
  abgesagtVon: "gast" | "salon" | null;
}

function langesDatum(datum: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${datum}T12:00:00Z`));
}

export function TerminAnsicht({ termin: start }: { termin: TerminDaten }) {
  const [termin, setTermin] = useState(start);
  const [fragt, setFragt] = useState(false);
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const leistung = leistungen.find((l) => l.id === termin.leistungId);
  const mitarbeiter = team.find((m) => m.id === termin.mitarbeiterId);
  const abgesagt = termin.status === "abgesagt";

  async function absagen() {
    setSendet(true);
    setFehler(null);
    try {
      const antwort = await fetch(`/api/milano/termine/${termin.code}`, { method: "DELETE" });
      const daten = await antwort.json();
      if (!antwort.ok) {
        setFehler(daten.fehler ?? "Das hat nicht geklappt.");
        return;
      }
      setTermin(daten.termin);
      setFragt(false);
    } catch {
      setFehler("Keine Verbindung zum Server.");
    } finally {
      setSendet(false);
    }
  }

  return (
    <div className="m-book">
      <div className="m-book-fertig" style={{ paddingTop: 0 }}>
        <span
          className="m-book-haken"
          aria-hidden="true"
          style={abgesagt ? { background: "var(--grau-karte)", color: "var(--text-grau)" } : undefined}
        >
          <Icon name={abgesagt ? "schliessen" : "haken"} size={30} />
        </span>

        <h2 className="m-titel m-titel-m" style={{ margin: 0 }}>
          {abgesagt ? "Termin abgesagt." : "Termin steht."}
        </h2>

        {abgesagt ? (
          <p className="m-mini" style={{ textAlign: "center" }}>
            {termin.abgesagtVon === "salon"
              ? "Der Salon hat diesen Termin abgesagt."
              : "Der Platz ist wieder freigegeben. Es wird nichts berechnet."}
          </p>
        ) : null}

        <dl className="m-book-zusammenfassung">
          <div>
            <dt>Wann</dt>
            <dd className="m-num">
              {langesDatum(termin.datum)} · {termin.von} Uhr
            </dd>
          </div>
          <div>
            <dt>Leistung</dt>
            <dd>
              {leistung?.name} · {termin.minuten} Min.
              {leistung ? ` · ${preis(leistung.preisCent)}` : ""}
            </dd>
          </div>
          <div>
            <dt>Bei</dt>
            <dd>
              {TEAM_BESTAETIGT ? (mitarbeiter?.name ?? "") : `[${mitarbeiter?.name ?? ""}]`}
            </dd>
          </div>
          <div>
            <dt>Auf den Namen</dt>
            <dd>{termin.name}</dd>
          </div>
          {termin.notiz ? (
            <div>
              <dt>Anmerkung</dt>
              <dd>{termin.notiz}</dd>
            </div>
          ) : null}
          <div>
            <dt>Buchungsnummer</dt>
            <dd className="m-num">{termin.code}</dd>
          </div>
          <div>
            <dt>Wo</dt>
            <dd>
              {salon.strasse}, {salon.plz} {salon.ort}
            </dd>
          </div>
        </dl>

        {fehler ? (
          <p className="m-book-fehler" role="alert">
            {fehler}
          </p>
        ) : null}

        {abgesagt ? (
          <Link href="/milano/termin" className="m-knopf m-knopf-dunkel m-knopf-block">
            Neuen Termin buchen
          </Link>
        ) : fragt ? (
          <>
            <p className="m-mini" style={{ textAlign: "center" }}>
              Termin am {langesDatum(termin.datum)} um {termin.von} Uhr wirklich absagen?
            </p>
            <button
              type="button"
              className="m-knopf m-knopf-dunkel m-knopf-block"
              disabled={sendet}
              onClick={absagen}
            >
              {sendet ? "Einen Moment …" : "Ja, absagen"}
            </button>
            <button
              type="button"
              className="m-knopf m-knopf-linie m-knopf-block"
              onClick={() => setFragt(false)}
            >
              Doch nicht
            </button>
          </>
        ) : (
          <>
            <a
              href={`tel:${salon.telefonLink}`}
              className="m-knopf m-knopf-dunkel m-knopf-block"
            >
              Im Laden anrufen
            </a>
            <button
              type="button"
              className="m-knopf m-knopf-linie m-knopf-block"
              onClick={() => setFragt(true)}
            >
              Termin absagen
            </button>
            <p className="m-mini" style={{ textAlign: "center" }}>
              Zum Verschieben bitte absagen und neu buchen — oder kurz anrufen.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
