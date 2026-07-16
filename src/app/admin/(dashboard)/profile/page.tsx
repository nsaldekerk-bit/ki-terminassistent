import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { ProfileForm } from "@/components/admin/ProfileForm";

export default async function ProfilePage() {
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-lg font-medium">Betrieb</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stammdaten Ihres Betriebs. Der Assistent nutzt sie, um Kundenfragen zu beantworten — je
          vollständiger, desto besser.
        </p>
      </div>

      <ProfileForm
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
