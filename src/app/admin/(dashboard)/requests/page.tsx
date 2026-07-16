import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

const TYPE_LABELS: Record<string, string> = {
  consultation: "Beratung",
  booking: "Termin",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  scheduled: "Terminiert",
  closed: "Abgeschlossen",
  cancelled: "Vom Kunden abgesagt",
};

export default async function RequestsPage() {
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const requests = await prisma.bookingRequest.findMany({
    where: { tenantId },
    include: { customer: true, _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">Anfragen</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">Eingegangen</th>
            <th className="font-normal">Art</th>
            <th className="font-normal">Leistung</th>
            <th className="font-normal">Kunde</th>
            <th className="font-normal">Fotos</th>
            <th className="font-normal">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 align-top">
              <td className="py-2">
                {formatInTimeZone(r.createdAt, location.timezone, "d. MMM yyyy, HH:mm", { locale: de })}
              </td>
              <td>{TYPE_LABELS[r.type] ?? r.type}</td>
              <td>{r.serviceLabel ?? "—"}</td>
              <td>
                {r.customer.name}
                <div className="text-xs text-gray-400">
                  {[r.customer.phone, r.customer.email].filter(Boolean).join(", ")}
                </div>
              </td>
              <td>{r._count.photos || "—"}</td>
              <td>{STATUS_LABELS[r.status] ?? r.status}</td>
              <td>
                <Link href={`/admin/requests/${r.id}`} className="text-gray-700 hover:underline">
                  Details
                </Link>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-gray-400">
                Noch keine Anfragen.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
