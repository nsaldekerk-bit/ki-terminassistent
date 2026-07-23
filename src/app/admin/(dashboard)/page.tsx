import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  const { t } = await getI18n();

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium">{t.nav.dashboard}</h1>
      <p className="mt-2 text-sm text-gray-600">{t.nav.loggedInAs(session?.user?.email ?? "")}</p>
    </div>
  );
}
