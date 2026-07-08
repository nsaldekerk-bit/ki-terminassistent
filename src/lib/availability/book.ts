import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import type { CreatedVia } from "@prisma/client";

export class SlotUnavailableError extends Error {
  constructor() {
    super("The requested time slot is no longer available.");
    this.name = "SlotUnavailableError";
  }
}

export async function createAppointment(input: {
  tenantId: string;
  locationId: string;
  serviceId: string;
  customerId: string;
  startTime: Date;
  createdVia: CreatedVia;
  employeeId?: string | null;
}) {
  const { tenantId, locationId, serviceId, customerId, startTime, createdVia, employeeId } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const service = await tx.service.findFirstOrThrow({ where: { id: serviceId, tenantId } });
      const endTime = addMinutes(startTime, service.durationMinutes);

      const overlapping = await tx.appointment.findFirst({
        where: {
          tenantId,
          locationId,
          status: { not: "cancelled" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (overlapping) {
        throw new SlotUnavailableError();
      }

      return tx.appointment.create({
        data: {
          tenantId,
          locationId,
          employeeId: employeeId ?? null,
          serviceId,
          customerId,
          startTime,
          endTime,
          status: "confirmed",
          createdVia,
        },
      });
    });
  } catch (error) {
    // Backstop: the DB exclusion constraint (appointments_no_overlap) rejects
    // any overlap that slipped past the transactional check above under a race.
    if (error instanceof Error && error.message.includes("appointments_no_overlap")) {
      throw new SlotUnavailableError();
    }
    throw error;
  }
}
