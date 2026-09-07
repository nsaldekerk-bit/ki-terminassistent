"use client";

import { useEffect, useState } from "react";

/**
 * Umschalter zwischen den beiden Gestaltungsrichtungen.
 *
 * Nur für die Vorführung gedacht: Damit lassen sich „Noir" (dunkel,
 * Barbershop) und „Studio" (hell, modern) im Gespräch direkt
 * gegenüberstellen, ohne die Seite neu zu laden. Sobald die Richtung
 * entschieden ist, fliegt der Schalter raus und der Gewinner wird zum
 * einzigen Stil.
 */
const STILE = [
  { id: "noir", label: "Noir" },
  { id: "studio", label: "Studio" },
] as const;

type Stil = (typeof STILE)[number]["id"];
const SPEICHER = "milano-stil";

export function StilUmschalter() {
  const [stil, setStil] = useState<Stil>("noir");

  // Gespeicherte Wahl übernehmen, sobald der Browser übernimmt.
  useEffect(() => {
    let gewaehlt: Stil = "noir";
    try {
      const gespeichert = localStorage.getItem(SPEICHER);
      if (gespeichert === "studio" || gespeichert === "noir") gewaehlt = gespeichert;
    } catch {
      // Privates Fenster o. Ä. — dann bleibt es beim Standard.
    }
    setStil(gewaehlt);
  }, []);

  useEffect(() => {
    document.querySelector<HTMLElement>(".milano")?.setAttribute("data-stil", stil);
    try {
      localStorage.setItem(SPEICHER, stil);
    } catch {
      // Nicht schlimm — die Wahl gilt dann nur für diesen Besuch.
    }
  }, [stil]);

  return (
    <span className="m-stilwahl" role="group" aria-label="Gestaltungsrichtung">
      {STILE.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={stil === s.id}
          onClick={() => setStil(s.id)}
        >
          {s.label}
        </button>
      ))}
    </span>
  );
}
