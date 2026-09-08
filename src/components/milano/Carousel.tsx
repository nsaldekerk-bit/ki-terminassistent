"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monogramm } from "./Brand";
import { OpenStatus } from "./OpenStatus";

/**
 * Karussell im Kopf der Seite — wie in der Vorlage: die mittlere Tafel
 * groß, die Nachbarn links und rechts angeschnitten, darunter Punkte.
 *
 * Wo später Salonfotos liegen, steht bis dahin eine dunkle Fläche mit dem
 * Monogramm. Die Tafeln behalten ihr Format, ein Foto tritt ohne weitere
 * Änderung an dieselbe Stelle.
 */

interface Folie {
  eyebrow: string;
  titel: React.ReactNode;
  knopf: { text: string; href: string };
}

const FOLIEN: Folie[] = [
  {
    eyebrow: "Barbershop in Geldern",
    titel: (
      <>
        Dein Signature Cut
        <br />
        by Milano.
      </>
    ),
    knopf: { text: "Leistungen & Preise", href: "/milano/leistungen" },
  },
  {
    eyebrow: "Fade · Bart · Klassiker",
    titel: (
      <>
        Sauberer Verlauf,
        <br />
        harte Kante.
      </>
    ),
    knopf: { text: "Termin Buchen", href: "/milano/termin" },
  },
  {
    eyebrow: "4,9 Sterne aus 33 Bewertungen",
    titel: (
      <>
        Die beste Frisur
        <br />
        in Geldern.
      </>
    ),
    knopf: { text: "Bewertungen Lesen", href: "/milano#bewertungen" },
  },
];

const N = FOLIEN.length;
/** Dreifach ausgegeben, damit links und rechts immer eine Tafel angeschnitten ist. */
const SPUR = [...FOLIEN, ...FOLIEN, ...FOLIEN];

export function Carousel() {
  // Start in der mittleren Kopie, damit es nach beiden Seiten weitergeht.
  const [i, setI] = useState(N);
  const [animiert, setAnimiert] = useState(true);

  // Langsamer Wechsel — steht still, sobald jemand Bewegung reduziert hat.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setI((v) => v + 1), 7000);
    return () => clearInterval(timer);
  }, []);

  // Am Ende der mittleren Kopie ohne Übergang zurückspringen — für den
  // Betrachter läuft die Schleife dadurch endlos weiter.
  useEffect(() => {
    if (i < 2 * N) return;
    const timer = setTimeout(() => {
      setAnimiert(false);
      setI((v) => v - N);
    }, 760);
    return () => clearTimeout(timer);
  }, [i]);

  useEffect(() => {
    if (animiert) return;
    const bild = requestAnimationFrame(() => setAnimiert(true));
    return () => cancelAnimationFrame(bild);
  }, [animiert]);

  const aktiv = ((i % N) + N) % N;

  return (
    <div className="m-kar">
      <div
        className={`m-kar-spur ${animiert ? "" : "m-kar-spur-still"}`}
        style={{ ["--i" as string]: String(i) }}
        aria-live="polite"
      >
        {SPUR.map((folie, index) => (
          <div className="m-slide" key={index} aria-hidden={index !== i}>
            <span className="m-slide-flaeche" aria-hidden="true">
              <Monogramm size={280} strich={0.8} />
            </span>

            <div className="m-slide-inhalt">
              {index % N === 0 ? <OpenStatus /> : null}
              <p className="m-eyebrow">{folie.eyebrow}</p>
              <h1 className="m-slide-titel">{folie.titel}</h1>
              <Link href={folie.knopf.href} className="m-knopf m-knopf-hell">
                {folie.knopf.text}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="m-punkte">
        {FOLIEN.map((folie, index) => (
          <button
            key={folie.eyebrow}
            type="button"
            className="m-punkt"
            aria-current={index === aktiv}
            aria-label={`Zu Bild ${index + 1} von ${N}`}
            onClick={() => setI(N + index)}
          />
        ))}
      </div>
    </div>
  );
}
