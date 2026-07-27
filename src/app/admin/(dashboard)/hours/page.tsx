import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { updateHours } from "./actions";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type TimeWindow = { start: string; end: string };
type OpeningHours = Partial<Record<(typeof WEEKDAY_KEYS)[number], TimeWindow[]>>;

export default async function HoursPage() {
  const tenantId = await requireTenantId();
  const { t } = await getI18n();
  const a = t.admin.hours;
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const openingHours = location.openingHours as OpeningHours;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">{a.title}</h1>
      <p className="text-sm text-gray-500">{a.intro}</p>

      <form action={updateHours} className="max-w-lg space-y-3">
        {WEEKDAY_KEYS.map((key, i) => {
          const window = openingHours[key]?.[0];
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <span className="w-24 text-sm text-gray-700">{t.faq.weekdays[i]}</span>
              <input
                type="time"
                name={`${key}_start`}
                defaultValue={window?.start ?? ""}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <span className="text-sm text-gray-400">{a.to}</span>
              <input
                type="time"
                name={`${key}_end`}
                defaultValue={window?.end ?? ""}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <label className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" name={`${key}_closed`} defaultChecked={!window} />
                {a.closed}
              </label>
            </div>
          );
        })}

        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
          {t.admin.save}
        </button>
      </form>
    </div>
  );
}
