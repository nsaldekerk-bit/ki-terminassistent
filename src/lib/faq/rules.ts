import { contextToBrief, formatPrice, type FaqContext } from "@/lib/faq/context";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export interface RuleAnswer {
  answer: string;
  /** Which rule fired — useful for debugging and analytics. */
  topic: string;
}

/** Lowercase, strip umlauts and punctuation so "Öffnungszeiten?" matches "offnungszeiten". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Crude German stem so word forms still match: "Entsorgung" and "entsorgen"
 * both reduce to "entsorg". Good enough for keyword lookup — anything subtler
 * is the AI's job.
 */
function stem(word: string): string {
  return word.length >= 6 ? word.slice(0, Math.max(5, word.length - 3)) : word;
}

/**
 * Answers the predictable questions from the business's own data — no AI, no
 * cost, instant. Returns null when nothing matches, so the caller can fall back
 * to the AI (or to offering a callback).
 */
export function answerByRules(question: string, ctx: FaqContext, locale: Locale = "de"): RuleAnswer | null {
  const q = normalize(question);
  if (q.length < 2) return null;

  const t = dictionaries[locale].faq;
  const localeTag = dictionaries[locale].widget.localeTag;
  const kw = t.keywords;

  // 1) The business's own entries win — they are the most specific. Matched by
  //    the keywords/wording the business typed, so language-agnostic in mechanism.
  for (const entry of ctx.entries) {
    const keywordStems = (entry.keywords ?? "")
      .split(",")
      .map((k) => normalize(k))
      .filter((k) => k.length >= 3)
      .map(stem);

    // Also match the entry's own wording: if most of its distinctive words
    // appear in the question, it's the same question in other words.
    const entryWords = normalize(entry.question)
      .split(" ")
      .filter((w) => w.length >= 5)
      .map(stem);
    const hits = entryWords.filter((w) => q.includes(w)).length;
    const wordOverlap = entryWords.length >= 2 && hits / entryWords.length >= 0.6;

    if (hasAny(q, keywordStems) || wordOverlap) {
      return { answer: entry.answer, topic: "custom" };
    }
  }

  // 2) Opening hours
  if (hasAny(q, kw.hours)) {
    if (ctx.hoursLines.length === 0) {
      return null; // nothing stored — let the AI or the fallback handle it
    }
    let answer = `${t.hoursHeading}\n${ctx.hoursLines.join("\n")}`;
    if (ctx.closures.length > 0) {
      answer += `\n\n${t.closedPrefix} ${ctx.closures.join("; ")}`;
    }
    return { answer, topic: "hours" };
  }

  // 3) Emergency / out-of-hours
  if (hasAny(q, kw.emergency)) {
    if (ctx.emergencyPhone) {
      const note = ctx.emergencyNote ? ` ${ctx.emergencyNote}` : "";
      return { answer: t.emergencyLine(ctx.emergencyPhone, note), topic: "emergency" };
    }
    if (ctx.phone) {
      return { answer: t.emergencyViaPhone(ctx.phone), topic: "emergency" };
    }
    return null;
  }

  // 4) Address / location
  if (hasAny(q, kw.address)) {
    if (!ctx.address) return null;
    return { answer: `${t.addressHeading}\n${ctx.address}`, topic: "address" };
  }

  // 5) Phone / contact
  if (hasAny(q, kw.contact)) {
    const bits: string[] = [];
    if (ctx.phone) bits.push(`${t.labelPhone}: ${ctx.phone}`);
    if (ctx.email) bits.push(`${t.labelEmail}: ${ctx.email}`);
    if (ctx.emergencyPhone) bits.push(`${t.labelEmergency}: ${ctx.emergencyPhone}`);
    if (bits.length === 0) return null;
    return { answer: `${t.contactHeading}\n${bits.join("\n")}`, topic: "contact" };
  }

  // 6) E-Mail specifically
  if (hasAny(q, kw.email)) {
    if (!ctx.email) return null;
    return { answer: t.emailLine(ctx.email), topic: "email" };
  }

  // 7) Prices
  if (hasAny(q, kw.price)) {
    const priced = ctx.services.filter((s) => s.priceCents != null);
    if (priced.length === 0) {
      return { answer: t.priceNone, topic: "price" };
    }
    const lines = priced.map((s) => `${s.name}: ${t.from} ${formatPrice(s.priceCents!, localeTag)}`);
    return {
      answer: `${t.priceHeading}\n${lines.join("\n")}\n\n${t.priceFooter}`,
      topic: "price",
    };
  }

  // 8) Services offered
  if (hasAny(q, kw.services)) {
    if (ctx.services.length === 0) return null;
    const names = ctx.services.map((s) => `• ${s.name}`);
    return { answer: `${t.servicesHeading}\n${names.join("\n")}`, topic: "services" };
  }

  // 9) Service area
  if (hasAny(q, kw.area)) {
    if (ctx.serviceAreaPostcodes.length === 0) return null;
    return {
      answer: `${t.areaLine(ctx.serviceAreaPostcodes.join(", "))}\n\n${t.areaHint}`,
      topic: "area",
    };
  }

  return null;
}

/** Re-exported for the AI path so both share one knowledge source. */
export { contextToBrief };
