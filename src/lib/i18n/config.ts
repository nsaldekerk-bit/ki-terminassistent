/**
 * Language configuration for the whole app. Adding a language is meant to be
 * cheap: append its code here, add its flag/name below, and drop a matching
 * dictionary file in ./dictionaries — TypeScript then forces every surface to
 * have that language's strings, so nothing can be half-translated silently.
 */
export const LOCALES = ["de", "en", "tr", "pl", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

/** Cookie the choice is stored in — readable on both the server and the client. */
export const LOCALE_COOKIE = "kt-lang";

/** One year; the visitor's choice should stick. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native names + a flag, shown in the switcher. Native, so a Turkish speaker
 *  recognises "Türkçe" rather than "Turkish". */
export const LOCALE_META: Record<Locale, { label: string; flag: string; dir: "ltr" | "rtl" }> = {
  de: { label: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  en: { label: "English", flag: "🇬🇧", dir: "ltr" },
  tr: { label: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  pl: { label: "Polski", flag: "🇵🇱", dir: "ltr" },
  ru: { label: "Русский", flag: "🇷🇺", dir: "ltr" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
