"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

const faqSchema = z.object({
  question: z.string().trim().min(3).max(200),
  answer: z.string().trim().min(2).max(2000),
  keywords: z.string().trim().max(300).optional(),
});

export type FaqState = { ok?: boolean; error?: string } | null;

export async function addFaqEntry(_prev: FaqState, formData: FormData): Promise<FaqState> {
  const tenantId = await requireTenantId();

  const parsed = faqSchema.safeParse({
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    keywords: String(formData.get("keywords") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Bitte geben Sie eine Frage und eine Antwort ein." };
  }

  const last = await prisma.faqEntry.findFirst({
    where: { tenantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.faqEntry.create({
    data: {
      tenantId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      keywords: parsed.data.keywords || null,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/faq");
  return { ok: true };
}

export async function deleteFaqEntry(formData: FormData) {
  const tenantId = await requireTenantId();
  const id = String(formData.get("id") ?? "");

  const entry = await prisma.faqEntry.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!entry) return;

  await prisma.faqEntry.delete({ where: { id: entry.id } });
  revalidatePath("/admin/faq");
}
