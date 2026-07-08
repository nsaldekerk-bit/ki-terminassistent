import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Angemeldet als {session?.user?.email}</p>
    </div>
  );
}
