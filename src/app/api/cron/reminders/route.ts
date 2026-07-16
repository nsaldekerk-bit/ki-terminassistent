import { NextResponse } from "next/server";
import { addHours } from "date-fns";
import { prisma } from "@/lib/db";
import { getMailer } from "@/lib/mail";
import { manageUrlFor } from "@/lib/requests/token";
import { requestReminderEmail } from "@/lib/mail/templates/request-reminder";

export const maxDuration = 60;

/**
 * The job runs once in the evening (Vercel Hobby allows one run per day), so
 * the window has to span the whole of tomorrow rather than a tight 24h band.
 * Firing at 17:00 UTC this covers ~23:00 tonight through ~23:00 tomorrow.
 * `reminderSentAt` makes a wide window safe — nobody is reminded twice.
 */
const WINDOW_START_HOURS = 6;
const WINDOW_END_HOURS = 30;

/**
 * Reminds customers of tomorrow's appointment. Triggered by Vercel Cron
 * (see vercel.json).
 *
 * Guarded by CRON_SECRET so nobody can spam customers by hitting the URL.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured — refusing to send reminders");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.bookingRequest.findMany({
    where: {
      status: { not: "cancelled" },
      reminderSentAt: null,
      slotStart: { gte: addHours(now, WINDOW_START_HOURS), lte: addHours(now, WINDOW_END_HOURS) },
    },
    include: {
      tenant: { select: { name: true } },
      customer: { select: { name: true, email: true } },
      service: { select: { name: true } },
    },
    take: 200,
  });

  const mailer = getMailer();
  let sent = 0;
  let skipped = 0;

  for (const req of due) {
    if (!req.customer.email || !req.slotStart || !req.slotEnd) {
      // Nothing to send to — mark it so we don't re-check it every hour.
      await prisma.bookingRequest.update({
        where: { id: req.id },
        data: { reminderSentAt: now },
      });
      skipped++;
      continue;
    }

    const location = await prisma.location.findFirst({
      where: { tenantId: req.tenantId },
      select: { timezone: true },
    });

    const email = requestReminderEmail({
      tenantName: req.tenant.name,
      customerName: req.customer.name,
      reference: req.reference,
      serviceLabel: req.serviceLabel ?? req.service?.name ?? null,
      slotStart: req.slotStart,
      slotEnd: req.slotEnd,
      address: req.address,
      timezone: location?.timezone ?? "Europe/Berlin",
      manageUrl: req.manageToken ? manageUrlFor(req.manageToken) : null,
    });

    try {
      await mailer.send({ to: req.customer.email, ...email });
      // Only mark as sent once the send actually succeeded, so a transient
      // failure gets retried on the next run instead of silently dropping.
      await prisma.bookingRequest.update({
        where: { id: req.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (error) {
      console.error(`Reminder failed for ${req.reference}`, error);
    }
  }

  return NextResponse.json({ due: due.length, sent, skipped });
}
