"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const FRAGEN = ["Termin buchen", "Habt ihr Samstag offen?", "Was kostet ein Fade?"];

/**
 * Der Chat-Assistent als Vorschau. Im fertigen Ausbau sitzt hier das
 * bestehende Widget aus /embed/<mandant> im iframe — für die Demo genügt
 * die Oberfläche, damit im Gespräch sichtbar ist, wo der Assistent lebt.
 */
export function Assistant() {
  const [offen, setOffen] = useState(false);

  return (
    <div className="m-assistent">
      {offen ? (
        <div className="m-assistent-panel">
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
                  color: "var(--text-leise)",
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
                color: "var(--text-leise)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="schliessen" size={18} />
            </button>
          </div>

          <p className="m-blase">Hallo! Termin buchen oder erst eine Frage?</p>

          <div className="m-assistent-chips">
            {FRAGEN.map((frage) => (
              <span key={frage}>{frage}</span>
            ))}
          </div>

          <p className="m-hinweis" style={{ marginTop: 2 }}>
            Vorschau — der Assistent wird im nächsten Schritt angeschlossen.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="m-assistent-knopf"
        aria-expanded={offen}
        aria-label={offen ? "Assistent schließen" : "Assistent öffnen"}
        onClick={() => setOffen((v) => !v)}
      >
        <Icon name={offen ? "schliessen" : "kalender"} size={24} />
      </button>
    </div>
  );
}
