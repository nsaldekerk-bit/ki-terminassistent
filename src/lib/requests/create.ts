import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { getMailer } from "@/lib/mail";
import { requestNotificationEmail } from "@/lib/mail/templates/request-notification";
import { requestConfirmationEmail } from "@/lib/mail/templates/request-confirmation";
import { createManageToken, manageUrlFor } from "@/lib/requests/token";
import { findSlotConflict } from "@/lib/availability/conflicts";
import type { BookingRequestInput } from "@/lib/validation/booking-request";

export class SlotTakenError extends Error {
  constructor() {
    super("slot_taken");
    this.name = "SlotTakenError";
  }
}

function makeReference(name: string): string {
  const initials =
    (name.match(/\p{L}+/gu) ?? [])
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "KT";
  const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${initials}-${ymd}-${rand}`;
}

export interface CreatedRequest {
  reference: string;
  requestId: string;
  /** Link the customer uses to reschedule or cancel without an account. */
  manageUrl: string;
}

export async function createBookingRequest(
  input: BookingRequestInput,
  tenant: { id: string; name: string }
): Promise<CreatedRequest> {
  const { customer, photos } = input;

  const location = await prisma.location.findFirst({ where: { tenantId: tenant.id } });
  const timezone = location?.timezone ?? "Europe/Berlin";

  // Only accept a serviceId that actually belongs to this tenant.
  let serviceId: string | null = null;
  if (input.serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: input.serviceId, tenantId: tenant.id },
      select: { id: true },
    });
    serviceId = service?.id ?? null;
  }

  // Resolve the chosen time slot, if the customer picked one from the calendar.
  let slotStart: Date | null = null;
  let slotEnd: Date | null = null;
  let preferredDate: Date | null = input.preferredDate ? new Date(`${input.preferredDate}T00:00:00`) : null;
  let preferredTime: string | null = input.preferredTime ?? null;

  if (input.slotStart) {
    slotStart = new Date(input.slotStart);
    slotEnd = input.slotEnd ? new Date(input.slotEnd) : addMinutes(slotStart, 30);

    // Make sure the slot is still free (guards against two people picking it,
    // and against booking into a closure or through the travel-time buffer).
    const conflict = await findSlotConflict({
      tenantId: tenant.id,
      slotStart,
      slotEnd,
    });
    if (conflict) {
      throw new SlotTakenError();
    }

    preferredDate = slotStart;
    preferredTime = `${formatInTimeZone(slotStart, timezone, "HH:mm")}–${formatInTimeZone(slotEnd, timezone, "HH:mm")} Uhr`;
  }

  const customerName = `${customer.vorname} ${customer.nachname}`.trim();
  const customerRecord = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: customerName,
      email: customer.email,
      phone: customer.telefon,
      address: input.address ?? undefined,
    },
  });

  const reference = makeReference(tenant.name);
  const manageToken = createManageToken();
  const request = await prisma.bookingRequest.create({
    data: {
      tenantId: tenant.id,
      customerId: customerRecord.id,
      serviceId: serviceId ?? undefined,
      type: input.type,
      reference,
      manageToken,
      serviceLabel: input.serviceLabel ?? undefined,
      areaText: input.areaText ?? undefined,
      situation: input.situation ?? undefined,
      address: input.address ?? undefined,
      postcode: input.postcode ?? undefined,
      isEmergency: input.isEmergency,
      consentAt: input.consent ? new Date() : undefined,
      preferredDate: preferredDate ?? undefined,
      preferredTime: preferredTime ?? undefined,
      slotStart: slotStart ?? undefined,
      slotEnd: slotEnd ?? undefined,
      photos: photos.length ? { create: photos.map((dataUrl) => ({ dataUrl })) } : undefined,
    },
  });

  // Best-effort notifications. Uses the configured mail provider (console in
  // dev), and never blocks or fails the customer's submission.
  const manageUrl = manageUrlFor(manageToken);

  void sendNotifications({
    tenant,
    input,
    reference,
    customerName,
    photoCount: photos.length,
    timezone,
    preferredDate,
    preferredTime,
    hasSlot: slotStart !== null,
    manageUrl,
  }).catch((err) => {
    console.error("Failed to send request notification emails", err);
  });

  return { reference, requestId: request.id, manageUrl };
}

async function sendNotifications(params: {
  tenant: { id: string; name: string };
  input: BookingRequestInput;
  reference: string;
  customerName: string;
  photoCount: number;
  timezone: string;
  preferredDate: Date | null;
  preferredTime: string | null;
  hasSlot: boolean;
  manageUrl: string;
}) {
  const { tenant, input, reference, customerName, photoCount, timezone, preferredDate, preferredTime, hasSlot, manageUrl } =
    params;

  const owner = await prisma.adminUser.findFirst({ where: { tenantId: tenant.id } });
  const mailer = getMailer();

  // 1) Notify the business owner about the new request.
  if (owner?.email) {
    const email = requestNotificationEmail({
      type: input.type,
      reference,
      customerName,
      customerPhone: input.customer.telefon,
      customerEmail: input.customer.email,
      serviceLabel: input.serviceLabel,
      areaText: input.areaText,
      situation: input.situation,
      address: input.address,
      preferredDate,
      preferredTime,
      photoCount,
      timezone,
      isEmergency: input.isEmergency,
    });
    await mailer.send({ to: owner.email, ...email }).catch((err) => {
      console.error("Failed to send owner notification email", err);
    });
  }

  // 2) Send the customer an instant confirmation of their booking/request.
  const email = requestConfirmationEmail({
    tenantName: tenant.name,
    customerName,
    type: input.type,
    reference,
    serviceLabel: input.serviceLabel,
    preferredDate,
    preferredTime,
    hasSlot,
    timezone,
    manageUrl,
  });
  await mailer
    .send({ to: input.customer.email, replyTo: owner?.email ?? undefined, ...email })
    .catch((err) => {
      console.error("Failed to send customer confirmation email", err);
    });
}
