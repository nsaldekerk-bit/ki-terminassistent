"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { serviceInputSchema } from "@/lib/validation/service";

export async function createService(formData: FormData) {
  const tenantId = await requireTenantId();

  const priceRaw = formData.get("priceCents");

  const parsed = serviceInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    category: formData.get("category") ? String(formData.get("category")) : undefined,
    durationMinutes: Number(formData.get("durationMinutes")),
    priceCents: priceRaw ? Math.round(Number(priceRaw) * 100) : undefined,
    isEmergency: formData.get("isEmergency") === "on",
  });

  if (!parsed.success) {
    throw new Error("invalid_input");
  }

  await prisma.service.create({
    data: { tenantId, ...parsed.data },
  });

  revalidatePath("/admin/services");
}

export async function deleteService(formData: FormData) {
  const tenantId = await requireTenantId();
  const id = String(formData.get("id"));

  const service = await prisma.service.findFirst({ where: { id, tenantId } });
  if (!service) return;

  try {
    await prisma.service.delete({ where: { id } });
  } catch {
    throw new Error("service_in_use");
  }

  revalidatePath("/admin/services");
}
