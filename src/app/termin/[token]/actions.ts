"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SlotTakenError } from "@/lib/requests/create";
import { RequestClosedError, RequestNotFoundError, cancelRequest, rescheduleRequest } from "@/lib/requests/manage";

export type ManageState = { ok?: "rescheduled" | "cancelled"; error?: string } | null;

const rescheduleSchema = z.object({
  token: z.string().min(1),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
});

function messageFor(error: unknown): string {
  if (error instanceof SlotTakenError) {
    return "Diese Zeit ist inzwischen leider vergeben. Bitte wählen Sie eine andere.";
  }
  if (error instanceof RequestClosedError) {
    return "Dieser Termin kann nicht mehr geändert werden. Bitte rufen Sie uns kurz an.";
  }
  if (error instanceof RequestNotFoundError) {
    return "Dieser Termin wurde nicht gefunden. Bitte prüfen Sie Ihren Link.";
  }
  console.error("manage booking error", error);
  return "Da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.";
}

export async function rescheduleBooking(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const parsed = rescheduleSchema.safeParse({
    token: formData.get("token"),
    slotStart: formData.get("slotStart"),
    slotEnd: formData.get("slotEnd"),
  });

  if (!parsed.success) {
    return { error: "Bitte wählen Sie zuerst eine neue Zeit aus." };
  }

  try {
    await rescheduleRequest({
      token: parsed.data.token,
      slotStart: new Date(parsed.data.slotStart),
      slotEnd: new Date(parsed.data.slotEnd),
    });
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/termin/${parsed.data.token}`);
  return { ok: "rescheduled" };
}

export async function cancelBooking(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Dieser Termin wurde nicht gefunden." };

  try {
    await cancelRequest({ token });
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/termin/${token}`);
  return { ok: "cancelled" };
}
