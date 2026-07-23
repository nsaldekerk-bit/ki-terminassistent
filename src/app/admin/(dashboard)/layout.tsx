import Link from "next/link";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getI18n } from "@/lib/i18n/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();

  const navItems = [
    { href: "/admin", label: t.nav.dashboard },
    { href: "/admin/requests", label: t.nav.requests },
    { href: "/admin/appointments", label: t.nav.appointments },
    { href: "/admin/services", label: t.nav.services },
    { href: "/admin/hours", label: t.nav.hours },
    { href: "/admin/absences", label: t.nav.absences },
    { href: "/admin/profile", label: t.nav.profile },
    { href: "/admin/faq", label: t.nav.faq },
    { href: "/admin/conversations", label: t.nav.conversations },
    { href: "/admin/settings/embed", label: t.nav.embed },
  ];

  return (
    <div className="flex min-h-screen">
      <ThemeToggle />
      <aside className="flex w-56 flex-col border-r border-gray-200 p-4">
        <div className="mb-3">
          <LanguageSwitcher current={locale} label={t.common.language} tone="light" />
        </div>
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
        <SignOutButton label={t.nav.signOut} />
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
