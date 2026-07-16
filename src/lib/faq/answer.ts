import Anthropic from "@anthropic-ai/sdk";
import { contextToBrief, loadFaqContext, type FaqContext } from "@/lib/faq/context";
import { answerByRules } from "@/lib/faq/rules";

/**
 * Default to the most capable model. Override with ANTHROPIC_MODEL — e.g.
 * `claude-haiku-4-5` cuts the per-question cost roughly 5x, which is plenty for
 * looking facts up in a short business brief.
 */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
/** A FAQ reply is deliberately short — no need for a large budget. */
const MAX_TOKENS = 500;

export type AnswerSource = "rules" | "ai" | "none";

export interface FaqAnswer {
  answer: string;
  source: AnswerSource;
  topic?: string;
  /** True when we could not answer and should offer a callback instead. */
  needsHuman: boolean;
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // AI simply stays off until a key is configured
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_RULES = `Du bist der Assistent auf der Website eines Handwerksbetriebs und beantwortest Fragen von Kundinnen und Kunden.

Regeln:
- Antworte NUR mit Informationen aus den Betriebsdaten unten. Erfinde nichts — keine Preise, Zeiten, Adressen oder Zusagen, die dort nicht stehen.
- Steht die Information nicht in den Daten, sage genau das offen und biete an, dass sich der Betrieb meldet.
- Antworte kurz: ein bis drei Sätze, keine Aufzählung außer bei echten Listen wie Öffnungszeiten.
- Schreibe auf Deutsch und siez die Kundschaft.
- Du nimmst keine Termine entgegen und triffst keine Absprachen. Für einen Termin verweist du auf die Auswahl im Assistenten.
- Keine Beratung zu Reparaturen, keine Kostenschätzung, keine Ferndiagnose.`;

/**
 * Hybrid FAQ: rules answer the predictable questions for free and instantly.
 * Anything else goes to Claude — but only if a key is configured. Without one,
 * we say so honestly and offer a callback rather than guessing.
 */
export async function answerQuestion(params: {
  tenantId: string;
  question: string;
  ctx?: FaqContext;
}): Promise<FaqAnswer> {
  const { tenantId, question } = params;
  const ctx = params.ctx ?? (await loadFaqContext(tenantId));

  const byRule = answerByRules(question, ctx);
  if (byRule) {
    return { answer: byRule.answer, source: "rules", topic: byRule.topic, needsHuman: false };
  }

  const ai = getClient();
  if (!ai) {
    return { answer: fallbackText(ctx), source: "none", needsHuman: true };
  }

  try {
    const response = await ai.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: `${SYSTEM_RULES}\n\n--- Betriebsdaten ---\n${contextToBrief(ctx)}`,
      messages: [{ role: "user", content: question }],
    });

    if (response.stop_reason === "refusal") {
      return { answer: fallbackText(ctx), source: "none", needsHuman: true };
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text) {
      return { answer: fallbackText(ctx), source: "none", needsHuman: true };
    }

    return { answer: text, source: "ai", needsHuman: false };
  } catch (error) {
    // Never let a failing AI call break the widget — fall back to a human.
    console.error("FAQ AI call failed", error);
    return { answer: fallbackText(ctx), source: "none", needsHuman: true };
  }
}

function fallbackText(ctx: FaqContext): string {
  const call = ctx.phone ? ` Sie erreichen uns auch direkt unter ${ctx.phone}.` : "";
  return `Das kann ich Ihnen leider nicht sicher beantworten — da möchte ich Sie nicht falsch informieren.${call} Soll ich Ihnen einen Rückruf organisieren?`;
}
