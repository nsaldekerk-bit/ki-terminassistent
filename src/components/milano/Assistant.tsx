"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * Der Chat-Assistent — er antwortet wirklich.
 *
 * Die Antworten kommen aus /api/milano/assistent und damit aus den eigenen
 * Daten des Salons: Öffnungszeiten, Preise, Leistungen, Anfahrt. Was der
 * Inhaber uns noch nicht gesagt hat, erfindet er nicht, sondern verweist
 * ans Telefon.
 *
 * Im Ausbau tritt an diese Stelle das Widget aus /embed/<mandant>, das
 * dieselben Daten an das Sprachmodell gibt und frei formuliert antwortet.
 * Die Oberfläche hier bleibt dabei, wie sie ist.
 */

interface Antwort {
  text: string;
  vorschlaege: string[];
  link?: { text: string; href: string };
}

interface Zeile {
  id: number;
  von: "gast" | "milano";
  text: string;
  link?: { text: string; href: string };
}

const START: Zeile = {
  id: 0,
  von: "milano",
  text: "Hallo! Frag mich nach Preisen, Öffnungszeiten oder freien Terminen — oder buch direkt.",
};

const START_VORSCHLAEGE = ["Termin buchen", "Wann habt ihr offen?", "Was kostet ein Fade?"];

export function Assistant() {
  const [offen, setOffen] = useState(false);
  const [zeilen, setZeilen] = useState<Zeile[]>([START]);
  const [vorschlaege, setVorschlaege] = useState<string[]>(START_VORSCHLAEGE);
  const [eingabe, setEingabe] = useState("");
  const [tippt, setTippt] = useState(false);

  const verlauf = useRef<HTMLDivElement>(null);
  const feld = useRef<HTMLInputElement>(null);
  const zaehler = useRef(1);

  // Immer ans Ende scrollen, sonst steht die neue Antwort unter dem Rand.
  useEffect(() => {
    const el = verlauf.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [zeilen, tippt]);

  useEffect(() => {
    if (offen) feld.current?.focus();
  }, [offen]);

  async function fragen(frage: string) {
    const text = frage.trim();
    if (!text || tippt) return;

    setZeilen((z) => [...z, { id: zaehler.current++, von: "gast", text }]);
    setEingabe("");
    setVorschlaege([]);
    setTippt(true);

    try {
      const antwort = await fetch("/api/milano/assistent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frage: text }),
      });
      const daten: Antwort = await antwort.json();

      // Kurz warten, damit die Antwort nicht im selben Lidschlag steht —
      // ohne die Pause wirkt sie wie ein vorgefertigter Text.
      await new Promise((fertig) => setTimeout(fertig, 320));

      setZeilen((z) => [
        ...z,
        { id: zaehler.current++, von: "milano", text: daten.text, link: daten.link },
      ]);
      setVorschlaege(daten.vorschlaege ?? []);
    } catch {
      setZeilen((z) => [
        ...z,
        {
          id: zaehler.current++,
          von: "milano",
          text: "Da komme ich gerade nicht durch. Läuft der Server noch?",
        },
      ]);
    } finally {
      setTippt(false);
    }
  }

  return (
    <div className="m-assistent">
      {offen ? (
        <div className="m-assistent-panel" role="dialog" aria-label="Milano Assistent">
          <div className="m-assistent-kopf">
            <span className="m-assistent-avatar" aria-hidden="true">
              M
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 500 }}>Milano Assistent</span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.72rem",
                  color: "var(--text-grau)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--gruen)",
                    display: "inline-block",
                  }}
                />
                antwortet sofort
              </span>
            </span>
            <button
              type="button"
              onClick={() => setOffen(false)}
              aria-label="Assistent schließen"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-grau)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="schliessen" size={18} />
            </button>
          </div>

          <div className="m-assistent-verlauf" ref={verlauf}>
            {zeilen.map((z) => (
              <div key={z.id} className={z.von === "gast" ? "m-blase-gast" : "m-blase"}>
                {z.text}
                {z.link ? (
                  <a
                    className="m-blase-knopf"
                    href={z.link.href}
                    target={z.link.href.startsWith("http") ? "_blank" : undefined}
                    rel={z.link.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {z.link.text}
                    <Icon name="pfeil-rechts" size={14} />
                  </a>
                ) : null}
              </div>
            ))}

            {tippt ? (
              <div className="m-blase m-blase-tippt" aria-label="schreibt gerade">
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>

          {vorschlaege.length > 0 ? (
            <div className="m-assistent-chips">
              {vorschlaege.map((frage) => (
                <button key={frage} type="button" onClick={() => fragen(frage)}>
                  {frage}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="m-assistent-eingabe"
            onSubmit={(e) => {
              e.preventDefault();
              void fragen(eingabe);
            }}
          >
            <input
              ref={feld}
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              placeholder="Frag etwas …"
              aria-label="Frage an den Assistenten"
              maxLength={500}
            />
            <button type="submit" disabled={!eingabe.trim() || tippt} aria-label="Senden">
              <Icon name="pfeil-rechts" size={17} />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="m-assistent-knopf"
        onClick={() => setOffen((o) => !o)}
        aria-label={offen ? "Assistent schließen" : "Assistent öffnen"}
      >
        <Icon name={offen ? "schliessen" : "mail"} size={20} />
      </button>
    </div>
  );
}
