import Link from "next/link";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/requests", label: "Anfragen" },
  { href: "/admin/appointments", label: "Termine" },
  { href: "/admin/services", label: "Dienstleistungen" },
  { href: "/admin/hours", label: "Öffnungszeiten" },
  { href: "/admin/absences", label: "Urlaub & Schließzeiten" },
  { href: "/admin/profile", label: "Betrieb" },
  { href: "/admin/faq", label: "Eigene Fragen" },
  { href: "/admin/conversations", label: "Gespräche" },
  { href: "/admin/settings/embed", label: "Einbetten" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ThemeToggle />
      <aside className="flex w-56 flex-col border-r border-gray-200 p-4">
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
