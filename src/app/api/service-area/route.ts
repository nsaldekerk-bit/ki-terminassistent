import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";

export const maxDuration = 15;

const schema = z.object({
  tenantSlug: z.string().min(1),
  postcode: z.string().trim().regex(/^\d{5}$/),
});

/**
 * Tells the customer straight away whether the business travels to them, so
 * neither side wastes a callback on a job that was never in range.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_postcode" }, { status: 400 });
  }

  const tenant = await resolveTenantBySlug(parsed.data.tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const location = await prisma.location.findFirst({
    where: { tenantId: tenant.id },
    select: { serviceAreaPostcodes: true, phone: true },
  });

  const areas = location?.serviceAreaPostcodes ?? [];

  // No postcodes configured means the business hasn't limited its area —
  // never turn a customer away on missing data.
  if (areas.length === 0) {
    return NextResponse.json({ covered: true, checked: false });
  }

  return NextResponse.json({
    covered: areas.includes(parsed.data.postcode),
    checked: true,
    phone: location?.phone ?? null,
  });
}
