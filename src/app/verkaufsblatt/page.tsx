import type { Metadata } from "next";
import Link from "next/link";
import { getDemoSlug } from "@/lib/tenant/demo";
import { getI18n } from "@/lib/i18n/server";
import { LOCALE_META } from "@/lib/i18n/config";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { CopyContact } from "@/components/verkaufsblatt/CopyContact";

// Contact details are the founder's own — not translated.
const CONTACT = {
  name: "Noah Schneider",
  phone: "0152 24889612",
  email: "nsaldekerk@gmail.com",
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.vb.metaTitle,
    description: t.vb.metaDescription,
    // A sheet handed out in a sales conversation, not a page that should rank
    // against the landing page.
    robots: { index: false, follow: false },
  };
}

const Check = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.2 4.2L19 7" />
  </svg>
);

const Shield = (size: number) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
    <path d="M12 3l7 4v5c0 4.2-2.9 7.4-7 8.5C7.9 19.4 5 16.2 5 12V7l7-4z" />
    <path d="M9 12.2l2.1 2.1L15 10" />
  </svg>
);

export default async function Verkaufsblatt() {
  const { locale, t } = await getI18n();
  const demoSlug = await getDemoSlug();
  const demoHref = demoSlug ? `/embed/${demoSlug}` : "/admin/login";

  return (
    <div className="vb" dir={LOCALE_META[locale].dir}>
      <style>{css}</style>

      <header className="vb-nav">
        <span className="vb-brand">
          <span className="vb-logo" aria-hidden="true">
            {Shield(20)}
          </span>
          KI-Terminassistent
        </span>
        <div className="vb-nav-right">
          <LanguageSwitcher current={locale} label={t.common.language} tone="dark" />
          <Link href="/admin/login" className="vb-nav-login">
            {t.common.login}
          </Link>
        </div>
      </header>

      <main>
        <section className="vb-hero">
          <span className="vb-eyebrow">{t.common.forHandwerk}</span>
          <h1 className="vb-h1">
            {t.vb.heroBefore}
            <span className="vb-accent">{t.vb.heroAccent}</span>
            {t.vb.heroAfter}
          </h1>
          <p className="vb-sub">{t.vb.sub}</p>
          <div className="vb-cta-row">
            <Link href={demoHref} className="vb-btn vb-btn-primary">
              {t.common.openDemo}
            </Link>
            <Link href="/admin/login" className="vb-btn vb-btn-ghost">
              {t.common.toLogin}
            </Link>
          </div>
          <p className="vb-trust">{t.vb.trust}</p>
        </section>

        <section className="vb-nums">
          {t.vb.numbers.map((x) => (
            <div key={x.title} className="vb-num">
              <span className="vb-num-n">{x.n}</span>
              <b>{x.title}</b>
              <span>{x.body}</span>
            </div>
          ))}
        </section>

        <section className="vb-sec">
          <h2 className="vb-h2">{t.vb.featuresTitle}</h2>
          <div className="vb-grid">
            {t.vb.features.map((f, i) => (
              <div key={f.title} className={i === 0 ? "vb-card vb-hi" : "vb-card"}>
                {i === 0 && <span className="vb-badge">{t.vb.featuresBadge}</span>}
                <span className="vb-tick" aria-hidden="true">
                  {Check}
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="vb-quote">
          <div className="vb-quote-in">
            <p>
              {t.vb.quote}
              <span>{t.vb.quoteSub}</span>
            </p>
          </div>
        </section>

        <section className="vb-sec">
          <h2 className="vb-h2">{t.vb.stepsTitle}</h2>
          <div className="vb-steps">
            {t.vb.steps.map((s, i) => (
              <div key={s.title} className="vb-step">
                <span className="vb-step-n">{i + 1}</span>
                <b>{s.title}</b>
                <span>{s.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="vb-sec">
          <h2 className="vb-h2">{t.vb.offerTitle}</h2>
          <div className="vb-offer">
            <div className="vb-fill">
              <h3>{t.vb.priceHeading}</h3>
              <span className="vb-price">{t.vb.price}</span>
              <p>{t.vb.priceBody}</p>
              <div className="vb-opts-wrap">
                <div className="vb-opts-h">{t.vb.optionsHeading}</div>
                <ul className="vb-opts">
                  {t.vb.options.map((o) => (
                    <li key={o}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.2 4.2L19 7" />
                      </svg>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="vb-fill vb-accent-box">
              <h3>{t.vb.contactHeading}</h3>
              <div className="vb-contact">
                <span className="vb-contact-name">{CONTACT.name}</span>
                <CopyContact
                  items={[
                    {
                      value: CONTACT.phone,
                      aria: t.vb.copyPhoneLabel(CONTACT.phone),
                      doneAnnounce: t.vb.copyDoneAnnounce(CONTACT.phone),
                    },
                    {
                      value: CONTACT.email,
                      aria: t.vb.copyEmailLabel(CONTACT.email),
                      doneAnnounce: t.vb.copyDoneAnnounce(CONTACT.email),
                    },
                  ]}
                  copiedText={t.vb.copied}
                  failedText={t.vb.copyFailed}
                  failAnnounce={t.vb.copyFailAnnounce}
                />
                <span className="vb-copy-note">{t.vb.copyHint}</span>
              </div>
              <p>{t.vb.contactBody}</p>
            </div>
          </div>
        </section>

        <section className="vb-band">
          <h2 className="vb-h2">{t.vb.bandTitle}</h2>
          <p>{t.vb.bandBody}</p>
          <Link href={demoHref} className="vb-btn vb-btn-primary">
            {t.common.openDemo}
          </Link>
        </section>
      </main>

      <footer className="vb-footer">
        <span className="vb-brand vb-brand-sm">
          <span className="vb-logo vb-logo-sm" aria-hidden="true">
            {Shield(16)}
          </span>
          KI-Terminassistent
        </span>
        <span className="vb-copy-line">{t.common.tagline}</span>
      </footer>
    </div>
  );
}

const css = `
.vb {
  --bg: #0f1216;
  --surface: #171b21;
  --surface-2: #1b2027;
  --line: #282d34;
  --text: #eef1f4;
  --muted: #9aa4af;
  --faint: #6b747e;
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
.vb a { text-decoration: none; color: inherit; }

.vb-nav { display: flex; align-items: center; justify-content: space-between; max-width: 1080px; margin: 0 auto; padding: 22px 24px; gap: 12px; }
.vb-nav-right { display: flex; align-items: center; gap: 10px; }
.vb-brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -0.01em; }
.vb-logo { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex: none; background: linear-gradient(150deg, var(--accent), var(--accent-deep)); box-shadow: 0 5px 14px -5px rgba(255,125,51,0.65); }
.vb-nav-login { font-size: 14px; font-weight: 600; color: var(--muted); padding: 9px 16px; border: 1px solid var(--line); border-radius: 999px; transition: color .15s, border-color .15s, background .15s; white-space: nowrap; }
.vb-nav-login:hover { color: var(--text); border-color: #3a424c; background: var(--surface); }

.vb-hero { max-width: 900px; margin: 0 auto; padding: 52px 24px 38px; text-align: center; }
.vb-eyebrow { display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--accent); background: rgba(255,125,51,0.1); border: 1px solid rgba(255,125,51,0.25); padding: 6px 14px; border-radius: 999px; margin-bottom: 22px; }
.vb-h1 { font-size: clamp(29px, 5vw, 50px); line-height: 1.1; font-weight: 800; letter-spacing: -0.025em; margin: 0 0 20px; text-wrap: balance; }
.vb-accent { background: linear-gradient(120deg, var(--accent), var(--accent-deep)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.vb-sub { font-size: clamp(15.5px, 2.2vw, 18.5px); color: var(--muted); max-width: 640px; margin: 0 auto 30px; }
.vb-cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.vb-btn { display: inline-flex; align-items: center; justify-content: center; height: 50px; padding: 0 26px; border-radius: 12px; font-weight: 650; font-size: 15.5px; transition: transform .12s ease, filter .15s ease, background .15s, border-color .15s; }
.vb-btn:hover { transform: translateY(-1px); }
.vb-btn-primary { background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; box-shadow: 0 12px 26px -10px rgba(255,125,51,0.75); }
.vb-btn-primary:hover { filter: brightness(1.06); }
.vb-btn-ghost { background: var(--surface); color: var(--text); border: 1px solid var(--line); }
.vb-btn-ghost:hover { border-color: #3a424c; background: var(--surface-2); }
.vb-trust { font-size: 13.5px; color: var(--faint); margin-top: 20px; }

.vb-nums { max-width: 1080px; margin: 8px auto 0; padding: 0 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.vb-num { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 20px 22px; }
.vb-num-n { display: block; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 2px; background: linear-gradient(120deg, var(--accent), var(--accent-deep)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.vb-num b { display: block; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.vb-num > span:last-child { font-size: 14px; color: var(--muted); }

.vb-sec { max-width: 1080px; margin: 0 auto; padding: 66px 24px 0; }
.vb-h2 { font-size: clamp(21px, 3.2vw, 30px); font-weight: 800; letter-spacing: -0.02em; text-align: center; margin: 0 auto 36px; max-width: 640px; text-wrap: balance; }
.vb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.vb-card { position: relative; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 24px; transition: border-color .15s, transform .15s; }
.vb-card:hover { border-color: rgba(255,125,51,0.4); transform: translateY(-2px); }
.vb-card.vb-hi { border-color: rgba(255,125,51,0.45); background: linear-gradient(160deg, rgba(255,125,51,0.07), var(--surface) 60%); }
.vb-tick { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(150deg, var(--accent), var(--accent-deep)); margin-bottom: 14px; box-shadow: 0 5px 14px -6px rgba(255,125,51,0.7); }
.vb-card h3 { font-size: 17px; font-weight: 700; margin: 0 0 7px; letter-spacing: -0.01em; }
.vb-card p { font-size: 14.5px; color: var(--muted); margin: 0; }
.vb-badge { position: absolute; top: 16px; right: 16px; font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); background: rgba(255,125,51,0.12); border: 1px solid rgba(255,125,51,0.35); border-radius: 999px; padding: 3px 9px; }

.vb-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.vb-step { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 22px; }
.vb-step-n { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; font-weight: 800; font-size: 14px; color: var(--accent); background: rgba(255,125,51,0.12); border: 1px solid rgba(255,125,51,0.3); margin-bottom: 12px; }
.vb-step b { display: block; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.vb-step > span:last-child { font-size: 14.5px; color: var(--muted); }

.vb-quote { max-width: 1080px; margin: 60px auto 0; padding: 0 24px; }
.vb-quote-in { border-left: 3px solid var(--accent); background: linear-gradient(100deg, rgba(255,125,51,0.08), transparent 70%); border-radius: 0 14px 14px 0; padding: 20px 24px; }
.vb-quote-in p { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.vb-quote-in span { display: block; margin-top: 7px; font-size: 14px; color: var(--muted); font-weight: 400; }

.vb-offer { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.vb-fill { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 24px; }
.vb-fill.vb-accent-box { border-color: rgba(255,125,51,0.45); background: linear-gradient(160deg, rgba(255,125,51,0.07), var(--surface) 60%); }
.vb-fill h3 { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .11em; color: var(--faint); margin: 0 0 10px; }
.vb-price { display: block; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 6px; background: linear-gradient(120deg, var(--accent), var(--accent-deep)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.vb-fill > p { font-size: 14.5px; color: var(--muted); margin: 0; }

.vb-opts-wrap { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
.vb-opts { list-style: none; margin: 0; padding: 0; }
.vb-opts-h { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--faint); margin-bottom: 9px; }
.vb-opts li { display: flex; gap: 9px; align-items: flex-start; font-size: 14px; color: var(--muted); margin-bottom: 7px; }
.vb-opts li:last-child { margin-bottom: 0; }
.vb-opts svg { flex: none; margin-top: 3px; color: var(--accent); }

.vb-contact { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; margin-bottom: 14px; }
.vb-contact-name { font-size: 19px; font-weight: 700; letter-spacing: -0.015em; margin-bottom: 4px; }
.vb-copy { display: inline-flex; align-items: center; gap: 8px; background: none; border: none; margin: 0; padding: 4px 6px 4px 0; font: inherit; font-size: 15px; font-weight: 600; color: var(--text); text-align: left; cursor: pointer; border-radius: 7px; transition: color .15s; }
.vb-copy:hover { color: var(--accent); }
.vb-copy:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.vb-copy-ic { flex: none; color: var(--faint); transition: color .15s; display: inline-flex; }
.vb-copy:hover .vb-copy-ic { color: var(--accent); }
.vb-copy-fb { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--accent); opacity: 0; transition: opacity .18s; white-space: nowrap; }
.vb-copy.vb-copied .vb-copy-fb, .vb-copy.vb-failed .vb-copy-fb { opacity: 1; }
.vb-copy.vb-copied .vb-copy-ic { color: var(--accent); }
.vb-copy.vb-failed .vb-copy-fb { color: #ff8f8f; }
.vb-copy-note { font-size: 12px; color: var(--faint); margin-top: 5px; }
.vb-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; margin: 0; }

.vb-band { max-width: 1080px; margin: 66px auto 0; padding: 46px 24px; text-align: center; background: radial-gradient(600px 260px at 50% 120%, rgba(255,125,51,0.18), transparent 60%), var(--surface); border: 1px solid var(--line); border-radius: 20px; }
.vb-band .vb-h2 { margin-bottom: 10px; }
.vb-band p { color: var(--muted); margin: 0 0 24px; font-size: 16px; }

.vb-footer { max-width: 1080px; margin: 54px auto 0; padding: 26px 24px 46px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.vb-brand-sm { font-size: 14px; color: var(--muted); font-weight: 600; }
.vb-logo-sm { width: 26px; height: 26px; border-radius: 8px; }
.vb-copy-line { font-size: 13px; color: var(--faint); }

@media (max-width: 780px) {
  .vb-nums, .vb-grid, .vb-steps, .vb-offer { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .vb-btn, .vb-card, .vb-copy, .vb-copy-ic, .vb-copy-fb { transition: none; }
}

/* Printing a dark sheet wastes toner and reads poorly — flip to paper. */
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  .vb { background: #fff; color: #17191d; }
  .vb-nav-right, .vb-cta-row, .vb-band { display: none; }
  .vb-num, .vb-card, .vb-step, .vb-fill, .vb-quote-in { background: #fff !important; border-color: #ddd8d3 !important; box-shadow: none !important; }
  .vb-num > span:last-child, .vb-card p, .vb-step > span:last-child, .vb-fill > p, .vb-sub, .vb-quote-in span, .vb-opts li { color: #4d545d !important; }
  .vb-num-n, .vb-accent, .vb-price { -webkit-text-fill-color: #ec6a1e; color: #ec6a1e !important; }
  .vb-contact-name, .vb-copy { color: #17191d !important; }
  .vb-copy { padding-left: 0; }
  .vb-copy-ic, .vb-copy-fb, .vb-copy-note { display: none !important; }
  .vb-opts-wrap { border-color: #ddd8d3 !important; }
  .vb-logo, .vb-tick, .vb-step-n, .vb-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .vb-sec { padding-top: 26px; }
  .vb-card, .vb-step, .vb-num { break-inside: avoid; }
  .vb-footer { border-color: #ddd8d3; }
  .vb-copy-line, .vb-brand-sm { color: #858d97 !important; }
}
`;
