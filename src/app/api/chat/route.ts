import { NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validation/chat";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { handleIncomingMessage } from "@/lib/ai/chat-service";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tenant = await resolveTenantBySlug(parsed.data.tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  try {
    const result = await handleIncomingMessage({
      tenantId: tenant.id,
      conversationId: parsed.data.conversationId,
      message: parsed.data.message,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("chat error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
