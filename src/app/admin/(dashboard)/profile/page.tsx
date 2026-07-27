import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { ProfileForm } from "@/components/admin/ProfileForm";

export default async function ProfilePage() {
  const tenantId = await requireTenantId();
  const { locale, t } = await getI18n();
  const a = t.admin.profile;
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">{a.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{a.intro}</p>
      </div>

      <ProfileForm
        locale={locale}
        address={location.address ?? ""}
        phone={location.phone ?? ""}
        email={location.email ?? ""}
        website={location.website ?? ""}
        emergencyPhone={location.emergencyPhone ?? ""}
        emergencyNote={location.emergencyNote ?? ""}
        bufferMinutes={location.bufferMinutes}
        serviceAreaPostcodes={location.serviceAreaPostcodes}
      />
    </div>
  );
}
