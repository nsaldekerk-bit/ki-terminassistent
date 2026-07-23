"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Flash = "idle" | "copied" | "failed";

export interface CopyItem {
  value: string;
  /** Accessible button name, already localised. */
  aria: string;
  /** What the live region announces on success, already localised. */
  doneAnnounce: string;
}

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
  item,
  copiedText,
  failedText,
  failAnnounce,
  onResult,
}: {
  item: CopyItem;
  copiedText: string;
  failedText: string;
  failAnnounce: string;
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
      onResult(next === "copied" ? item.doneAnnounce : failAnnounce);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFlash("idle"), 2000);
    },
    [failAnnounce, item.doneAnnounce, onResult]
  );

  async function copy() {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(item.value);
        show("copied");
        return;
      } catch {
        // permission or policy blocked it — try the legacy path below
      }
    }
    show(legacyCopy(item.value) ? "copied" : "failed");
  }

  return (
    <button type="button" className={`vb-copy vb-${flash}`} onClick={copy} aria-label={item.aria}>
      <span>{item.value}</span>
      <span className="vb-copy-ic" aria-hidden="true">
        {IconCopy}
      </span>
      <span className="vb-copy-fb" aria-hidden="true">
        {flash === "copied" ? copiedText : flash === "failed" ? failedText : ""}
      </span>
    </button>
  );
}

export function CopyContact({
  items,
  copiedText,
  failedText,
  failAnnounce,
}: {
  items: CopyItem[];
  copiedText: string;
  failedText: string;
  failAnnounce: string;
}) {
  const [message, setMessage] = useState("");

  return (
    <>
      {items.map((item) => (
        <CopyButton
          key={item.value}
          item={item}
          copiedText={copiedText}
          failedText={failedText}
          failAnnounce={failAnnounce}
          onResult={setMessage}
        />
      ))}
      <p className="vb-sr" role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
