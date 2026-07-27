"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/admin/(dashboard)/profile/actions";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function ProfileForm(props: {
  locale: Locale;
  address: string;
  phone: string;
  email: string;
  website: string;
  emergencyPhone: string;
  emergencyNote: string;
  bufferMinutes: number;
  serviceAreaPostcodes: string[];
}) {
  const t = dictionaries[props.locale].admin;
  const a = t.profile;
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null);

  return (
    <form action={action} className="max-w-xl space-y-8">
      {/* Contact — this is what the FAQ answers with */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{a.contactLegend}</legend>
        <p className="text-sm text-gray-500">{a.contactHint}</p>

        <Field label={a.address} name="address" defaultValue={props.address} placeholder="Musterstraße 1, 44137 Dortmund" />
        <Field label={a.phone} name="phone" defaultValue={props.phone} placeholder="0231 1234567" />
        <Field label={a.email} name="email" defaultValue={props.email} placeholder="info@ihr-betrieb.de" />
        <Field label={a.website} name="website" defaultValue={props.website} placeholder="www.ihr-betrieb.de" />
      </fieldset>

      {/* Emergency */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{a.emergencyLegend}</legend>
        <p className="text-sm text-gray-500">{a.emergencyHint}</p>

        <Field label={a.emergencyPhone} name="emergencyPhone" defaultValue={props.emergencyPhone} placeholder="0231 7654321" />
        <Field
          label={a.emergencyNote}
          name="emergencyNote"
          defaultValue={props.emergencyNote}
          placeholder="Rund um die Uhr erreichbar, Anfahrt innerhalb von 60 Minuten"
        />
      </fieldset>

      {/* Scheduling */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{a.schedulingLegend}</legend>

        <label className="flex items-center gap-4 text-sm">
          <span className="w-36 shrink-0 text-gray-700">{a.buffer}</span>
          <input
            type="number"
            name="bufferMinutes"
            min={0}
            max={240}
            step={5}
            defaultValue={props.bufferMinutes}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums"
          />
          <span className="text-gray-500">{a.bufferUnit}</span>
        </label>
        <p className="pl-40 text-xs text-gray-400">{a.bufferHint}</p>

        <label className="flex items-start gap-4 text-sm">
          <span className="mt-1.5 w-36 shrink-0 text-gray-700">{a.area}</span>
          <textarea
            name="serviceAreaPostcodes"
            rows={2}
            defaultValue={props.serviceAreaPostcodes.join(", ")}
            placeholder="44137, 44139, 44141"
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <p className="pl-40 text-xs text-gray-400">{a.areaHint}</p>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {pending ? t.saving : t.save}
        </button>
        {state?.ok && <span className="text-sm text-green-700">{t.saved}</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-4 text-sm">
      <span className="w-36 shrink-0 text-gray-700">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}
