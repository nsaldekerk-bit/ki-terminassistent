import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage() {
  const { locale, t } = await getI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4">
      <div className="flex w-full max-w-sm justify-end">
        <LanguageSwitcher current={locale} label={t.common.language} tone="light" />
      </div>
      <LoginForm locale={locale} />
    </div>
  );
}
