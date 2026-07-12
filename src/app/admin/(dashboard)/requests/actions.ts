"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getMailer } from "@/lib/mail";

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "scheduled", "closed"]),
});

export type ReplyState = { ok?: boolean; error?: string } | null;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export async function sendRequestReply(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const tenantId = await requireTenantId();
  const id = String(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();

  if (body.length < 2) {
    return { error: "Bitte geben Sie eine Nachricht ein." };
  }

  const request = await prisma.bookingRequest.findFirst({
    where: { id, tenantId },
    include: { customer: true, tenant: true },
  });
  if (!request) {
    return { error: "Anfrage nicht gefunden." };
  }
  if (!request.customer.email) {
    return { error: "Für diesen Kunden ist keine E-Mail-Adresse hinterlegt." };
  }

  const owner = await prisma.adminUser.findFirst({ where: { tenantId } });
  const subject = `Ihre Anfrage bei ${request.tenant.name} (${request.reference})`;
  const html =
    `<div style="white-space:pre-wrap">${escapeHtml(body)}</div>` +
    `<hr style="border:none;border-top:1px solid #ddd;margin:16px 0"/>` +
    `<p style="color:#888;font-size:12px">Antwort zu Ihrer Anfrage ${request.reference} bei ${request.tenant.name}.</p>`;

  try {
    await getMailer().send({
      to: request.customer.email,
      replyTo: owner?.email ?? undefined,
      subject,
      text: body,
      html,
    });
  } catch (err) {
    console.error("Failed to send reply email", err);
    return { error: "E-Mail konnte nicht gesendet werden. Ist der E-Mail-Versand eingerichtet?" };
  }

  await prisma.bookingRequest.update({ where: { id }, data: { status: "contacted" } });
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin/requests");
  return { ok: true };
}

export async function updateRequestStatus(formData: FormData) {
  const tenantId = await requireTenantId();
  const id = String(formData.get("id"));

  const parsed = statusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) {
    throw new Error("invalid_input");
  }

  const request = await prisma.bookingRequest.findFirst({ where: { id, tenantId } });
  if (!request) return;

  await prisma.bookingRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
}
