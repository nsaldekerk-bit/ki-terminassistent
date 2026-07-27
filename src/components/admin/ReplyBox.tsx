"use client";

import { useActionState, useState } from "react";
import { sendRequestReply, type ReplyState } from "@/app/admin/(dashboard)/requests/actions";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function ReplyBox({
  locale,
  requestId,
  customerEmail,
  subject,
  defaultBody,
}: {
  locale: Locale;
  requestId: string;
  customerEmail: string | null;
  subject: string;
  defaultBody: string;
}) {
  const r = dictionaries[locale].admin.reply;
  const [state, action, pending] = useActionState<ReplyState, FormData>(sendRequestReply, null);
  const [body, setBody] = useState(defaultBody);

  if (!customerEmail) {
    return <p className="text-sm text-gray-500">{r.noEmail}</p>;
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
          placeholder={r.placeholder}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {pending ? r.sending : r.send}
          </button>
          <a href={mailtoHref} className="text-sm text-gray-600 underline hover:text-gray-900">
            {r.openMail}
          </a>
        </div>
        {state?.ok && <p className="text-sm text-green-700">{r.sentTo(customerEmail)}</p>}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
      <p className="text-xs text-gray-400">{r.hint}</p>
    </div>
  );
}
