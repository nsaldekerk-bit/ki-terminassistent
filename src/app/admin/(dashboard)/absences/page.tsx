import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { AbsenceForm } from "@/components/admin/AbsenceForm";
import { deleteAbsence } from "./actions";

export default async function AbsencesPage() {
  const tenantId = await requireTenantId();
  const absences = await prisma.absence.findMany({
    where: { tenantId },
    orderBy: { startDate: "asc" },
  });

  // Stored as plain calendar days at UTC midnight — read them back in UTC so
  // the day never shifts.
  const fmt = (d: Date) => formatInTimeZone(d, "UTC", "EEE, d. MMM yyyy", { locale: de });
  const todayUtc = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Urlaub &amp; Schließzeiten</h1>
        <p className="mt-1 text-sm text-gray-500">
          In diesen Zeiträumen vergibt der Assistent keine Termine — Kunden sehen die Tage gar nicht erst.
        </p>
      </div>

      <AbsenceForm />

      {absences.length === 0 ? (
        <p className="text-sm text-gray-500">Noch keine Schließzeiten eingetragen.</p>
      ) : (
        <ul className="max-w-2xl divide-y divide-gray-100 rounded-lg border border-gray-200">
          {absences.map((a) => {
            const past = a.endDate < todayUtc;
            return (
              <li key={a.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                <span className={`tabular-nums ${past ? "text-gray-400" : "text-gray-900"}`}>
                  {fmt(a.startDate)} – {fmt(a.endDate)}
                </span>
                <span className="flex-1 text-gray-500">{a.reason ?? "Geschlossen"}</span>
                {past && <span className="text-xs text-gray-400">vorbei</span>}
                <form action={deleteAbsence}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Löschen
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
