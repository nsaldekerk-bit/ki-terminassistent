"use client";

import { useActionState, useRef } from "react";
import { addFaqEntry, type FaqState } from "@/app/admin/(dashboard)/faq/actions";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function FaqForm({ locale }: { locale: Locale }) {
  const a = dictionaries[locale].admin.faq;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FaqState, FormData>(async (prev, fd) => {
    const result = await addFaqEntry(prev, fd);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form ref={formRef} action={action} className="max-w-2xl space-y-3 rounded-lg border border-gray-200 p-4">
      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">{a.question}</span>
        <input
          type="text"
          name="question"
          required
          placeholder={a.questionPlaceholder}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">{a.answer}</span>
        <textarea
          name="answer"
          required
          rows={3}
          placeholder={a.answerPlaceholder}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">{a.keywords}</span>
        <input
          type="text"
          name="keywords"
          placeholder={a.keywordsPlaceholder}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <span className="mt-1 block text-xs text-gray-400">{a.keywordsHint}</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {pending ? "…" : a.addQuestion}
        </button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
