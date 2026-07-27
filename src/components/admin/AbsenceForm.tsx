"use client";

import { useActionState } from "react";
import { addAbsence, type AbsenceState } from "@/app/admin/(dashboard)/absences/actions";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function AbsenceForm({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].admin;
  const a = t.absences;
  const [state, action, pending] = useActionState<AbsenceState, FormData>(addAbsence, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4">
      <label className="text-sm">
        <span className="mb-1 block text-gray-700">{a.from}</span>
        <input
          type="date"
          name="startDate"
          required
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-gray-700">{a.until}</span>
        <input
          type="date"
          name="endDate"
          required
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex-1 text-sm">
        <span className="mb-1 block text-gray-700">{a.reason}</span>
        <input
          type="text"
          name="reason"
          placeholder={a.reasonPlaceholder}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {pending ? "…" : t.add}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
