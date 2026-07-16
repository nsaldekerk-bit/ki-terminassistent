import { prisma } from "@/lib/db";

/**
 * Single source of truth for "is this window still free?".
 *
 * Used by the booking path and the reschedule path so they can never drift
 * apart. Honours the tenant's travel-time buffer and closure days — otherwise a
 * customer could book straight through a buffer or into the holidays by
 * replaying an old slot.
 */
export async function findSlotConflict(params: {
  tenantId: string;
  slotStart: Date;
  slotEnd: Date;
  /** Request that should not count against itself (reschedule). */
  ignoreRequestId?: string;
}): Promise<"closed" | "taken" | null> {
  const { tenantId, slotStart, slotEnd, ignoreRequestId } = params;

  const location = await prisma.location.findFirst({
    where: { tenantId },
    select: { id: true, bufferMinutes: true },
  });

  // Closure day? Compare on the plain calendar date, as stored.
  const day = new Date(`${slotStart.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const closure = await prisma.absence.findFirst({
    where: { tenantId, startDate: { lte: day }, endDate: { gte: day } },
    select: { id: true },
  });
  if (closure) return "closed";

  // Widen the requested window by the buffer, so a new booking also keeps its
  // distance from neighbouring jobs.
  const pad = (location?.bufferMinutes ?? 0) * 60_000;
  const from = new Date(slotStart.getTime() - pad);
  const to = new Date(slotEnd.getTime() + pad);

  const [appointmentClash, requestClash] = await Promise.all([
    location
      ? prisma.appointment.findFirst({
          where: {
            tenantId,
            locationId: location.id,
            status: { not: "cancelled" },
            startTime: { lt: to },
            endTime: { gt: from },
          },
          select: { id: true },
        })
      : null,
    prisma.bookingRequest.findFirst({
      where: {
        tenantId,
        status: { not: "cancelled" },
        slotStart: { lt: to },
        slotEnd: { gt: from },
        ...(ignoreRequestId ? { id: { not: ignoreRequestId } } : {}),
      },
      select: { id: true },
    }),
  ]);

  return appointmentClash || requestClash ? "taken" : null;
}
