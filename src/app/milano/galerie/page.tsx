import type { Metadata } from "next";
import Link from "next/link";
import { Monogramm } from "@/components/milano/Brand";
import { Icon } from "@/components/milano/Icon";
import { salon } from "@/lib/milano/content";

export const metadata: Metadata = {
  title: `Galerie — ${salon.name} Geldern`,
  description: "Arbeiten aus dem Salon: Fades, Bart, Klassiker und Kinderschnitte.",
  robots: { index: false, follow: false },
};

/**
 * Eigene Galerieseite — wie in der Vorlage.
 *
 * Solange die echten Salonfotos fehlen, steht in jeder Fläche das
 * Monogramm. Die Flächen haben schon die richtigen Formate: Ein Foto tritt
 * an dieselbe Stelle, ohne dass sich am Aufbau etwas ändert.
 */

const PLATTEN: { titel: string; text: string; hoch?: boolean }[] = [
  { titel: "Skin Fade", text: "Sauberer Verlauf, harte Kante.", hoch: true },
  { titel: "Bart in Form", text: "Konturen, Länge, Öl." },
  { titel: "Der Klassiker", text: "Waschen, schneiden, stylen." },
  { titel: "Messerrasur", text: "Heiße Tücher, klassische Klinge.", hoch: true },
  { titel: "Kinderschnitt", text: "Geduldig und ohne Hektik." },
  { titel: "Im Laden", text: "Stühle, Spiegel, Licht." },
];

export default function GalerieSeite() {
  return (
    <section className="m-container m-section">
      <div className="m-section-kopf m-section-kopf-zentriert">
        <p className="m-eyebrow">Galerie</p>
        <h1 className="m-titel m-titel-xl">Aus dem Salon.</h1>
        <p className="m-fliess" style={{ textAlign: "center" }}>
          Was hier steht, entsteht im Laden an der Issumer Straße. Aktuelles zeigt der
          Salon laufend auf Instagram.
        </p>
      </div>

      <div className="m-galerie">
        {PLATTEN.map((platte) => (
          <figure
            key={platte.titel}
            className={`m-galerie-platte${platte.hoch ? " m-galerie-hoch" : ""}`}
          >
            <span className="m-galerie-bild">
              <Monogramm size={platte.hoch ? 96 : 76} />
            </span>
            <figcaption>
              <strong>{platte.titel}</strong>
              <span className="m-mini">{platte.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="m-mini" style={{ marginTop: 22, textAlign: "center" }}>
        Diese Flächen sind für die echten Salonfotos reserviert.
      </p>

      <div className="m-galerie-schluss">
        <a
          className="m-knopf m-knopf-linie"
          href={salon.instagramUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="instagram" size={16} />@{salon.instagram} ansehen
        </a>
        <Link className="m-knopf m-knopf-dunkel" href="/milano/termin">
          Termin buchen
          <Icon name="pfeil-rechts" size={16} />
        </Link>
      </div>
    </section>
  );
}
