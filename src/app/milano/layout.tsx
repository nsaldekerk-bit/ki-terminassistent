import type { Metadata } from "next";
import Link from "next/link";
import { Bodoni_Moda, Geist } from "next/font/google";
import { Header } from "@/components/milano/Header";
import { Assistant } from "@/components/milano/Assistant";
import { Icon } from "@/components/milano/Icon";
import { salon } from "@/lib/milano/content";
import "./milano.css";

// next/font lädt die Schriften zur Bauzeit herunter und liefert sie vom
// eigenen Server aus. Der Besucher baut also keine Verbindung zu Google
// auf — das erspart uns beim Datenschutz eine ganze Diskussion.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--milano-display",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--milano-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${salon.name} Geldern — Termin online buchen | Herren & Bart`,
  description: `Friseur in Geldern: Fade, Bart und der klassische Schnitt. ${salon.bewertung} Sterne aus ${salon.bewertungenAnzahl} Google-Bewertungen. ${salon.strasse}, ${salon.plz} ${salon.ort}.`,
  // Die Seite ist ein Entwurf und läuft nur lokal. Der Ausschluss ist die
  // Versicherung dagegen, dass ein späteres Deployment versehentlich in
  // den Index rutscht.
  robots: { index: false, follow: false },
};

export default function MilanoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`milano ${bodoni.variable} ${geist.variable}`}>
      <div className="m-demoband">
        <div className="m-container">
          <span className="m-demoband-pol" aria-hidden="true" />
          <span>
            Entwurf von westfaliadigital · keine offizielle Seite von {salon.name}
          </span>
        </div>
      </div>

      <Header />

      <main>{children}</main>

      <footer className="m-footer">
        <div className="m-container">
          <div className="m-footer-grid">
            <div className="m-footer-spalte">
              <span className="m-brand" style={{ marginBottom: 6 }}>
                <span className="m-brand-name m-display">{salon.kurz}</span>
                <span className="m-brand-sub">Friseur · Geldern</span>
              </span>
              <span>
                {salon.strasse}, {salon.plz} {salon.ort}
              </span>
              <a href={`tel:${salon.telefonLink}`} className="m-num">
                {salon.telefon}
              </a>
              <a href={salon.instagramUrl} target="_blank" rel="noreferrer noopener">
                @{salon.instagram}
              </a>
            </div>

            <div className="m-footer-spalte">
              <span className="m-eyebrow" style={{ marginBottom: 4 }}>
                Seite
              </span>
              <Link href="/milano/leistungen">Leistungen</Link>
              <Link href="/milano#team">Team</Link>
              <Link href="/milano#arbeiten">Arbeiten</Link>
              <Link href="/milano/termin">Termin</Link>
            </div>

            <div className="m-footer-spalte">
              <span className="m-eyebrow" style={{ marginBottom: 4 }}>
                Rechtliches
              </span>
              <Link href="/milano/impressum">Impressum</Link>
              <Link href="/milano/datenschutz">Datenschutz</Link>
            </div>
          </div>

          <p className="m-footer-fuss">
            <span className="m-tri" aria-hidden="true" />
            Website von westfaliadigital · Entwurf, nicht veröffentlicht
          </p>
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
