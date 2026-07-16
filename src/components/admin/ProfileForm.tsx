"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/admin/(dashboard)/profile/actions";

export function ProfileForm(props: {
  address: string;
  phone: string;
  email: string;
  website: string;
  emergencyPhone: string;
  emergencyNote: string;
  bufferMinutes: number;
  serviceAreaPostcodes: string[];
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null);

  return (
    <form action={action} className="max-w-xl space-y-8">
      {/* Contact — this is what the FAQ answers with */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Kontakt &amp; Sitz</legend>
        <p className="text-sm text-gray-500">
          Diese Angaben beantwortet der Assistent, wenn Kunden nach Adresse, Telefon oder Erreichbarkeit fragen.
        </p>

        <Field label="Anschrift" name="address" defaultValue={props.address} placeholder="Musterstraße 1, 44137 Dortmund" />
        <Field label="Telefon" name="phone" defaultValue={props.phone} placeholder="0231 1234567" />
        <Field label="E-Mail" name="email" defaultValue={props.email} placeholder="info@ihr-betrieb.de" />
        <Field label="Website" name="website" defaultValue={props.website} placeholder="www.ihr-betrieb.de" />
      </fieldset>

      {/* Emergency */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Notdienst</legend>
        <p className="text-sm text-gray-500">
          Wenn hier eine Nummer steht, bietet der Assistent Kunden im Notfall einen eigenen Schnellweg an —
          und markiert die Anfrage als dringend.
        </p>

        <Field label="Notfall-Telefon" name="emergencyPhone" defaultValue={props.emergencyPhone} placeholder="0231 7654321" />
        <Field
          label="Notfall-Hinweis"
          name="emergencyNote"
          defaultValue={props.emergencyNote}
          placeholder="Rund um die Uhr erreichbar, Anfahrt innerhalb von 60 Minuten"
        />
      </fieldset>

      {/* Scheduling */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Terminplanung</legend>

        <label className="flex items-center gap-4 text-sm">
          <span className="w-36 shrink-0 text-gray-700">Fahrzeit-Puffer</span>
          <input
            type="number"
            name="bufferMinutes"
            min={0}
            max={240}
            step={5}
            defaultValue={props.bufferMinutes}
            className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm tabular-nums"
          />
          <span className="text-gray-500">Minuten zwischen zwei Terminen</span>
        </label>
        <p className="pl-40 text-xs text-gray-400">
          Wird nach jedem Termin freigehalten, damit Sie zur nächsten Baustelle fahren können. 0 = kein Puffer.
        </p>

        <label className="flex items-start gap-4 text-sm">
          <span className="mt-1.5 w-36 shrink-0 text-gray-700">Einzugsgebiet</span>
          <textarea
            name="serviceAreaPostcodes"
            rows={2}
            defaultValue={props.serviceAreaPostcodes.join(", ")}
            placeholder="44137, 44139, 44141"
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <p className="pl-40 text-xs text-gray-400">
          Postleitzahlen, in die Sie fahren — durch Komma getrennt. <strong>Leer lassen</strong> heißt: keine
          Prüfung, Sie fahren überall hin.
        </p>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {pending ? "Wird gespeichert …" : "Speichern"}
        </button>
        {state?.ok && <span className="text-sm text-green-700">Gespeichert.</span>}
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
