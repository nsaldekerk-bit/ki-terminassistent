import { formatInTimeZone } from "date-fns-tz";
import { de as deDF, enGB, tr as trDF, pl as plDF, ru as ruDF } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/config";
import { AbsenceForm } from "@/components/admin/AbsenceForm";
import { deleteAbsence } from "./actions";

const DATE_FNS_LOCALES: Record<Locale, typeof deDF> = { de: deDF, en: enGB, tr: trDF, pl: plDF, ru: ruDF };

export default async function AbsencesPage() {
  const tenantId = await requireTenantId();
  const { locale, t } = await getI18n();
  const a = t.admin.absences;
  const absences = await prisma.absence.findMany({
    where: { tenantId },
    orderBy: { startDate: "asc" },
  });

  // Stored as plain calendar days at UTC midnight — read them back in UTC so
  // the day never shifts.
  const fmt = (d: Date) => formatInTimeZone(d, "UTC", "EEE, d MMM yyyy", { locale: DATE_FNS_LOCALES[locale] });
  const todayUtc = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">{a.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{a.intro}</p>
      </div>

      <AbsenceForm locale={locale} />

      {absences.length === 0 ? (
        <p className="text-sm text-gray-500">{a.empty}</p>
      ) : (
        <ul className="max-w-2xl divide-y divide-gray-100 rounded-lg border border-gray-200">
          {absences.map((ab) => {
            const past = ab.endDate < todayUtc;
            return (
              <li key={ab.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                <span className={`tabular-nums ${past ? "text-gray-400" : "text-gray-900"}`}>
                  {fmt(ab.startDate)} – {fmt(ab.endDate)}
                </span>
                <span className="flex-1 text-gray-500">{ab.reason ?? a.closedFallback}</span>
                {past && <span className="text-xs text-gray-400">{a.past}</span>}
                <form action={deleteAbsence}>
                  <input type="hidden" name="id" value={ab.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    {t.admin.del}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
