import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { getMailer } from "@/lib/mail";
import { SlotTakenError } from "@/lib/requests/create";
import { findSlotConflict } from "@/lib/availability/conflicts";
import { manageUrlFor } from "@/lib/requests/token";
import { requestChangeConfirmationEmail } from "@/lib/mail/templates/request-change-confirmation";
import { requestChangeNotificationEmail } from "@/lib/mail/templates/request-change-notification";

/** How long after its slot a booking can still be managed by the customer. */
const MANAGE_GRACE_MINUTES = 0;
/** A customer may not move an appointment to less than this from now. */
const MIN_LEAD_TIME_MINUTES = 60;

export class RequestNotFoundError extends Error {
  constructor() {
    super("request_not_found");
    this.name = "RequestNotFoundError";
  }
}

export class RequestClosedError extends Error {
  constructor() {
    super("request_closed");
    this.name = "RequestClosedError";
  }
}

export type ManageableRequest = NonNullable<Awaited<ReturnType<typeof getRequestByToken>>>;

export async function getRequestByToken(token: string) {
  if (!token) return null;
  const request = await prisma.bookingRequest.findUnique({
    where: { manageToken: token },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      customer: { select: { name: true, email: true } },
      service: { select: { id: true, name: true, durationMinutes: true } },
    },
  });
  return request;
}

/**
 * Whether the customer is still allowed to change this booking themselves.
 * Past and cancelled bookings are read-only — for those they have to call.
 */
export function manageState(request: {
  status: string;
  slotStart: Date | null;
  slotEnd: Date | null;
}): { editable: boolean; reason?: "cancelled" | "past" | "no_slot" } {
  if (request.status === "cancelled") return { editable: false, reason: "cancelled" };
  if (!request.slotStart || !request.slotEnd) return { editable: false, reason: "no_slot" };
  const deadline = request.slotStart.getTime() + MANAGE_GRACE_MINUTES * 60_000;
  if (deadline <= Date.now()) return { editable: false, reason: "past" };
  return { editable: true };
}

export async function rescheduleRequest(params: {
  token: string;
  slotStart: Date;
  slotEnd: Date;
}): Promise<{ reference: string }> {
  const { token, slotStart, slotEnd } = params;

  const request = await getRequestByToken(token);
  if (!request) throw new RequestNotFoundError();
  if (!manageState(request).editable) throw new RequestClosedError();

  if (slotEnd.getTime() <= slotStart.getTime()) throw new SlotTakenError();
  if (slotStart.getTime() < Date.now() + MIN_LEAD_TIME_MINUTES * 60_000) {
    throw new SlotTakenError();
  }

  const conflict = await findSlotConflict({
    tenantId: request.tenantId,
    slotStart,
    slotEnd,
    ignoreRequestId: request.id,
  });
  if (conflict) throw new SlotTakenError();

  const location = await prisma.location.findFirst({
    where: { tenantId: request.tenantId },
    select: { timezone: true },
  });
  const timezone = location?.timezone ?? "Europe/Berlin";
  const preferredTime =
    `${formatInTimeZone(slotStart, timezone, "HH:mm")}–${formatInTimeZone(slotEnd, timezone, "HH:mm")} Uhr`;

  const previousStart = request.slotStart;

  await prisma.bookingRequest.update({
    where: { id: request.id },
    data: {
      slotStart,
      slotEnd,
      preferredDate: slotStart,
      preferredTime,
      rescheduledAt: new Date(),
      // A moved appointment needs the business to look at it again.
      status: "new",
    },
  });

  void notifyChange({
    kind: "rescheduled",
    request,
    timezone,
    newStart: slotStart,
    newTime: preferredTime,
    previousStart,
  }).catch((err) => console.error("Failed to send reschedule emails", err));

  return { reference: request.reference };
}

export async function cancelRequest(params: { token: string }): Promise<{ reference: string }> {
  const { token } = params;

  const request = await getRequestByToken(token);
  if (!request) throw new RequestNotFoundError();
  if (!manageState(request).editable) throw new RequestClosedError();

  const location = await prisma.location.findFirst({
    where: { tenantId: request.tenantId },
    select: { timezone: true },
  });
  const timezone = location?.timezone ?? "Europe/Berlin";

  await prisma.bookingRequest.update({
    where: { id: request.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      // Free the slot again so someone else can book it.
      slotStart: null,
      slotEnd: null,
    },
  });

  void notifyChange({
    kind: "cancelled",
    request,
    timezone,
    previousStart: request.slotStart,
  }).catch((err) => console.error("Failed to send cancellation emails", err));

  return { reference: request.reference };
}

async function notifyChange(params: {
  kind: "rescheduled" | "cancelled";
  request: ManageableRequest;
  timezone: string;
  newStart?: Date;
  newTime?: string;
  previousStart: Date | null;
}) {
  const { kind, request, timezone, newStart, newTime, previousStart } = params;

  const owner = await prisma.adminUser.findFirst({ where: { tenantId: request.tenantId } });
  const mailer = getMailer();

  if (owner?.email) {
    const email = requestChangeNotificationEmail({
      kind,
      reference: request.reference,
      customerName: request.customer.name,
      customerEmail: request.customer.email,
      serviceLabel: request.serviceLabel,
      previousStart,
      newStart: newStart ?? null,
      newTime: newTime ?? null,
      timezone,
    });
    await mailer.send({ to: owner.email, ...email }).catch((err) => {
      console.error("Failed to send owner change notification", err);
    });
  }

  if (request.customer.email) {
    const email = requestChangeConfirmationEmail({
      kind,
      tenantName: request.tenant.name,
      customerName: request.customer.name,
      reference: request.reference,
      serviceLabel: request.serviceLabel,
      newStart: newStart ?? null,
      newTime: newTime ?? null,
      timezone,
      manageUrl: request.manageToken ? manageUrlFor(request.manageToken) : null,
    });
    await mailer
      .send({ to: request.customer.email, replyTo: owner?.email ?? undefined, ...email })
      .catch((err) => console.error("Failed to send customer change confirmation", err));
  }
}
