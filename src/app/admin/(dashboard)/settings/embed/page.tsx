import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";

export default async function EmbedSettingsPage() {
  const tenantId = await requireTenantId();
  const { t } = await getI18n();
  const e = t.admin.embed;
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const snippet = `<script src="${appUrl}/embed.js" data-key="${tenant.slug}" async></script>`;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-lg font-medium">{e.title}</h1>
      <p className="max-w-lg text-sm text-gray-600">
        {e.introBefore}
        <code>&lt;/body&gt;</code>
        {e.introAfter}
      </p>
      <pre className="max-w-xl overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-white">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
