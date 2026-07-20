import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveTenantBySlug } from "@/lib/tenant/resolve";
import { ChatWidget } from "@/components/widget/ChatWidget";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await resolveTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const [services, location, faqEntries] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findFirst({
      where: { tenantId: tenant.id },
      select: { emergencyPhone: true, emergencyNote: true, serviceAreaPostcodes: true },
    }),
    // The business's own FAQ entries double as the suggested questions in the
    // widget — sortOrder is the order the business put them in.
    prisma.faqEntry.findMany({
      where: { tenantId: tenant.id },
      select: { question: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
    }),
  ]);

  return (
    <ChatWidget
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      services={services}
      emergencyPhone={location?.emergencyPhone ?? null}
      emergencyNote={location?.emergencyNote ?? null}
      hasServiceArea={(location?.serviceAreaPostcodes.length ?? 0) > 0}
      topQuestions={faqEntries.map((e) => e.question)}
    />
  );
}
