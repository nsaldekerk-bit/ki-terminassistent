import { contextToBrief, formatPrice, type FaqContext } from "@/lib/faq/context";

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
export function answerByRules(question: string, ctx: FaqContext): RuleAnswer | null {
  const q = normalize(question);
  if (q.length < 2) return null;

  // 1) The business's own entries win — they are the most specific.
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
  if (
    hasAny(q, [
      "offnungszeit", "offnungszeiten", "geoffnet", "offen ", "auf haben", "wann offen",
      "wann geoffnet", "wann macht", "wann habt", "wann haben sie", "sprechzeit", "wie lange offen",
      "samstag", "sonntag", "wochenende", "feiertag",
    ])
  ) {
    if (ctx.hoursLines.length === 0) {
      return null; // nothing stored — let the AI or the fallback handle it
    }
    let answer = `Unsere Öffnungszeiten:\n${ctx.hoursLines.join("\n")}`;
    if (q.includes("samstag") && !ctx.hoursLines.some((l) => l.startsWith("Samstag"))) {
      answer = `Samstags haben wir geschlossen.\n\nUnsere Öffnungszeiten:\n${ctx.hoursLines.join("\n")}`;
    }
    if (q.includes("sonntag") && !ctx.hoursLines.some((l) => l.startsWith("Sonntag"))) {
      answer = `Sonntags haben wir geschlossen.\n\nUnsere Öffnungszeiten:\n${ctx.hoursLines.join("\n")}`;
    }
    if (ctx.closures.length > 0) {
      answer += `\n\nGeschlossen: ${ctx.closures.join("; ")}`;
    }
    return { answer, topic: "hours" };
  }

  // 3) Emergency / out-of-hours
  if (hasAny(q, ["notdienst", "notfall", "notruf", "dringend", "sofort", "rohrbruch", "wasserschaden"])) {
    if (ctx.emergencyPhone) {
      const note = ctx.emergencyNote ? ` ${ctx.emergencyNote}` : "";
      return {
        answer: `Im Notfall erreichen Sie uns unter ${ctx.emergencyPhone}.${note}`,
        topic: "emergency",
      };
    }
    if (ctx.phone) {
      return {
        answer: `Bei dringenden Fällen rufen Sie uns bitte direkt an: ${ctx.phone}.`,
        topic: "emergency",
      };
    }
    return null;
  }

  // 4) Address / location
  if (hasAny(q, ["adresse", "anschrift", "wo sind", "wo seid", "wo finde", "wo befindet", "standort", "sitz", "anfahrt", "wo ist"])) {
    if (!ctx.address) return null;
    return { answer: `Sie finden uns hier:\n${ctx.address}`, topic: "address" };
  }

  // 5) Phone / contact
  if (hasAny(q, ["telefon", "telefonnummer", "nummer", "anrufen", "durchwahl", "erreichbar", "kontakt", "handy"])) {
    const bits: string[] = [];
    if (ctx.phone) bits.push(`Telefon: ${ctx.phone}`);
    if (ctx.email) bits.push(`E-Mail: ${ctx.email}`);
    if (ctx.emergencyPhone) bits.push(`Notdienst: ${ctx.emergencyPhone}`);
    if (bits.length === 0) return null;
    return { answer: `So erreichen Sie uns:\n${bits.join("\n")}`, topic: "contact" };
  }

  // 6) E-Mail specifically
  if (hasAny(q, ["email", "e mail", "mailadresse", "mail schreiben"])) {
    if (!ctx.email) return null;
    return { answer: `Sie erreichen uns per E-Mail unter ${ctx.email}.`, topic: "email" };
  }

  // 7) Prices
  if (hasAny(q, ["preis", "kostet", "kosten", "teuer", "gunstig", "angebot", "kostenvoranschlag", "was zahle"])) {
    const priced = ctx.services.filter((s) => s.priceCents != null);
    if (priced.length === 0) {
      return {
        answer:
          "Die Kosten hängen vom Aufwand ab. Schildern Sie uns kurz Ihr Anliegen — am besten mit Foto — dann melden wir uns mit einem konkreten Angebot.",
        topic: "price",
      };
    }
    const lines = priced.map((s) => `${s.name}: ab ${formatPrice(s.priceCents!)}`);
    return {
      answer: `Unsere Richtpreise:\n${lines.join("\n")}\n\nDer genaue Preis hängt vom Aufwand ab — wir melden uns mit einem konkreten Angebot.`,
      topic: "price",
    };
  }

  // 8) Services offered
  if (hasAny(q, ["leistung", "leistungen", "machen sie", "macht ihr", "bieten sie", "bietet ihr", "angebot", "konnen sie", "konnt ihr", "ubernehmen sie", "reparieren", "einbauen", "montieren"])) {
    if (ctx.services.length === 0) return null;
    const names = ctx.services.map((s) => `• ${s.name}`);
    return { answer: `Wir bieten:\n${names.join("\n")}`, topic: "services" };
  }

  // 9) Service area
  if (hasAny(q, ["einzugsgebiet", "kommen sie", "kommt ihr", "fahren sie", "gebiet", "umkreis", "postleitzahl", "wohne in", "auch nach"])) {
    if (ctx.serviceAreaPostcodes.length === 0) return null;
    return {
      answer: `Wir arbeiten in diesen Postleitzahlen: ${ctx.serviceAreaPostcodes.join(", ")}.\n\nGeben Sie im Termin-Assistenten einfach Ihre Postleitzahl ein — dann sagen wir Ihnen sofort, ob wir zu Ihnen kommen.`,
      topic: "area",
    };
  }

  return null;
}

/** Re-exported for the AI path so both share one knowledge source. */
export { contextToBrief };
