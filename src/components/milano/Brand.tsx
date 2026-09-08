/**
 * Bildmarke des Salons.
 *
 * Der Stil folgt der Referenz: reines Schwarz-Weiß, keine Goldakzente,
 * dünne Linien. Das Monogramm nimmt über currentColor die Farbe seiner
 * Umgebung an — auf Weiß erscheint es schwarz, im dunklen Footer weiß.
 *
 * Weil uns Salonfotos fehlen, steht es überall dort, wo später ein Bild
 * hinkommt: im Karussell, in den Karten, im Bilderstreifen.
 */

export function Monogramm({ size = 96, strich = 1 }: { size?: number; strich?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth={strich} opacity="0.55" />
      <circle cx="60" cy="60" r="49" stroke="currentColor" strokeWidth={strich * 0.6} opacity="0.3" />

      {/* Kamm */}
      <g stroke="currentColor" strokeWidth={strich * 1.1} strokeLinecap="round" opacity="0.9">
        <path d="M35 77 L77 43" />
        <path d="M37.4 80.2 L40.8 75.6M41.8 82.7 L45.2 78.1M46.2 85.2 L49.6 80.6" />
      </g>

      {/* Rasiermesser */}
      <g stroke="currentColor" strokeWidth={strich * 1.1} strokeLinejoin="round" opacity="0.9">
        <path d="M85 77 L48 44 44 49 81 82z" />
        <path d="M83 79 L90 85" strokeLinecap="round" />
      </g>

      <text
        x="60"
        y="52"
        textAnchor="middle"
        fill="currentColor"
        style={{ font: "300 38px var(--milano-display), sans-serif", letterSpacing: "0.06em" }}
      >
        M
      </text>
    </svg>
  );
}

/** Wortmarke: gesperrte Versalien mit Handschrift darunter — wie in der Referenz. */
export function Wortmarke({ klein = false }: { klein?: boolean }) {
  return (
    <span className={`m-wortmarke ${klein ? "m-wortmarke-klein" : ""}`}>
      <span className="m-wortmarke-name">MILANO FRISEUR</span>
      <span className="m-signatur">Geldern</span>
    </span>
  );
}

/** Handschriftzeile, etwa für den Footer. */
export function Signatur({ children }: { children: React.ReactNode }) {
  return <span className="m-signatur m-signatur-gross">{children}</span>;
}
