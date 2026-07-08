import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { createService, deleteService } from "./actions";

export default async function ServicesPage() {
  const tenantId = await requireTenantId();
  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">Dienstleistungen</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">Name</th>
            <th className="font-normal">Kategorie</th>
            <th className="font-normal">Dauer</th>
            <th className="font-normal">Preis</th>
            <th className="font-normal">Notdienst</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-b border-gray-100">
              <td className="py-2">{s.name}</td>
              <td>{s.category ?? "-"}</td>
              <td>{s.durationMinutes} Min</td>
              <td>{s.priceCents != null ? `${(s.priceCents / 100).toFixed(2)} €` : "-"}</td>
              <td>{s.isEmergency ? "Ja" : "Nein"}</td>
              <td>
                <form action={deleteService}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-red-600 hover:underline">
                    Löschen
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-400">
                Noch keine Dienstleistungen.
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
        <h2 className="text-sm font-medium">Neue Dienstleistung</h2>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="name">
            Name
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
            Kategorie
          </label>
          <input id="category" name="category" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="durationMinutes">
            Dauer (Minuten)
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
            Preis (€, optional)
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
          Notdienst
        </label>

        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
          Hinzufügen
        </button>
      </form>
    </div>
  );
}
