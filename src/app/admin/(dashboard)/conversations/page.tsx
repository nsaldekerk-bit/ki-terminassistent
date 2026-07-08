import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  escalated: "Eskaliert",
  closed: "Geschlossen",
};

export default async function ConversationsPage() {
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const conversations = await prisma.conversation.findMany({
    where: { tenantId },
    include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">Gespräche</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">Zeitpunkt</th>
            <th className="font-normal">Kunde</th>
            <th className="font-normal">Status</th>
            <th className="font-normal">Letzte Nachricht</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((c) => (
            <tr key={c.id} className="border-b border-gray-100">
              <td className="py-2">
                {formatInTimeZone(c.createdAt, location.timezone, "d. MMM yyyy, HH:mm 'Uhr'", { locale: de })}
              </td>
              <td>{c.customer?.name ?? "Anonym"}</td>
              <td>{STATUS_LABELS[c.status] ?? c.status}</td>
              <td className="max-w-xs truncate">
                <Link href={`/admin/conversations/${c.id}`} className="hover:underline">
                  {c.messages[0]?.content ?? "-"}
                </Link>
              </td>
            </tr>
          ))}
          {conversations.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-gray-400">
                Noch keine Gespräche.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
