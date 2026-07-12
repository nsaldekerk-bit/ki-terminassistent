import { NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { prisma } from "@/lib/db";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { getWidgetAvailability } from "@/lib/availability/widget";

export const maxDuration = 20;

const schema = z.object({
  tenantSlug: z.string().min(1),
  mode: z.enum(["consultation", "booking"]),
  serviceId: z.string().uuid().nullish(),
});

const CONSULTATION_MINUTES = 30;
const DEFAULT_BOOKING_MINUTES = 60;
const RANGE_DAYS = 28;

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

  let durationMinutes = CONSULTATION_MINUTES;
  if (parsed.data.mode === "booking") {
    durationMinutes = DEFAULT_BOOKING_MINUTES;
    if (parsed.data.serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: parsed.data.serviceId, tenantId: tenant.id },
        select: { durationMinutes: true },
      });
      if (service) durationMinutes = service.durationMinutes;
    }
  }

  const fromDate = new Date();
  const toDate = addDays(fromDate, RANGE_DAYS);

  try {
    const availability = await getWidgetAvailability({
      tenantId: tenant.id,
      durationMinutes,
      fromDate,
      toDate,
    });
    return NextResponse.json({ durationMinutes, ...availability });
  } catch (error) {
    console.error("availability error", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
