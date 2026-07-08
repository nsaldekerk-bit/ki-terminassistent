import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";

export default async function EmbedSettingsPage() {
  const tenantId = await requireTenantId();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const snippet = `<script src="${appUrl}/embed.js" data-key="${tenant.slug}" async></script>`;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-lg font-medium">Einbetten</h1>
      <p className="max-w-lg text-sm text-gray-600">
        Füge diesen Code kurz vor dem schließenden <code>&lt;/body&gt;</code>-Tag deiner Webseite ein, um den
        Chat-Assistenten einzubinden.
      </p>
      <pre className="max-w-xl overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-white">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
