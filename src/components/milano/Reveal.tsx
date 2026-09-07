"use client";

import { useEffect } from "react";

/**
 * Blendet Abschnitte beim Heranscrollen sanft ein.
 *
 * Die Klasse, die das Verstecken auslöst, setzt erst dieses Skript — ohne
 * JavaScript bleibt also alles sichtbar statt unsichtbar. Wer
 * Bewegung reduziert hat, bekommt gar nichts davon zu sehen.
 */
export function Reveal() {
  useEffect(() => {
    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig || !("IntersectionObserver" in window)) return;

    const wurzel = document.querySelector(".milano");
    if (!wurzel) return;
    wurzel.classList.add("js-reveal");

    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const e of eintraege) {
          if (e.isIntersecting) {
            e.target.classList.add("ist-da");
            beobachter.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    for (const el of wurzel.querySelectorAll("[data-reveal]")) beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  return null;
}
