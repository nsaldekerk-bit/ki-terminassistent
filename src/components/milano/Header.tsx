"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import { salon } from "@/lib/milano/content";

const NAV = [
  { href: "/milano/leistungen", label: "Leistungen" },
  { href: "/milano#team", label: "Team" },
  { href: "/milano#arbeiten", label: "Arbeiten" },
  { href: "/milano#anfahrt", label: "Anfahrt" },
];

export function Header() {
  const [offen, setOffen] = useState(false);

  return (
    <header className="m-header">
      <div className="m-container m-header-inner">
        <Link href="/milano" className="m-brand" onClick={() => setOffen(false)}>
          <span className="m-brand-name m-display">{salon.kurz}</span>
          <span className="m-brand-sub">Friseur · Geldern</span>
        </Link>

        <nav className="m-nav" aria-label="Hauptnavigation">
          {NAV.map((eintrag) => (
            <Link key={eintrag.href} href={eintrag.href}>
              {eintrag.label}
            </Link>
          ))}
        </nav>

        <div className="m-header-actions">
          <a
            className="m-icon-btn"
            href={`tel:${salon.telefonLink}`}
            aria-label={`Anrufen: ${salon.telefon}`}
          >
            <Icon name="telefon" size={18} />
          </a>

          <Link href="/milano/termin" className="m-btn m-btn-primary m-header-cta">
            Termin buchen
          </Link>

          <button
            type="button"
            className="m-icon-btn m-nur-mobil"
            aria-expanded={offen}
            aria-controls="milano-menue"
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setOffen((v) => !v)}
          >
            <Icon name={offen ? "schliessen" : "menu"} size={18} />
          </button>
        </div>
      </div>

      {offen ? (
        <div className="m-menu" id="milano-menue">
          <div className="m-container">
            <ul>
              {NAV.map((eintrag) => (
                <li key={eintrag.href}>
                  <Link href={eintrag.href} onClick={() => setOffen(false)}>
                    {eintrag.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/milano/termin" onClick={() => setOffen(false)}>
                  Termin buchen
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}
