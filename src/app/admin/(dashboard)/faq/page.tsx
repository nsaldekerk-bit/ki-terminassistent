import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { FaqForm } from "@/components/admin/FaqForm";
import { deleteFaqEntry } from "./actions";

export default async function FaqPage() {
  const tenantId = await requireTenantId();
  const entries = await prisma.faqEntry.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Eigene Fragen</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ihre eigenen Antworten auf typische Kundenfragen. Öffnungszeiten, Adresse, Telefon und Leistungen
          beantwortet der Assistent bereits von selbst — hier ergänzen Sie alles Betriebsspezifische.
        </p>
      </div>

      <FaqForm />

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Noch keine eigenen Fragen hinterlegt.</p>
      ) : (
        <ul className="max-w-2xl space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-gray-900">{e.question}</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">{e.answer}</p>
                  {e.keywords && <p className="text-xs text-gray-400">Stichworte: {e.keywords}</p>}
                </div>
                <form action={deleteFaqEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Löschen
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
