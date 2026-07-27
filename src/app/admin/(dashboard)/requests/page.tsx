import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { DATE_FNS_LOCALES } from "@/lib/i18n/date";

export default async function RequestsPage() {
  const tenantId = await requireTenantId();
  const { locale, t } = await getI18n();
  const r = t.admin.requests;
  const typeLabels: Record<string, string> = {
    consultation: r.typeConsultation,
    booking: r.typeBooking,
  };
  const statusLabels: Record<string, string> = {
    new: r.statusNew,
    contacted: r.statusContacted,
    scheduled: r.statusScheduled,
    closed: r.statusClosed,
    cancelled: r.statusCancelled,
  };
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const requests = await prisma.bookingRequest.findMany({
    where: { tenantId },
    include: { customer: true, _count: { select: { photos: true } } },
    // Emergencies first — that is the whole point of the emergency path.
    orderBy: [{ isEmergency: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">{r.title}</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">{r.received}</th>
            <th className="font-normal">{r.type}</th>
            <th className="font-normal">{r.service}</th>
            <th className="font-normal">{r.customer}</th>
            <th className="font-normal">{r.photos}</th>
            <th className="font-normal">{r.status}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="border-b border-gray-100 align-top">
              <td className="py-2">
                {formatInTimeZone(req.createdAt, location.timezone, "d MMM yyyy, HH:mm", {
                  locale: DATE_FNS_LOCALES[locale],
                })}
              </td>
              <td>
                {req.isEmergency ? (
                  <span className="font-semibold text-red-600">{r.emergency}</span>
                ) : (
                  typeLabels[req.type] ?? req.type
                )}
              </td>
              <td>{req.serviceLabel ?? "—"}</td>
              <td>
                {req.customer.name}
                <div className="text-xs text-gray-400">
                  {[req.customer.phone, req.customer.email].filter(Boolean).join(", ")}
                </div>
              </td>
              <td>{req._count.photos || "—"}</td>
              <td>{statusLabels[req.status] ?? req.status}</td>
              <td>
                <Link href={`/admin/requests/${req.id}`} className="text-gray-700 hover:underline">
                  {t.admin.details}
                </Link>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-gray-400">
                {r.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
