import Link from "next/link";
import { getDemoSlug } from "@/lib/tenant/demo";

const steps = [
  {
    n: "1",
    title: "Widget einbinden",
    body: "Ein kurzer Code-Schnipsel auf Ihrer Website – der Chat erscheint unten rechts. Fertig.",
  },
  {
    n: "2",
    title: "Betriebsprofil pflegen",
    body: "Öffnungszeiten, Leistungen, Einzugsgebiet und Notfallnummer im Dashboard eintragen.",
  },
  {
    n: "3",
    title: "Assistent übernimmt",
    body: "Kunden fragen und buchen selbst. Sie sehen jeden Termin und jede Anfrage im Dashboard.",
  },
];

const features = [
  {
    title: "Termine rund um die Uhr",
    body: "Kunden buchen selbst einen freien Slot – nachts, am Wochenende, während Sie auf der Baustelle sind.",
  },
  {
    title: "Fragen automatisch beantwortet",
    body: "Öffnungszeiten, Adresse, Leistungen: Der Assistent antwortet aus Ihrem Betriebsprofil – und erfindet nichts.",
  },
  {
    title: "Notfälle erkannt",
    body: "Dringende Fälle wie Wasserrohrbruch oder Stromausfall werden erkannt und direkt an Ihre Notfallnummer geleitet.",
  },
  {
    title: "Urlaub & Sperrzeiten",
    body: "Tragen Sie Urlaub oder einzelne Sperrtage ein – diese Zeiten bietet der Assistent gar nicht erst an.",
  },
  {
    title: "Fahrzeit-Puffer",
    body: "Zwischen zwei Einsätzen bleibt automatisch Zeit für die Anfahrt. Keine unmöglichen Termine mehr.",
  },
  {
    title: "Erinnerungen & Umbuchung",
    body: "Kunden erhalten automatische Erinnerungen und können selbst umbuchen oder absagen – ohne Anruf bei Ihnen.",
  },
];

