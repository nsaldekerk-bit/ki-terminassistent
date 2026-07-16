import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";

type TimeWindow = { start: string; end: string };
type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type OpeningHours = Partial<Record<WeekdayKey, TimeWindow[]>>;

const WEEKDAY_LABELS: [WeekdayKey, string][] = [
  ["mon", "Montag"],
  ["tue", "Dienstag"],
  ["wed", "Mittwoch"],
  ["thu", "Donnerstag"],
  ["fri", "Freitag"],
  ["sat", "Samstag"],
  ["sun", "Sonntag"],
];

export interface FaqContext {
  tenantName: string;
  timezone: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  emergencyPhone: string | null;
  emergencyNote: string | null;
  serviceAreaPostcodes: string[];
  openingHours: OpeningHours;
  /** "Montag: 08:00–17:00 Uhr" per open day. */
  hoursLines: string[];
  services: { name: string; durationMinutes: number; priceCents: number | null; isEmergency: boolean }[];
  entries: { question: string; answer: string; keywords: string | null }[];
  /** Closure ranges that are still upcoming, pre-formatted for humans. */
  closures: string[];
}

/** Everything the assistant knows about one business. */
export async function loadFaqContext(tenantId: string): Promise<FaqContext> {
  const [tenant, location, services, entries, absences] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { name: true } }),
    prisma.location.findFirstOrThrow({ where: { tenantId } }),
    prisma.service.findMany({
      where: { tenantId },
      select: { name: true, durationMinutes: true, priceCents: true, isEmergency: true },
      orderBy: { name: "asc" },
    }),
    prisma.faqEntry.findMany({
      where: { tenantId },
      select: { question: true, answer: true, keywords: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.absence.findMany({
      where: { tenantId, endDate: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
      select: { startDate: true, endDate: true, reason: true },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
  ]);

  const openingHours = location.openingHours as OpeningHours;

  const hoursLines: string[] = [];
  for (const [key, label] of WEEKDAY_LABELS) {
    const windows = openingHours[key] ?? [];
    if (windows.length === 0) continue;
    const times = windows.map((w) => `${w.start}–${w.end} Uhr`).join(", ");
    hoursLines.push(`${label}: ${times}`);
  }

  const fmtDay = (d: Date) => formatInTimeZone(d, "UTC", "d. MMMM yyyy", { locale: de });
  const closures = absences.map((a) => {
    const range =
      a.startDate.getTime() === a.endDate.getTime()
        ? fmtDay(a.startDate)
        : `${fmtDay(a.startDate)} bis ${fmtDay(a.endDate)}`;
    return a.reason ? `${range} (${a.reason})` : range;
  });

  return {
    tenantName: tenant.name,
    timezone: location.timezone,
    address: location.address,
    phone: location.phone,
    email: location.email,
    website: location.website,
    emergencyPhone: location.emergencyPhone,
    emergencyNote: location.emergencyNote,
    serviceAreaPostcodes: location.serviceAreaPostcodes,
    openingHours,
    hoursLines,
    services,
    entries,
    closures,
  };
}

export function formatPrice(cents: number): string {
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;
}

/** Compact plain-text brief of the business — fed to the AI as system context. */
export function contextToBrief(ctx: FaqContext): string {
  const lines: string[] = [`Betrieb: ${ctx.tenantName}`];

  if (ctx.address) lines.push(`Anschrift / Sitz: ${ctx.address}`);
  if (ctx.phone) lines.push(`Telefon: ${ctx.phone}`);
  if (ctx.email) lines.push(`E-Mail: ${ctx.email}`);
  if (ctx.website) lines.push(`Website: ${ctx.website}`);

  if (ctx.hoursLines.length > 0) {
    lines.push(`Öffnungszeiten:\n${ctx.hoursLines.map((l) => `  ${l}`).join("\n")}`);
    const closedDays = WEEKDAY_LABELS.filter(([k]) => (ctx.openingHours[k] ?? []).length === 0).map(
      ([, label]) => label
    );
    if (closedDays.length > 0) lines.push(`Geschlossen an: ${closedDays.join(", ")}`);
  } else {
    lines.push("Öffnungszeiten: nicht hinterlegt");
  }

  if (ctx.closures.length > 0) {
    lines.push(`Kommende Schließzeiten:\n${ctx.closures.map((c) => `  ${c}`).join("\n")}`);
  }

  if (ctx.emergencyPhone) {
    lines.push(`Notdienst-Telefon: ${ctx.emergencyPhone}${ctx.emergencyNote ? ` — ${ctx.emergencyNote}` : ""}`);
  }

  if (ctx.serviceAreaPostcodes.length > 0) {
    lines.push(`Einzugsgebiet (Postleitzahlen): ${ctx.serviceAreaPostcodes.join(", ")}`);
  }

  if (ctx.services.length > 0) {
    const s = ctx.services.map((x) => {
      const bits = [`${x.durationMinutes} Min`];
      if (x.priceCents != null) bits.push(formatPrice(x.priceCents));
      if (x.isEmergency) bits.push("Notdienst");
      return `  ${x.name} (${bits.join(", ")})`;
    });
    lines.push(`Leistungen:\n${s.join("\n")}`);
  }

  if (ctx.entries.length > 0) {
    const e = ctx.entries.map((x) => `  F: ${x.question}\n  A: ${x.answer}`);
    lines.push(`Eigene Fragen und Antworten des Betriebs:\n${e.join("\n")}`);
  }

  return lines.join("\n");
}
