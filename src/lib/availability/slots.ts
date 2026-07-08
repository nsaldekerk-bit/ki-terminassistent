import { addDays, addMinutes, parseISO } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";

type TimeWindow = { start: string; end: string };
type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type OpeningHours = Partial<Record<WeekdayKey, TimeWindow[]>>;

const WEEKDAY_KEYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SLOT_STEP_MINUTES = 30;
const MIN_LEAD_TIME_MINUTES = 60;

export interface Slot {
  start: string;
  end: string;
}

export async function getBookableSlots(params: {
  tenantId: string;
  locationId: string;
  serviceId: string;
  fromDate: Date;
  toDate: Date;
}): Promise<Slot[]> {
  const { tenantId, locationId, serviceId, fromDate, toDate } = params;

  const [location, service, existingAppointments] = await Promise.all([
    prisma.location.findFirstOrThrow({ where: { id: locationId, tenantId } }),
    prisma.service.findFirstOrThrow({ where: { id: serviceId, tenantId } }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        locationId,
        status: { not: "cancelled" },
        startTime: { lt: toDate },
        endTime: { gt: fromDate },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const openingHours = location.openingHours as OpeningHours;
  const timezone = location.timezone;
  const durationMinutes = service.durationMinutes;

  const now = new Date();
  const earliestBookable = addMinutes(now, MIN_LEAD_TIME_MINUTES);

  const slots: Slot[] = [];

  const firstDateStr = formatInTimeZone(fromDate, timezone, "yyyy-MM-dd");
  const lastDateStr = formatInTimeZone(toDate, timezone, "yyyy-MM-dd");

  let cursor = parseISO(`${firstDateStr}T00:00:00.000Z`);
  const last = parseISO(`${lastDateStr}T00:00:00.000Z`);

  while (cursor.getTime() <= last.getTime()) {
    const dateStr = formatInTimeZone(cursor, "UTC", "yyyy-MM-dd");
    const weekdayIndex = cursor.getUTCDay();
    const windows = openingHours[WEEKDAY_KEYS[weekdayIndex]] ?? [];

    for (const window of windows) {
      const windowStartUtc = fromZonedTime(`${dateStr}T${window.start}:00`, timezone);
      const windowEndUtc = fromZonedTime(`${dateStr}T${window.end}:00`, timezone);

      let slotStart = windowStartUtc;
      while (true) {
        const slotEnd = addMinutes(slotStart, durationMinutes);
        if (slotEnd.getTime() > windowEndUtc.getTime()) break;

        const overlapsExisting = existingAppointments.some(
          (appt) => slotStart.getTime() < appt.endTime.getTime() && slotEnd.getTime() > appt.startTime.getTime()
        );
        const beforeLeadTime = slotStart.getTime() < earliestBookable.getTime();
        const outsideRange = slotStart.getTime() < fromDate.getTime() || slotStart.getTime() >= toDate.getTime();

        if (!overlapsExisting && !beforeLeadTime && !outsideRange) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
        }

        slotStart = addMinutes(slotStart, SLOT_STEP_MINUTES);
      }
    }

    cursor = addDays(cursor, 1);
  }

  return slots;
}
