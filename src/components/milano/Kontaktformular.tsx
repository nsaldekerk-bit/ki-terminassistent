"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { salon } from "@/lib/milano/content";

/**
 * Kontaktformular. Es tut wirklich etwas: Die Nachricht landet im
 * Postausgang unter /milano/salon, damit im Gespräch sichtbar ist, wo
 * eine Anfrage ankommt. Verschickt wird in der Vorführung nichts.
 */
export function Kontaktformular() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [text, setText] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [fertig, setFertig] = useState(false);

  const bereit = name.trim().length > 1 && text.trim().length > 4;

  async function senden(e: React.FormEvent) {
    e.preventDefault();
    if (!bereit || sendet) return;
    setSendet(true);
    setFehler(null);
    try {
      const antwort = await fetch("/api/milano/nachricht", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          telefon: telefon.trim(),
          text: text.trim(),
        }),
      });
      const daten = await antwort.json().catch(() => ({}));
      if (!antwort.ok) {
        setFehler(daten.fehler ?? "Das hat gerade nicht geklappt.");
        return;
      }
      setFertig(true);
    } catch {
      setFehler("Keine Verbindung zum Server.");
    } finally {
      setSendet(false);
    }
  }

  if (fertig) {
    return (
      <div className="m-book">
        <div className="m-book-fertig">
          <span className="m-book-haken" aria-hidden="true">
            <Icon name="haken" size={30} />
          </span>
          <h3 className="m-titel m-titel-m" style={{ margin: 0 }}>
            Angekommen.
          </h3>
          <p className="m-fliess" style={{ textAlign: "center", margin: 0 }}>
            Der Laden meldet sich, sobald jemand Zeit hat. Wenn es eilig ist, geht Anrufen
            schneller: <span className="m-num">{salon.telefon}</span>
          </p>
          <p className="m-demo-notiz">
            <span style={{ flex: "none", color: "var(--text-grau)", marginTop: 1 }}>
              <Icon name="mail" size={16} />
            </span>
            <span>
              <strong>Vorführ-Ansicht.</strong> Die Nachricht liegt im Postausgang unter{" "}
              <a href="/milano/salon" style={{ borderBottom: "1px solid currentColor" }}>
                /milano/salon
              </a>{" "}
              — verschickt wurde nichts.
            </span>
          </p>
          <button
            type="button"
            className="m-knopf m-knopf-linie m-knopf-block"
            onClick={() => {
              setFertig(false);
              setName("");
              setEmail("");
              setTelefon("");
              setText("");
            }}
          >
            Noch eine Nachricht
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="m-book" onSubmit={senden}>
      {fehler ? (
        <p className="m-book-fehler" role="alert">
          {fehler}
        </p>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="m-feld">
          <label htmlFor="k-name">Name</label>
          <input
            id="k-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Vor- und Nachname"
          />
        </div>
        <div className="m-feld">
          <label htmlFor="k-mail">E-Mail</label>
          <input
            id="k-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="name@beispiel.de"
          />
        </div>
        <div className="m-feld">
          <label htmlFor="k-tel">Telefon</label>
          <input
            id="k-tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="0151 …"
          />
        </div>
        <div className="m-feld">
          <label htmlFor="k-text">Nachricht</label>
          <textarea
            id="k-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Worum geht es?"
          />
        </div>
      </div>

      <button
        type="submit"
        className="m-knopf m-knopf-dunkel m-knopf-block"
        disabled={!bereit || sendet}
      >
        {sendet ? "Einen Moment …" : "Nachricht senden"}
      </button>
      <p className="m-mini" style={{ textAlign: "center" }}>
        E-Mail oder Telefonnummer bitte angeben — sonst kann der Laden nicht antworten.
      </p>
    </form>
  );
}
