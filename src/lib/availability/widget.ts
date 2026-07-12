import { addDays, addMinutes, parseISO } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";

type TimeWindow = { start: string; end: string };
type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type OpeningHours = Partial<Record<WeekdayKey, TimeWindow[]>>;

const WEEKDAY_KEYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MIN_LEAD_TIME_MINUTES = 60;

export interface WidgetSlot {
  start: string; // ISO
  end: string; // ISO
  label: string; // "07:00"
  endLabel: string; // "07:30"
  available: boolean; // free and bookable
  taken: boolean; // occupied by an existing booking (show in red)
}

export interface WidgetDay {
  date: string; // "2026-07-20" in the tenant timezone
  weekday: number; // 0 = Sunday .. 6 = Saturday
  hasAvailable: boolean;
  slots: WidgetSlot[];
}

/**
 * Builds the full slot grid across a date range for the booking widget.
 * Unlike getBookableSlots (which only returns free slots), this also returns
 * occupied and past slots, flagged, so the calendar can grey them out / show
 * them in red.
 */
export async function getWidgetAvailability(params: {
  tenantId: string;
  durationMinutes: number;
  fromDate: Date;
  toDate: Date;
}): Promise<{ timezone: string; days: WidgetDay[] }> {
  const { tenantId, durationMinutes, fromDate, toDate } = params;

  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const locationId = location.id;
  const timezone = location.timezone;
  const openingHours = location.openingHours as OpeningHours;

  const [appointments, requests] = await Promise.all([
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
    prisma.bookingRequest.findMany({
      where: {
        tenantId,
        slotStart: { not: null, lt: toDate },
        slotEnd: { gt: fromDate },
      },
      select: { slotStart: true, slotEnd: true },
    }),
  ]);

  const taken: { start: number; end: number }[] = [
    ...appointments.map((a) => ({ start: a.startTime.getTime(), end: a.endTime.getTime() })),
    ...requests
      .filter((r) => r.slotStart && r.slotEnd)
      .map((r) => ({ start: r.slotStart!.getTime(), end: r.slotEnd!.getTime() })),
  ];

  const earliest = Date.now() + MIN_LEAD_TIME_MINUTES * 60_000;

  const firstStr = formatInTimeZone(fromDate, timezone, "yyyy-MM-dd");
  const lastStr = formatInTimeZone(toDate, timezone, "yyyy-MM-dd");
  let cursor = parseISO(`${firstStr}T00:00:00.000Z`);
  const last = parseISO(`${lastStr}T00:00:00.000Z`);

  const days: WidgetDay[] = [];

  while (cursor.getTime() <= last.getTime()) {
    const dateStr = formatInTimeZone(cursor, "UTC", "yyyy-MM-dd");
    const weekdayIndex = cursor.getUTCDay();
    const windows = openingHours[WEEKDAY_KEYS[weekdayIndex]] ?? [];
    const slots: WidgetSlot[] = [];

    for (const window of windows) {
      const windowStart = fromZonedTime(`${dateStr}T${window.start}:00`, timezone);
      const windowEnd = fromZonedTime(`${dateStr}T${window.end}:00`, timezone);

      let slotStart = windowStart;
      while (true) {
        const slotEnd = addMinutes(slotStart, durationMinutes);
        if (slotEnd.getTime() > windowEnd.getTime()) break;

        const st = slotStart.getTime();
        const en = slotEnd.getTime();
        const isTaken = taken.some((t) => st < t.end && en > t.start);
        const isPast = st < earliest;

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label: formatInTimeZone(slotStart, timezone, "HH:mm"),
          endLabel: formatInTimeZone(slotEnd, timezone, "HH:mm"),
          available: !isTaken && !isPast,
          taken: isTaken,
        });

        slotStart = addMinutes(slotStart, durationMinutes);
      }
    }

    days.push({
      date: dateStr,
      weekday: weekdayIndex,
      hasAvailable: slots.some((s) => s.available),
      slots,
    });

    cursor = addDays(cursor, 1);
  }

  return { timezone, days };
}
