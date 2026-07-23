"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_META,
  type Locale,
} from "@/lib/i18n/config";

const IconGlobe = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
  </svg>
);

export function LanguageSwitcher({
  current,
  label,
  tone = "dark",
  compact = false,
  onSelect,
}: {
  current: Locale;
  /** Localised word for "Language", used as the control's accessible name. */
  label: string;
  tone?: "dark" | "light";
  /** Show only the flag in the trigger (for tight spots like the widget header). */
  compact?: boolean;
  /** When given, the caller handles the change (e.g. the widget's own state)
   *  instead of the default cookie-write + server refresh. */
  onSelect?: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    if (onSelect) {
      onSelect(locale);
      return;
    }
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    // Re-render the server components with the new cookie in place.
    router.refresh();
  }

  const meta = LOCALE_META[current];

  return (
    <div ref={root} className={`ktlang ktlang-${tone}${compact ? " ktlang-compact" : ""}`}>
      <style>{css}</style>
      <button
        type="button"
        className="ktlang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${meta.label}`}
        onClick={() => setOpen((v) => !v)}
      >
        {compact ? (
          <span className="ktlang-flag" aria-hidden="true">{meta.flag}</span>
        ) : (
          <>
            {IconGlobe}
            <span className="ktlang-cur">{meta.label}</span>
          </>
        )}
        <svg className="ktlang-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="ktlang-menu" role="listbox" aria-label={label}>
          {LOCALES.map((loc) => {
            const m = LOCALE_META[loc];
            return (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={loc === current}
                  className={loc === current ? "ktlang-opt sel" : "ktlang-opt"}
                  onClick={() => choose(loc)}
                >
                  <span className="ktlang-flag" aria-hidden="true">{m.flag}</span>
                  {m.label}
                  {loc === current && (
                    <svg className="ktlang-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.2 4.2L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const css = `
.ktlang { position: relative; display: inline-block; font-family: inherit; }
.ktlang-btn {
  display: inline-flex; align-items: center; gap: 7px;
  font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  padding: 8px 12px; border-radius: 999px; transition: color .15s, border-color .15s, background .15s;
}
.ktlang-cur { line-height: 1; }
.ktlang-chev { opacity: 0.7; }
.ktlang-compact .ktlang-btn { padding: 6px 8px; gap: 4px; }
.ktlang-compact .ktlang-flag { font-size: 17px; }
.ktlang-menu {
  position: absolute; right: 0; top: calc(100% + 8px); z-index: 60;
  list-style: none; margin: 0; padding: 6px; min-width: 190px;
  border-radius: 12px; box-shadow: 0 16px 40px -16px rgba(0,0,0,0.6);
  max-height: 320px; overflow-y: auto;
}
.ktlang-opt {
  display: flex; align-items: center; gap: 10px; width: 100%;
  font: inherit; font-size: 14px; font-weight: 500; text-align: left; cursor: pointer;
  padding: 9px 10px; border: none; border-radius: 8px; background: none;
}
.ktlang-flag { font-size: 16px; line-height: 1; }
.ktlang-check { margin-left: auto; }

/* dark tone — sales sheet, widget */
.ktlang-dark .ktlang-btn { color: #9aa4af; border: 1px solid #282d34; background: transparent; }
.ktlang-dark .ktlang-btn:hover { color: #eef1f4; border-color: #3a424c; background: #171b21; }
.ktlang-dark .ktlang-menu { background: #1b2027; border: 1px solid #2b323b; }
.ktlang-dark .ktlang-opt { color: #d3d9de; }
.ktlang-dark .ktlang-opt:hover { background: #232a32; color: #fff; }
.ktlang-dark .ktlang-opt.sel { color: #ff7d33; }

/* light tone — dashboard */
.ktlang-light .ktlang-btn { color: #4b5563; border: 1px solid #d1d5db; background: #fff; }
.ktlang-light .ktlang-btn:hover { color: #111827; border-color: #9ca3af; background: #f9fafb; }
.ktlang-light .ktlang-menu { background: #fff; border: 1px solid #e5e7eb; }
.ktlang-light .ktlang-opt { color: #374151; }
.ktlang-light .ktlang-opt:hover { background: #f3f4f6; color: #111827; }
.ktlang-light .ktlang-opt.sel { color: #ec6a1e; }

.ktlang-btn:focus-visible, .ktlang-opt:focus-visible { outline: 2px solid #ff7d33; outline-offset: 2px; }
`;