export default async function Home() {
  const demoSlug = await getDemoSlug();

  return (
    <div className="kt-home">
      <style>{css}</style>

      <header className="kt-nav">
        <span className="kt-brand">
          <span className="kt-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M12 3l7 4v5c0 4.2-2.9 7.4-7 8.5C7.9 19.4 5 16.2 5 12V7l7-4z"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.2l2.1 2.1L15 10"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          KI-Terminassistent
        </span>
        <Link href="/admin/login" className="kt-nav-login">
          Betriebs-Login
        </Link>
      </header>

      <main>
        <section className="kt-hero">
          <span className="kt-eyebrow">Für Handwerksbetriebe</span>
          <h1 className="kt-h1">
            Kein verpasster Anruf mehr.
            <br />
            Ihr Betrieb nimmt Termine an – <span className="kt-accent">rund um die Uhr</span>.
          </h1>
          <p className="kt-sub">
            Der KI-Terminassistent beantwortet Kundenfragen und vergibt Termine automatisch –
            während Sie auf der Leiter stehen. Ohne App, ohne Warteschleife, ohne Mehraufwand.
          </p>
          <div className="kt-cta-row">
            {demoSlug ? (
              <>
                <Link href={`/embed/${demoSlug}`} className="kt-btn kt-btn-primary">
                  Live-Demo öffnen
                </Link>
                <Link href="/admin/login" className="kt-btn kt-btn-ghost">
                  Zum Betriebs-Login
                </Link>
              </>
            ) : (
              <Link href="/admin/login" className="kt-btn kt-btn-primary">
                Zum Betriebs-Login
              </Link>
            )}
          </div>
          <p className="kt-trust">Läuft direkt auf Ihrer Website · Keine Installation beim Kunden</p>
        </section>

        <section className="kt-steps" aria-label="So funktioniert es">
          {steps.map((s) => (
            <div key={s.n} className="kt-step">
              <span className="kt-step-n">{s.n}</span>
              <h3 className="kt-step-title">{s.title}</h3>
              <p className="kt-step-body">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="kt-features">
          <h2 className="kt-h2">Alles, was ein Terminanruf sonst kostet – automatisch</h2>
          <div className="kt-grid">
            {features.map((f) => (
              <div key={f.title} className="kt-card">
                <span className="kt-tick" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <path
                      d="M5 12.5l4.2 4.2L19 7"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="kt-card-title">{f.title}</h3>
                <p className="kt-card-body">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="kt-band">
          <h2 className="kt-band-title">Bereit, keinen Termin mehr zu verpassen?</h2>
          <p className="kt-band-sub">
            {demoSlug
              ? "Probieren Sie den Assistenten aus, wie ihn Ihre Kunden sehen würden."
              : "Melden Sie sich an und richten Sie Ihren Assistenten in wenigen Minuten ein."}
          </p>
          {demoSlug ? (
            <Link href={`/embed/${demoSlug}`} className="kt-btn kt-btn-primary">
              Live-Demo öffnen
            </Link>
          ) : (
            <Link href="/admin/login" className="kt-btn kt-btn-primary">
              Zum Betriebs-Login
            </Link>
          )}
        </section>
      </main>

      <footer className="kt-footer">
        <span className="kt-brand kt-brand-sm">
          <span className="kt-logo kt-logo-sm" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path
                d="M12 3l7 4v5c0 4.2-2.9 7.4-7 8.5C7.9 19.4 5 16.2 5 12V7l7-4z"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          KI-Terminassistent
        </span>
        <span className="kt-copy">© {new Date().getFullYear()} · Terminassistent für Handwerksbetriebe</span>
      </footer>
    </div>
  );
}

const css = `
.kt-home {
  --bg: #0f1216;
  --surface: #171b21;
  --surface-2: #1b2027;
  --line: #282d34;
  --text: #eef1f4;
  --muted: #9aa4af;
  --accent: #ff7d33;
  --accent-deep: #ec6a1e;
  min-height: 100%;
  width: 100%;
  color: var(--text);
  background:
    radial-gradient(1100px 520px at 50% -8%, rgba(255,125,51,0.16), transparent 60%),
    var(--bg);
  font-family: var(--font-geist-sans), system-ui, -apple-system, Segoe UI, sans-serif;
  line-height: 1.55;
}
.kt-home a { text-decoration: none; color: inherit; }

.kt-nav {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 1080px; margin: 0 auto; padding: 22px 24px;
}
.kt-brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -0.01em; }
.kt-logo {
  width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
  background: linear-gradient(150deg, var(--accent), var(--accent-deep));
  box-shadow: 0 5px 14px -5px rgba(255,125,51,0.65);
}
.kt-nav-login {
  font-size: 14px; font-weight: 600; color: var(--muted);
  padding: 9px 16px; border: 1px solid var(--line); border-radius: 999px;
  transition: color .15s, border-color .15s, background .15s;
}
.kt-nav-login:hover { color: var(--text); border-color: #3a424c; background: var(--surface); }

.kt-hero { max-width: 900px; margin: 0 auto; padding: 56px 24px 40px; text-align: center; }
.kt-eyebrow {
  display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: .04em;
  text-transform: uppercase; color: var(--accent);
  background: rgba(255,125,51,0.1); border: 1px solid rgba(255,125,51,0.25);
  padding: 6px 14px; border-radius: 999px; margin-bottom: 22px;
}
.kt-h1 {
  font-size: clamp(30px, 5.2vw, 52px); line-height: 1.08; font-weight: 800;
  letter-spacing: -0.025em; margin: 0 0 20px;
}
.kt-accent {
  background: linear-gradient(120deg, var(--accent), var(--accent-deep));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.kt-sub { font-size: clamp(16px, 2.2vw, 19px); color: var(--muted); max-width: 620px; margin: 0 auto 32px; }
.kt-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.kt-btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 50px; padding: 0 26px; border-radius: 12px; font-weight: 650; font-size: 15.5px;
  transition: transform .12s ease, filter .15s ease, background .15s, border-color .15s;
}
.kt-btn:hover { transform: translateY(-1px); }
.kt-btn-primary {
  background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff;
  box-shadow: 0 12px 26px -10px rgba(255,125,51,0.75);
}
.kt-btn-primary:hover { filter: brightness(1.06); }
.kt-btn-ghost { background: var(--surface); color: var(--text); border: 1px solid var(--line); }
.kt-btn-ghost:hover { border-color: #3a424c; background: var(--surface-2); }
.kt-trust { font-size: 13.5px; color: #6b747e; margin-top: 20px; }

.kt-steps {
  max-width: 1080px; margin: 24px auto 0; padding: 0 24px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
}
.kt-step { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 22px; }
.kt-step-n {
  display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 9px;
  font-weight: 800; font-size: 14px; color: var(--accent);
  background: rgba(255,125,51,0.12); border: 1px solid rgba(255,125,51,0.3); margin-bottom: 12px;
}
.kt-step-title { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.kt-step-body { font-size: 14.5px; color: var(--muted); margin: 0; }

.kt-features { max-width: 1080px; margin: 0 auto; padding: 72px 24px 8px; }
.kt-h2 {
  font-size: clamp(22px, 3.4vw, 32px); font-weight: 800; letter-spacing: -0.02em;
  text-align: center; margin: 0 0 40px; max-width: 640px; margin-left: auto; margin-right: auto;
}
.kt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kt-card {
  background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 24px;
  transition: border-color .15s, transform .15s;
}
.kt-card:hover { border-color: rgba(255,125,51,0.4); transform: translateY(-2px); }
.kt-tick {
  display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(150deg, var(--accent), var(--accent-deep)); margin-bottom: 14px;
  box-shadow: 0 5px 14px -6px rgba(255,125,51,0.7);
}
.kt-card-title { font-size: 17px; font-weight: 700; margin: 0 0 7px; letter-spacing: -0.01em; }
.kt-card-body { font-size: 14.5px; color: var(--muted); margin: 0; }

.kt-band {
  max-width: 1080px; margin: 72px auto 0; padding: 48px 24px; text-align: center;
  background:
    radial-gradient(600px 260px at 50% 120%, rgba(255,125,51,0.18), transparent 60%),
    var(--surface);
  border: 1px solid var(--line); border-radius: 20px;
}
.kt-band-title { font-size: clamp(22px, 3.4vw, 30px); font-weight: 800; letter-spacing: -0.02em; margin: 0 0 10px; }
.kt-band-sub { color: var(--muted); margin: 0 0 24px; font-size: 16px; }

.kt-footer {
  max-width: 1080px; margin: 56px auto 0; padding: 28px 24px 48px;
  border-top: 1px solid var(--line);
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.kt-brand-sm { font-size: 14px; color: var(--muted); font-weight: 600; }
.kt-logo-sm { width: 26px; height: 26px; border-radius: 8px; }
.kt-copy { font-size: 13px; color: #6b747e; }

@media (max-width: 760px) {
  .kt-steps, .kt-grid { grid-template-columns: 1fr; }
}
`;
