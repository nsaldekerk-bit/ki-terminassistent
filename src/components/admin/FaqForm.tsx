"use client";

import { useActionState, useRef } from "react";
import { addFaqEntry, type FaqState } from "@/app/admin/(dashboard)/faq/actions";

export function FaqForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FaqState, FormData>(async (prev, fd) => {
    const result = await addFaqEntry(prev, fd);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form ref={formRef} action={action} className="max-w-2xl space-y-3 rounded-lg border border-gray-200 p-4">
      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">Frage</span>
        <input
          type="text"
          name="question"
          required
          placeholder="Machen Sie auch Notdienst?"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">Antwort</span>
        <textarea
          name="answer"
          required
          rows={3}
          placeholder="Ja, wir sind rund um die Uhr für Notfälle erreichbar."
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">Stichworte (optional)</span>
        <input
          type="text"
          name="keywords"
          placeholder="notdienst, notfall, wochenende"
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-400">
          Zusätzliche Wörter, bei denen diese Antwort passen soll — durch Komma getrennt.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {pending ? "…" : "Frage hinzufügen"}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
