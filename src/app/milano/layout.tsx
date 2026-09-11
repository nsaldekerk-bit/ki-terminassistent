import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Jost, Parisienne } from "next/font/google";
import { Header } from "@/components/milano/Header";
import { Assistant } from "@/components/milano/Assistant";
import { Reveal } from "@/components/milano/Reveal";
import { Signatur } from "@/components/milano/Brand";
import { Icon } from "@/components/milano/Icon";
import { oeffnungszeiten, salon, ZEITEN_BESTAETIGT } from "@/lib/milano/content";
import "./milano.css";

// next/font lädt die Schriften zur Bauzeit herunter und liefert sie vom
// eigenen Server aus. Der Besucher baut keine Verbindung zu Google auf —
// das erspart beim Datenschutz eine ganze Diskussion.
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--milano-display",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--milano-sans",
  display: "swap",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--milano-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${salon.name} Geldern — Termin online buchen | Herren & Bart`,
  description: `Friseur in Geldern: Fade, Bart und der klassische Schnitt. ${salon.bewertung} Sterne aus ${salon.bewertungenAnzahl} Google-Bewertungen. ${salon.strasse}, ${salon.plz} ${salon.ort}.`,
  // Der Entwurf läuft nur örtlich. Der Ausschluss ist die Versicherung
  // dagegen, dass ein späteres Deployment versehentlich in den Index rutscht.
  robots: { index: false, follow: false },
};

export default function MilanoLayout({ children }: { children: React.ReactNode }) {
  const zeitenText = ZEITEN_BESTAETIGT ? (
    "Mo–Sa nach Aushang"
  ) : (
    <span className="m-ph">
      [Mo–Fr {oeffnungszeiten.mo?.von}–{oeffnungszeiten.mo?.bis} / Sa{" "}
      {oeffnungszeiten.sa?.von}–{oeffnungszeiten.sa?.bis}]
    </span>
  );

  return (
    <div className={`milano ${jost.variable} ${geist.variable} ${parisienne.variable}`}>
      <Reveal />

      <div className="m-demoband">
        <div className="m-container">
          <span className="m-demoband-pol" aria-hidden="true" />
          <span>Entwurf von westfaliadigital · nicht veröffentlicht</span>
        </div>
      </div>

      <Header />

      <main>{children}</main>

      <footer className="m-footer" id="kontakt">
        <div className="m-container">
          <div className="m-footer-grid">
            <div className="m-footer-spalte">
              <span className="m-footer-titel">{salon.name}</span>
              <span className="m-footer-zeile">
                <Icon name="pin" size={15} />
                {salon.strasse} · {salon.plz} {salon.ort}
              </span>
              <a className="m-footer-zeile" href={`tel:${salon.telefonLink}`}>
                <Icon name="telefon" size={15} />
                <span className="m-num">{salon.telefon}</span>
              </a>
              <a
                className="m-footer-zeile"
                href={salon.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="instagram" size={15} />@{salon.instagram}
              </a>
              <span className="m-footer-zeile">
                <Icon name="uhr" size={15} />
                {zeitenText}
              </span>
            </div>

            <div className="m-footer-spalte">
              <span className="m-footer-titel">Services</span>
              <Link href="/milano/leistungen">Leistungen &amp; Preise</Link>
              <Link href="/milano#studio">Milano Studio</Link>
              <Link href="/milano/galerie">Galerie</Link>
              <Link href="/milano/termin">Termin buchen</Link>
              <Link href="/milano/kontakt">Kontakt</Link>
            </div>

            <div className="m-footer-spalte">
              <span className="m-footer-titel">Rechtliches</span>
              <Link href="/milano/impressum">Impressum</Link>
              <Link href="/milano/datenschutz">Datenschutz</Link>
              <a href={salon.mapsUrl} target="_blank" rel="noreferrer noopener">
                Anfahrt
              </a>
            </div>

            <div className="m-footer-spalte">
              <Signatur>Milano</Signatur>
              <p className="m-fliess" style={{ color: "var(--auf-dunkel-grau)" }}>
                Wo Handwerk auf Präzision trifft.
                <br />
                {salon.name} in {salon.ort}.
              </p>
            </div>
          </div>

          <div className="m-footer-unten">
            <a
              href={salon.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="m-footer-social"
              aria-label="Instagram"
            >
              <Icon name="instagram" size={16} />
            </a>
            <span>
              © {new Date().getFullYear()} {salon.name} · Entwurf von westfaliadigital, nicht
              veröffentlicht
            </span>
          </div>
        </div>
      </footer>

      <nav className="m-sticky" aria-label="Schnellzugriff">
        <a href={`tel:${salon.telefonLink}`}>
          <Icon name="telefon" size={15} />
          Anruf
        </a>
        <a href={salon.mapsUrl} target="_blank" rel="noreferrer noopener">
          <Icon name="pin" size={15} />
          Route
        </a>
        <Link href="/milano/termin" className="m-sticky-primary">
          Termin buchen
        </Link>
      </nav>

      <Assistant />
    </div>
  );
}
