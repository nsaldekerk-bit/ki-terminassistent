"use client";

import { useActionState, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { cancelBooking, rescheduleBooking, type ManageState } from "@/app/termin/[token]/actions";

interface Slot {
  start: string;
  end: string;
  label: string;
  endLabel: string;
  available: boolean;
  taken: boolean;
}

interface Day {
  date: string;
  weekday: number;
  hasAvailable: boolean;
  slots: Slot[];
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function ManageBooking(props: {
  token: string;
  tenantName: string;
  customerName: string;
  reference: string;
  serviceLabel: string | null;
  address: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  editable: boolean;
  lockedReason: "cancelled" | "past" | "no_slot" | null;
  timezone: string;
  days: Day[];
}) {
  const {
    token,
    tenantName,
    customerName,
    reference,
    serviceLabel,
    address,
    slotStart,
    slotEnd,
    editable,
    lockedReason,
    timezone,
    days,
  } = props;

  const [mode, setMode] = useState<"idle" | "reschedule" | "confirmCancel">("idle");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<Slot | null>(null);

  const [rescheduleState, rescheduleAction, reschedulePending] = useActionState<ManageState, FormData>(
    rescheduleBooking,
    null
  );
  const [cancelState, cancelAction, cancelPending] = useActionState<ManageState, FormData>(cancelBooking, null);

  const bookableDays = useMemo(() => days.filter((d) => d.hasAvailable), [days]);
  const selectedDay = useMemo(
    () => bookableDays.find((d) => d.date === pickedDate) ?? null,
    [bookableDays, pickedDate]
  );

  const done = rescheduleState?.ok ?? cancelState?.ok;
  const error = rescheduleState?.error ?? cancelState?.error;

  const currentLabel = slotStart
    ? `${formatInTimeZone(slotStart, timezone, "EEEE, d. MMMM yyyy", { locale: de })}, ${formatInTimeZone(
        slotStart,
        timezone,
        "HH:mm"
      )}${slotEnd ? `–${formatInTimeZone(slotEnd, timezone, "HH:mm")}` : ""} Uhr`
    : null;

  // After a successful change the page revalidates, but show a clear result
  // straight away so the customer knows it worked.
  if (done === "cancelled") {
    return (
      <Shell tenantName={tenantName}>
        <Result
          tone="neutral"
          title="Ihr Termin ist abgesagt"
          body={`Wir haben ${tenantName} informiert. Falls Sie doch einen Termin brauchen, melden Sie sich einfach wieder — wir freuen uns.`}
          reference={reference}
        />
      </Shell>
    );
  }

  if (done === "rescheduled" && pickedSlot) {
    return (
      <Shell tenantName={tenantName}>
        <Result
          tone="good"
          title="Ihr Termin ist verschoben"
          body={`Neuer Termin: ${formatInTimeZone(pickedSlot.start, timezone, "EEEE, d. MMMM yyyy", {
            locale: de,
          })}, ${pickedSlot.label}–${pickedSlot.endLabel} Uhr. Sie bekommen gleich eine Bestätigung per E-Mail.`}
          reference={reference}
        />
      </Shell>
    );
  }

  return (
    <Shell tenantName={tenantName}>
      <p className="text-sm text-gray-500">Hallo {customerName},</p>
      <h1 className="mt-1 text-xl font-bold tracking-tight">
        {editable ? "hier ist Ihr Termin." : "Ihr Termin"}
      </h1>

      {/* Current appointment */}
      <dl className="mt-5 divide-y divide-gray-200 rounded-xl border border-gray-200 text-sm">
        {serviceLabel && <Row label="Leistung" value={serviceLabel} />}
        <Row label="Termin" value={currentLabel ?? "Noch kein fester Termin"} strong={Boolean(currentLabel)} />
        {address && <Row label="Ort" value={address} />}
        <Row label="Vorgang" value={reference} />
      </dl>

      {!editable && <Locked reason={lockedReason} tenantName={tenantName} />}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {editable && mode === "idle" && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("reschedule")}
            className="rounded-lg bg-[#ec6a1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Termin verschieben
          </button>
          <button
            type="button"
            onClick={() => setMode("confirmCancel")}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-gray-900"
          >
            Termin absagen
          </button>
        </div>
      )}

      {/* Cancel confirmation */}
      {editable && mode === "confirmCancel" && (
        <div className="mt-5 rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold">Termin wirklich absagen?</p>
          <p className="mt-1 text-sm text-gray-500">
            Die Zeit wird wieder freigegeben. Sie können danach jederzeit einen neuen Termin anfragen.
          </p>
          <form action={cancelAction} className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              disabled={cancelPending}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {cancelPending ? "Wird abgesagt …" : "Ja, absagen"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={cancelPending}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 disabled:opacity-40"
            >
              Zurück
            </button>
          </form>
        </div>
      )}

      {/* Reschedule picker */}
      {editable && mode === "reschedule" && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Neuen Termin wählen</p>

          {bookableDays.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              Aktuell sind leider keine freien Zeiten verfügbar. Bitte rufen Sie uns kurz an — wir finden einen
              Termin für Sie.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-gray-500">Zuerst einen Tag, dann eine Uhrzeit.</p>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {bookableDays.map((day) => {
                  const active = day.date === pickedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        setPickedDate(day.date);
                        setPickedSlot(null);
                      }}
                      aria-pressed={active}
                      className={`flex min-w-16 shrink-0 flex-col items-center rounded-lg border px-3 py-2 transition ${
                        active
                          ? "border-[#ec6a1e] bg-[#ec6a1e] text-white"
                          : "border-gray-300 text-gray-700 hover:border-[#ec6a1e]"
                      }`}
                    >
                      <span className="text-xs font-medium">{WEEKDAYS[day.weekday]}</span>
                      <span className="text-base font-bold tabular-nums">
                        {formatInTimeZone(`${day.date}T12:00:00Z`, "UTC", "d")}
                      </span>
                      <span className="text-xs">
                        {formatInTimeZone(`${day.date}T12:00:00Z`, "UTC", "MMM", { locale: de })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedDay && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDay.slots.map((slot) => {
                    const active = pickedSlot?.start === slot.start;
                    const disabled = !slot.available;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={disabled}
                        onClick={() => setPickedSlot(slot)}
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-2 text-sm tabular-nums transition ${
                          slot.taken
                            ? "cursor-not-allowed border-gray-200 text-red-500 line-through"
                            : disabled
                              ? "cursor-not-allowed border-gray-200 text-gray-300"
                              : active
                                ? "border-[#ec6a1e] bg-[#ec6a1e] font-semibold text-white"
                                : "border-gray-300 text-gray-700 hover:border-[#ec6a1e]"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <form action={rescheduleAction} className="mt-5 flex flex-wrap items-center gap-3">
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="slotStart" value={pickedSlot?.start ?? ""} />
                <input type="hidden" name="slotEnd" value={pickedSlot?.end ?? ""} />
                <button
                  type="submit"
                  disabled={!pickedSlot || reschedulePending}
                  className="rounded-lg bg-[#ec6a1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                >
                  {reschedulePending ? "Wird verschoben …" : "Neuen Termin bestätigen"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("idle");
                    setPickedSlot(null);
                  }}
                  disabled={reschedulePending}
                  className="text-sm text-gray-500 underline hover:text-gray-900 disabled:opacity-40"
                >
                  Abbrechen
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}

function Shell({ tenantName, children }: { tenantName: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 py-10">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <span className="grid size-8 place-items-center rounded-lg bg-[#ec6a1e] text-sm font-bold text-white">
          {tenantName.trim().charAt(0).toUpperCase()}
        </span>
        <span className="font-semibold tracking-tight">{tenantName}</span>
      </div>
      <div className="pt-6">{children}</div>
      <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-400">
        🔒 Dieser Link ist persönlich — bitte nicht weitergeben.
      </p>
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
      <dd className={strong ? "font-semibold" : ""}>{value}</dd>
    </div>
  );
}

function Locked({
  reason,
  tenantName,
}: {
  reason: "cancelled" | "past" | "no_slot" | null;
  tenantName: string;
}) {
  const text =
    reason === "cancelled"
      ? "Dieser Termin wurde abgesagt. Melden Sie sich gern, wenn Sie einen neuen Termin brauchen."
      : reason === "past"
        ? "Dieser Termin liegt in der Vergangenheit und kann nicht mehr geändert werden."
        : `Für diese Anfrage steht noch kein fester Termin. ${tenantName} meldet sich bei Ihnen.`;

  return <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">{text}</p>;
}

function Result({
  tone,
  title,
  body,
  reference,
}: {
  tone: "good" | "neutral";
  title: string;
  body: string;
  reference: string;
}) {
  return (
    <div className="pt-4">
      <span
        className={`grid size-10 place-items-center rounded-full text-lg ${
          tone === "good" ? "bg-[#ec6a1e] text-white" : "bg-gray-100 text-gray-500"
        }`}
        aria-hidden="true"
      >
        {tone === "good" ? "✓" : "×"}
      </span>
      <h1 className="mt-3 text-xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">{body}</p>
      <p className="mt-4 text-xs text-gray-400">Vorgangsnummer: {reference}</p>
    </div>
  );
}
