"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { timeWindowSchema } from "@/lib/validation/hours";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function updateHours(formData: FormData) {
  const tenantId = await requireTenantId();

  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });

  const openingHours: Record<string, { start: string; end: string }[]> = {};

  for (const day of WEEKDAYS) {
    const closed = formData.get(`${day}_closed`) === "on";
    const start = String(formData.get(`${day}_start`) ?? "");
    const end = String(formData.get(`${day}_end`) ?? "");

    if (closed || !start || !end) {
      openingHours[day] = [];
      continue;
    }

    const parsed = timeWindowSchema.safeParse({ start, end });
    if (!parsed.success) {
      throw new Error("invalid_input");
    }
    openingHours[day] = [parsed.data];
  }

  await prisma.location.update({
    where: { id: location.id },
    data: { openingHours },
  });

  revalidatePath("/admin/hours");
}
