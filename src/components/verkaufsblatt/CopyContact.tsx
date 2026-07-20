"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Flash = "idle" | "copied" | "failed";

/**
 * navigator.clipboard is unavailable on insecure origins and blocked in some
 * embedded contexts, so fall back to the legacy selection trick before telling
 * the visitor it did not work.
 */
function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, ta.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

const IconCopy = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
);

function CopyButton({
  value,
  label,
  onResult,
}: {
  value: string;
  label: string;
  onResult: (message: string) => void;
}) {
  const [flash, setFlash] = useState<Flash>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const show = useCallback(
    (next: Exclude<Flash, "idle">) => {
      setFlash(next);
      onResult(
        next === "copied" ? `${value} kopiert` : "Kopieren nicht möglich — bitte manuell markieren"
      );
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlash("idle"), 2000);
    },
    [onResult, value]
  );

  async function copy() {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        show("copied");
        return;
      } catch {
        // permission or policy blocked it — try the legacy path below
      }
    }
    show(legacyCopy(value) ? "copied" : "failed");
  }

  return (
    <button type="button" className={`vb-copy vb-${flash}`} onClick={copy} aria-label={label}>
      <span>{value}</span>
      <span className="vb-copy-ic" aria-hidden="true">
        {IconCopy}
      </span>
      <span className="vb-copy-fb" aria-hidden="true" />
    </button>
  );
}

export function CopyContact({ phone, email }: { phone: string; email: string }) {
  const [message, setMessage] = useState("");

  return (
    <>
      <CopyButton value={phone} label={`Telefonnummer ${phone} kopieren`} onResult={setMessage} />
      <CopyButton value={email} label={`E-Mail-Adresse ${email} kopieren`} onResult={setMessage} />
      <span className="vb-copy-note">Zum Kopieren antippen</span>
      <p className="vb-sr" role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
