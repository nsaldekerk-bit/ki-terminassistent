import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { updateHours } from "./actions";

const WEEKDAYS = [
  { key: "mon", label: "Montag" },
  { key: "tue", label: "Dienstag" },
  { key: "wed", label: "Mittwoch" },
  { key: "thu", label: "Donnerstag" },
  { key: "fri", label: "Freitag" },
  { key: "sat", label: "Samstag" },
  { key: "sun", label: "Sonntag" },
] as const;

type TimeWindow = { start: string; end: string };
type OpeningHours = Partial<Record<(typeof WEEKDAYS)[number]["key"], TimeWindow[]>>;

export default async function HoursPage() {
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });
  const openingHours = location.openingHours as OpeningHours;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-medium">Öffnungszeiten</h1>
      <p className="text-sm text-gray-500">
        Ein Zeitfenster pro Tag. Ohne Uhrzeiten oder mit &quot;Geschlossen&quot; markiert bleibt der Tag frei von
        Terminen.
      </p>

      <form action={updateHours} className="max-w-lg space-y-3">
        {WEEKDAYS.map(({ key, label }) => {
          const window = openingHours[key]?.[0];
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <span className="w-24 text-sm text-gray-700">{label}</span>
              <input
                type="time"
                name={`${key}_start`}
                defaultValue={window?.start ?? ""}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <span className="text-sm text-gray-400">bis</span>
              <input
                type="time"
                name={`${key}_end`}
                defaultValue={window?.end ?? ""}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <label className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" name={`${key}_closed`} defaultChecked={!window} />
                Geschlossen
              </label>
            </div>
          );
        })}

        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">
          Speichern
        </button>
      </form>
    </div>
  );
}
