/**
 * Icon-Satz der Milano-Seite: alle im 24er-Raster, Strichstärke 1,5.
 * Bewusst gezeichnet statt Emoji — so skalieren sie und nehmen die
 * Textfarbe an.
 */
export type IconName =
  | "schere"
  | "fade"
  | "bart"
  | "messer"
  | "rasur"
  | "kind"
  | "brauen"
  | "telefon"
  | "kalender"
  | "pin"
  | "stern"
  | "pfeil-rechts"
  | "pfeil-links"
  | "chevron-unten"
  | "haken"
  | "instagram"
  | "menu"
  | "schliessen"
  | "person"
  | "bild"
  | "globus";

const PFADE: Record<IconName, React.ReactNode> = {
  schere: (
    <>
      <circle cx="6" cy="6" r="2.6" />
      <circle cx="6" cy="18" r="2.6" />
      <path d="M20 4 8.1 16.4M8.1 7.6 20 20" />
    </>
  ),
  fade: <path d="M4 6h16M6 11h12M8 16h8M10 20h4" />,
  bart: (
    <>
      <path d="M4 14c0-3 2-5 4-5.5M20 14c0-3-2-5-4-5.5" />
      <path d="M8 8.5a4 4 0 0 1 8 0" />
      <path d="M5 14h14v2a7 7 0 0 1-14 0z" />
    </>
  ),
  messer: (
    <>
      <path d="M3 17.5 13.5 7l3.5 3.5L6.5 21H3z" />
      <path d="m15.5 5 3.5-3.5L22.5 5 19 8.5z" />
    </>
  ),
  rasur: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 5V3M5.6 7 4.2 5.6M18.4 7l1.4-1.4" />
    </>
  ),
  kind: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  brauen: <path d="M3.5 9c2.5-3 6-3 8 0M12.5 15c2-3 5.5-3 8 0" />,
  telefon: (
    <path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 6.2 2 2 0 0 1 5 4z" />
  ),
  kalender: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 10h18" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  stern: <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z" />,
  "pfeil-rechts": <path d="m9 6 6 6-6 6" />,
  "pfeil-links": <path d="m15 6-6 6 6 6" />,
  "chevron-unten": <path d="m6 9 6 6 6-6" />,
  haken: <path d="m5 13 4.5 4.5L19 7" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  schliessen: <path d="M18 6 6 18M6 6l12 12" />,
  person: (
    <>
      <circle cx="12" cy="9" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  bild: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m3 17 5-4 4 3 3-2 6 5" />
    </>
  ),
  globus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  gefuellt = false,
}: {
  name: IconName;
  size?: number;
  /** Für den Stern: Fläche statt Kontur. */
  gefuellt?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={gefuellt ? "currentColor" : "none"}
      stroke={gefuellt ? "none" : "currentColor"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PFADE[name]}
    </svg>
  );
}

/** Fünf gefüllte Sterne — für Bewertungskarten. */
export function Sterne({ size = 13 }: { size?: number }) {
  return (
    <span className="m-sterne" aria-label="5 von 5 Sternen">
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="stern" size={size} gefuellt />
      ))}
    </span>
  );
}
