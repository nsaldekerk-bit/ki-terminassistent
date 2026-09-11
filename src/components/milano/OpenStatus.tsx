"use client";

import { useEffect, useState } from "react";
import { status, type Status } from "@/lib/milano/hours";
import { ZEITEN_BESTAETIGT } from "@/lib/milano/content";

/**
 * Zeigt live, ob gerade geöffnet ist. Die Berechnung läuft erst nach dem
 * Mounten im Browser: Server und Client würden sonst zu unterschiedlichen
 * Sekunden rechnen und React meldete eine Hydration-Abweichung. Bis dahin
 * steht ein neutraler Text, damit nichts springt.
 *
 * Solange die echten Öffnungszeiten fehlen, wird die Uhrzeit in eckigen
 * Klammern gezeigt — die Aussage „jetzt geöffnet" beruht dann auf einer
 * Annahme und darf nicht wie eine Tatsache aussehen.
 */
export function OpenStatus() {
  const [jetzt, setJetzt] = useState<Status | null>(null);

  useEffect(() => {
    const nachziehen = () => setJetzt(status());
    // Einmal direkt nach dem Einhängen und danach jede Minute. Das erste
    // Nachziehen läuft bewusst nicht im Effektkörper selbst, sondern gleich
    // danach — sonst löst es eine zweite Renderrunde im selben Durchgang aus.
    const sofort = setTimeout(nachziehen, 0);
    const takt = setInterval(nachziehen, 60_000);
    return () => {
      clearTimeout(sofort);
      clearInterval(takt);
    };
  }, []);

  if (!jetzt) {
    return (
      <span className="m-status m-status-neutral">
        <span className="m-status-punkt" />
        Öffnungszeiten
      </span>
    );
  }

  const detail = ZEITEN_BESTAETIGT ? (
    jetzt.detail
  ) : (
    <span className="m-ph" style={{ color: "inherit", borderColor: "currentColor" }}>
      [{jetzt.detail}]
    </span>
  );

  return (
    <span className={`m-status ${jetzt.offen ? "m-status-offen" : "m-status-zu"}`}>
      <span className="m-status-punkt" />
      {jetzt.offen ? <>Jetzt geöffnet · {detail}</> : <>Geschlossen · {detail}</>}
    </span>
  );
}
