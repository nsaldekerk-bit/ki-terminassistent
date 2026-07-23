import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { answerQuestion } from "@/lib/faq/answer";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

export const maxDuration = 30;

const schema = z.object({
  tenantSlug: z.string().min(1),
  question: z.string().trim().min(2).max(500),
  lang: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const tenant = await resolveTenantBySlug(parsed.data.tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const locale = isLocale(parsed.data.lang) ? parsed.data.lang : DEFAULT_LOCALE;

  try {
    const result = await answerQuestion({
      tenantId: tenant.id,
      question: parsed.data.question,
      locale,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("faq error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
