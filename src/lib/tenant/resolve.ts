import { prisma } from "@/lib/db";
import type { Tenant } from "@prisma/client";

export async function resolveTenantBySlug(slug: string): Promise<Tenant | null> {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.subscriptionStatus !== "active") {
    return null;
  }
  return tenant;
}
