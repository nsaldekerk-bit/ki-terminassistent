import { NextResponse } from "next/server";
import { bookingRequestSchema } from "@/lib/validation/booking-request";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { createBookingRequest, SlotTakenError } from "@/lib/requests/create";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);

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
    const result = await createBookingRequest(parsed.data, { id: tenant.id, name: tenant.name });
    return NextResponse.json({ success: true, reference: result.reference });
  } catch (error) {
    if (error instanceof SlotTakenError) {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    console.error("request submission error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
