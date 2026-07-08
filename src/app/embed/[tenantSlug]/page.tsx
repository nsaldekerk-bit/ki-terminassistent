import { notFound } from "next/navigation";
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

  return <ChatWidget tenantSlug={tenant.slug} tenantName={tenant.name} />;
}
