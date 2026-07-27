import { de as deDF, enGB, tr as trDF, pl as plDF, ru as ruDF } from "date-fns/locale";
import type { Locale } from "./config";

/** The date-fns locale that matches each app locale, for weekday/month names. */
export const DATE_FNS_LOCALES: Record<Locale, typeof deDF> = {
  de: deDF,
  en: enGB,
  tr: trDF,
  pl: plDF,
  ru: ruDF,
};
