import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { DATE_FNS_LOCALES } from "@/lib/i18n/date";
import { updateAppointmentStatus } from "./actions";

export default async function AppointmentsPage() {
  const tenantId = await requireTenantId();
  const { locale, t } = await getI18n();
  const a = t.admin.appointments;
  const statusLabels: Record<string, string> = {
    requested: a.statusRequested,
    confirmed: a.statusConfirmed,
    cancelled: a.statusCancelled,
    completed: a.statusCompleted,
  };
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { service: true, customer: true },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">{a.title}</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">{a.time}</th>
            <th className="font-normal">{a.service}</th>
            <th className="font-normal">{a.customer}</th>
            <th className="font-normal">{a.status}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((ap) => (
            <tr key={ap.id} className="border-b border-gray-100">
              <td className="py-2">
                {formatInTimeZone(ap.startTime, location.timezone, "d MMM yyyy, HH:mm", {
                  locale: DATE_FNS_LOCALES[locale],
                })}
              </td>
              <td>{ap.service.name}</td>
              <td>
                {ap.customer.name}
                <div className="text-xs text-gray-400">{[ap.customer.phone, ap.customer.email].filter(Boolean).join(", ")}</div>
              </td>
              <td>{statusLabels[ap.status] ?? ap.status}</td>
              <td>
                <form action={updateAppointmentStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={ap.id} />
                  <select name="status" defaultValue={ap.status} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-sm text-gray-700 hover:underline">
                    {t.admin.save}
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-gray-400">
                {a.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
