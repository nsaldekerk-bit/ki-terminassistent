import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { DATE_FNS_LOCALES } from "@/lib/i18n/date";

export default async function ConversationsPage() {
  const tenantId = await requireTenantId();
  const { locale, t } = await getI18n();
  const c = t.admin.conversations;
  const statusLabels: Record<string, string> = {
    active: c.statusActive,
    escalated: c.statusEscalated,
    closed: c.statusClosed,
  };
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const conversations = await prisma.conversation.findMany({
    where: { tenantId },
    include: { customer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">{c.title}</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 font-normal">{c.time}</th>
            <th className="font-normal">{c.customer}</th>
            <th className="font-normal">{c.status}</th>
            <th className="font-normal">{c.lastMessage}</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conv) => (
            <tr key={conv.id} className="border-b border-gray-100">
              <td className="py-2">
                {formatInTimeZone(conv.createdAt, location.timezone, "d MMM yyyy, HH:mm", {
                  locale: DATE_FNS_LOCALES[locale],
                })}
              </td>
              <td>{conv.customer?.name ?? c.anonymous}</td>
              <td>{statusLabels[conv.status] ?? conv.status}</td>
              <td className="max-w-xs truncate">
                <Link href={`/admin/conversations/${conv.id}`} className="hover:underline">
                  {conv.messages[0]?.content ?? "-"}
                </Link>
              </td>
            </tr>
          ))}
          {conversations.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-gray-400">
                {c.empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
