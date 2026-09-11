"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import { Wortmarke } from "./Brand";
import { salon } from "@/lib/milano/content";

const NAV = [
  { href: "/milano/leistungen", label: "Leistungen & Preise" },
  { href: "/milano#studio", label: "Milano Studio" },
  { href: "/milano/galerie", label: "Galerie" },
  { href: "/milano/termin", label: "Termin buchen" },
  { href: "/milano/kontakt", label: "Kontakt" },
];

export function Header() {
  const [offen, setOffen] = useState(false);

  return (
    <header className="m-header">
      <div className="m-container m-header-inner">
        <Link href="/milano" onClick={() => setOffen(false)} aria-label={salon.name}>
          <Wortmarke />
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
            <Icon name="telefon" size={17} />
          </a>

          <button
            type="button"
            className="m-icon-btn m-nur-mobil"
            aria-expanded={offen}
            aria-controls="milano-menue"
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            onClick={() => setOffen((v) => !v)}
          >
            <Icon name={offen ? "schliessen" : "menu"} size={17} />
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
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}
