"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

const absenceSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, { path: ["endDate"] });

export type AbsenceState = { ok?: boolean; error?: string } | null;

export async function addAbsence(_prev: AbsenceState, formData: FormData): Promise<AbsenceState> {
  const tenantId = await requireTenantId();

  const parsed = absenceSchema.safeParse({
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    const isRange = parsed.error.issues.some((i) => i.path[0] === "endDate");
    return {
      error: isRange
        ? "Das Enddatum darf nicht vor dem Startdatum liegen."
        : "Bitte geben Sie Start- und Enddatum an.",
    };
  }

  await prisma.absence.create({
    data: {
      tenantId,
      // Dates are stored as plain calendar days (@db.Date), so build them at
      // UTC midnight — no timezone shifting the day by one.
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath("/admin/absences");
  return { ok: true };
}

export async function deleteAbsence(formData: FormData) {
  const tenantId = await requireTenantId();
  const id = String(formData.get("id") ?? "");

  // Scope by tenant so one business can never delete another's closure.
  const absence = await prisma.absence.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!absence) return;

  await prisma.absence.delete({ where: { id: absence.id } });
  revalidatePath("/admin/absences");
}
