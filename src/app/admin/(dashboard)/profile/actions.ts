"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

const profileSchema = z.object({
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(60).optional(),
  email: z.string().trim().max(200).optional(),
  website: z.string().trim().max(200).optional(),
  emergencyPhone: z.string().trim().max(60).optional(),
  emergencyNote: z.string().trim().max(300).optional(),
  bufferMinutes: z.coerce.number().int().min(0).max(240),
  serviceAreaPostcodes: z.array(z.string().regex(/^\d{5}$/)).max(200),
});

export type ProfileState = { ok?: boolean; error?: string } | null;

/** Turns "44137, 44139 44141" into ["44137","44139","44141"]. */
function parsePostcodes(raw: string): string[] {
  return [...new Set(raw.split(/[^\d]+/).filter((p) => p.length > 0))];
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });

  const postcodes = parsePostcodes(String(formData.get("serviceAreaPostcodes") ?? ""));

  const parsed = profileSchema.safeParse({
    address: String(formData.get("address") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    website: String(formData.get("website") ?? ""),
    emergencyPhone: String(formData.get("emergencyPhone") ?? ""),
    emergencyNote: String(formData.get("emergencyNote") ?? ""),
    bufferMinutes: formData.get("bufferMinutes") ?? 0,
    serviceAreaPostcodes: postcodes,
  });

  if (!parsed.success) {
    const bad = parsed.error.issues[0];
    if (bad?.path[0] === "serviceAreaPostcodes") {
      return { error: "Postleitzahlen müssen fünfstellig sein, z. B. 44137." };
    }
    if (bad?.path[0] === "bufferMinutes") {
      return { error: "Die Fahrzeit muss zwischen 0 und 240 Minuten liegen." };
    }
    return { error: "Bitte prüfen Sie Ihre Eingaben." };
  }

  const d = parsed.data;
  await prisma.location.update({
    where: { id: location.id },
    data: {
      address: d.address || null,
      phone: d.phone || null,
      email: d.email || null,
      website: d.website || null,
      emergencyPhone: d.emergencyPhone || null,
      emergencyNote: d.emergencyNote || null,
      bufferMinutes: d.bufferMinutes,
      serviceAreaPostcodes: d.serviceAreaPostcodes,
    },
  });

  revalidatePath("/admin/profile");
  return { ok: true };
}
