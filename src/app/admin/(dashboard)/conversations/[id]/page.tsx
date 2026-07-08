import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await requireTenantId();
  const { id } = await params;

  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const conversation = await prisma.conversation.findFirst({
    where: { id, tenantId },
    include: { customer: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Gespräch mit {conversation.customer?.name ?? "Anonym"}</h1>
        <p className="text-sm text-gray-500">
          {formatInTimeZone(conversation.createdAt, location.timezone, "d. MMM yyyy, HH:mm 'Uhr'", { locale: de })}
        </p>
      </div>

      <div className="max-w-2xl space-y-3">
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderType === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.senderType === "customer" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
