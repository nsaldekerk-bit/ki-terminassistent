import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { updateAppointmentStatus } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  requested: "Angefragt",
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
};

export default async function AppointmentsPage() {
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { service: true, customer: true },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">Termine</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">Zeitpunkt</th>
            <th className="font-normal">Dienstleistung</th>
            <th className="font-normal">Kunde</th>
            <th className="font-normal">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id} className="border-b border-gray-100">
              <td className="py-2">
                {formatInTimeZone(a.startTime, location.timezone, "d. MMM yyyy, HH:mm 'Uhr'", { locale: de })}
              </td>
              <td>{a.service.name}</td>
              <td>
                {a.customer.name}
                <div className="text-xs text-gray-400">{[a.customer.phone, a.customer.email].filter(Boolean).join(", ")}</div>
              </td>
              <td>{STATUS_LABELS[a.status] ?? a.status}</td>
              <td>
                <form action={updateAppointmentStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <select name="status" defaultValue={a.status} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-sm text-gray-700 hover:underline">
                    Speichern
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-gray-400">
                Noch keine Termine.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
