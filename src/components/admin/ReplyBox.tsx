"use client";

import { useActionState, useState } from "react";
import { sendRequestReply, type ReplyState } from "@/app/admin/(dashboard)/requests/actions";

export function ReplyBox({
  requestId,
  customerEmail,
  subject,
  defaultBody,
}: {
  requestId: string;
  customerEmail: string | null;
  subject: string;
  defaultBody: string;
}) {
  const [state, action, pending] = useActionState<ReplyState, FormData>(sendRequestReply, null);
  const [body, setBody] = useState(defaultBody);

  if (!customerEmail) {
    return (
      <p className="text-sm text-gray-500">
        Für diesen Kunden ist keine E-Mail-Adresse hinterlegt — eine Antwort per E-Mail ist nicht möglich.
      </p>
    );
  }

  const mailtoHref = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="space-y-3">
      <form action={action} className="space-y-2">
        <input type="hidden" name="id" value={requestId} />
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-gray-500"
          placeholder="Ihre Nachricht an den Kunden …"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {pending ? "Wird gesendet …" : "Antwort an Kunden senden"}
          </button>
          <a href={mailtoHref} className="text-sm text-gray-600 underline hover:text-gray-900">
            Stattdessen im E-Mail-Programm öffnen
          </a>
        </div>
        {state?.ok && (
          <p className="text-sm text-green-700">
            Antwort an {customerEmail} gesendet. Status wurde auf „Kontaktiert" gesetzt.
          </p>
        )}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
      <p className="text-xs text-gray-400">
        Gesendet wird über den hinterlegten E-Mail-Versand. Ist noch keiner eingerichtet, nutzen Sie „Im
        E-Mail-Programm öffnen" — das öffnet Ihr gewohntes Mailfach mit vorausgefüllter Adresse.
      </p>
    </div>
  );
}
