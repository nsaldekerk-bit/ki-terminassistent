/**
 * Bildmarke und Ornamente des Salons.
 *
 * Weil uns Fotos fehlen, trägt die Seite ihre Wirkung über gezeichnete
 * Elemente: ein Monogramm im Messingring, die Barbierstange, feine
 * Zierlinien. Alles als SVG — dadurch skaliert es verlustfrei und nimmt
 * die Textfarbe an.
 */

/** Monogramm: Doppelring, gekreuztes Rasiermesser und Kamm, darüber das M. */
export function Monogramm({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="m-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EBD9A6" />
          <stop offset="45%" stopColor="#C8A35A" />
          <stop offset="100%" stopColor="#8A6B2E" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="56" stroke="url(#m-gold)" strokeWidth="1.2" opacity="0.85" />
      <circle cx="60" cy="60" r="50" stroke="url(#m-gold)" strokeWidth="0.6" opacity="0.5" />

      {/* Kamm */}
      <g stroke="url(#m-gold)" strokeWidth="1.4" strokeLinecap="round">
        <path d="M34 78 L78 42" />
        <path d="M36.5 81.4 L40 76.6M41 84 L44.5 79.2M45.5 86.6 L49 81.8" />
      </g>

      {/* Rasiermesser */}
      <g stroke="url(#m-gold)" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M86 78 L48 44 44 49 82 83z" />
        <path d="M84 80 L92 86" strokeLinecap="round" />
      </g>

      {/* M */}
      <text
        x="60"
        y="52"
        textAnchor="middle"
        fill="url(#m-gold)"
        style={{ font: "400 40px var(--milano-display), Didot, serif", letterSpacing: "0.02em" }}
      >
        M
      </text>

      {/* Zierrauten */}
      <path d="M60 8.5l3 3-3 3-3-3z" fill="url(#m-gold)" />
      <path d="M60 105.5l3 3-3 3-3-3z" fill="url(#m-gold)" opacity="0.7" />
    </svg>
  );
}

/** Zierlinie mit Raute in der Mitte — trennt Abschnitte ohne harte Kante. */
export function Zierlinie({ breit = false }: { breit?: boolean }) {
  return (
    <span className={`m-zier ${breit ? "m-zier-breit" : ""}`} aria-hidden="true">
      <i />
      <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
        <path d="M4.5 0l4.5 4.5-4.5 4.5L0 4.5z" />
      </svg>
      <i />
    </span>
  );
}

/** Barbierstange — das eine Zeichen, das nur ein Friseurladen hat. */
export function Stange({ hoehe = 220 }: { hoehe?: number }) {
  return (
    <span className="m-stange" style={{ height: hoehe }} aria-hidden="true">
      <span className="m-stange-kappe" />
      <span className="m-stange-glas">
        <span className="m-stange-band" />
      </span>
      <span className="m-stange-kappe" />
    </span>
  );
}

/** Siegel mit der Google-Bewertung — ersetzt das übliche Sterne-Gedöns. */
export function Siegel({ wert, anzahl }: { wert: string; anzahl: number }) {
  return (
    <span className="m-siegel">
      <span className="m-siegel-ring" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
          <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
        </svg>
      </span>
      <span className="m-siegel-wert m-display">{wert}</span>
      <span className="m-siegel-text">
        aus {anzahl}
        <br />
        Bewertungen
      </span>
    </span>
  );
}

/** Eckmarken für Bildplätze und Tafeln. */
export function Ecken() {
  return (
    <>
      <span className="m-ecke m-ecke-lo" aria-hidden="true" />
      <span className="m-ecke m-ecke-ro" aria-hidden="true" />
      <span className="m-ecke m-ecke-lu" aria-hidden="true" />
      <span className="m-ecke m-ecke-ru" aria-hidden="true" />
    </>
  );
}
