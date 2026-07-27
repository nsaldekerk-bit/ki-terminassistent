import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { createService, deleteService } from "./actions";

export default async function ServicesPage() {
  const tenantId = await requireTenantId();
  const { t } = await getI18n();
  const a = t.admin.services;
  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">{a.title}</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">{a.colName}</th>
            <th className="font-normal">{a.colCategory}</th>
            <th className="font-normal">{a.colDuration}</th>
            <th className="font-normal">{a.colPrice}</th>
            <th className="font-normal">{a.colEmergency}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-b border-gray-100">
              <td className="py-2">{s.name}</td>
              <td>{s.category ?? "-"}</td>
              <td>
                {s.durationMinutes} {a.minutes}
              </td>
              <td>{s.priceCents != null ? `${(s.priceCents / 100).toFixed(2)} €` : "-"}</td>
              <td>{s.isEmergency ? a.yes : a.no}</td>
              <td>
                <form action={deleteService}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-red-600 hover:underline">
                    {t.admin.del}
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-400">
                {a.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form
        id="create-service-form"
        action={createService}
        className="max-w-md space-y-3 rounded-lg border border-gray-200 p-4"
      >
        <h2 className="text-sm font-medium">{a.newTitle}</h2>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="name">
            {a.name}
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="category">
            {a.category}
          </label>
          <input id="category" name="category" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="durationMinutes">
            {a.duration}
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="1"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="priceCents">
            {a.price}
          </label>
          <input
            id="priceCents"
            name="priceCents"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="isEmergency" />
          {a.emergency}
        </label>

        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
          {t.admin.add}
        </button>
      </form>
    </div>
  );
}
