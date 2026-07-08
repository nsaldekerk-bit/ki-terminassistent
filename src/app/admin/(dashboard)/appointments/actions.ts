"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { updateAppointmentStatusSchema } from "@/lib/validation/appointment";

export async function updateAppointmentStatus(formData: FormData) {
  const tenantId = await requireTenantId();
  const id = String(formData.get("id"));

  const parsed = updateAppointmentStatusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }

  const appointment = await prisma.appointment.findFirst({ where: { id, tenantId } });
  if (!appointment) return;

  await prisma.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/appointments");
}
