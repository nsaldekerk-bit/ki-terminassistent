import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireTenantId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/admin/login");
  }
  return session.user.tenantId;
}
