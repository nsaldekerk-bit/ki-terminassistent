import type { Locale } from "../config";
import { de, type Dictionary } from "./de";
import { en } from "./en";
import { tr } from "./tr";
import { pl } from "./pl";
import { ru } from "./ru";

export type { Dictionary };

/** One entry per Locale — TypeScript errors if a language is missing here. */
export const dictionaries: Record<Locale, Dictionary> = { de, en, tr, pl, ru };
