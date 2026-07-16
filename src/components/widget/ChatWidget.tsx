"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface WidgetService {
  id: string;
  name: string;
}

type Mode = "consultation" | "booking";
type Step =
  | "welcome"
  | "service"
  | "flaeche"
  | "situation"
  | "fotos"
  | "ort"
  | "termin"
  | "kontakt"
  | "summary";

interface FlowItem {
  step: Step;
  text: string;
  sub?: string;
}

interface WidgetData {
  service?: string | null;
  serviceLabel?: string;
  flaeche?: string;
  flaecheNum?: string;
  situation?: string;
  fotos: string[];
  strasse?: string;
  ort?: string;
  datum?: string;
  tageszeit?: string;
  slotStart?: string;
  slotEnd?: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefon?: string;
}

interface AvailSlot {
  start: string;
  end: string;
  label: string;
  endLabel: string;
  available: boolean;
  taken: boolean;
}
interface AvailDay {
  date: string;
  weekday: number;
  hasAvailable: boolean;
  slots: AvailSlot[];
}
interface AvailResponse {
  timezone: string;
  durationMinutes: number;
  days: AvailDay[];
}

interface FaqTurn {
  question: string;
  answer: string;
  needsHuman: boolean;
}

type PlzState = null | { checking: true } | { checking: false; covered: boolean; checked: boolean };

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const monthKey = (dateStr: string) => {
  const [y, m] = dateStr.split("-").map(Number);
  return y * 12 + (m - 1);
};

const emptyData: WidgetData = { fotos: [] };

const PROMPTS: Record<Step, string> = {
  welcome:
    "Ich nehme Ihre Anfrage in wenigen Schritten auf — Sie bekommen zeitnah eine persönliche Rückmeldung.\n\nWie möchten Sie starten?",
  service: "Um welche Leistung geht es?",
  flaeche: "Wie groß ist die Fläche ungefähr? Eine grobe Schätzung genügt.",
  situation: "Beschreiben Sie kurz Ihre Situation. Je mehr wir wissen, desto besser können wir vorbereiten.",
  fotos: "Haben Sie ein paar Fotos? Das hilft uns enorm, den Aufwand richtig einzuschätzen. (optional)",
  ort: "Wo soll die Arbeit ausgeführt werden?",
  termin: "Wann würde es Ihnen am besten passen? Wählen Sie einen freien Tag und eine freie Uhrzeit.",
  kontakt: "Zum Schluss: Wie erreichen wir Sie?",
  summary: "Bitte prüfen Sie Ihre Angaben — dann schicke ich alles direkt an den Betrieb.",
};

function nextStep(step: Step, mode: Mode | null): Step | null {
  switch (step) {
    case "welcome":
      return "service";
    case "service":
      return mode === "booking" ? "flaeche" : "situation";
    case "flaeche":
      return "situation";
    case "situation":
      return "fotos";
    case "fotos":
      return "ort";
    case "ort":
      return "termin";
    case "termin":
      return "kontakt";
    case "kontakt":
      return "summary";
    default:
      return null;
  }
}

function pathFor(mode: Mode | null): Step[] {
  if (mode === "booking")
    return ["welcome", "service", "flaeche", "situation", "fotos", "ort", "termin", "kontakt", "summary"];
  if (mode === "consultation")
    return ["welcome", "service", "situation", "fotos", "ort", "termin", "kontakt", "summary"];
  return ["welcome"];
}

async function compressImage(file: File, max = 1280, quality = 0.7): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
    let { width, height } = img;
    if (width > max || height > max) {
      const scale = Math.min(max / width, max / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00`).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });

export function ChatWidget({
  tenantSlug,
  tenantName,
  services,
  emergencyPhone,
  emergencyNote,
  hasServiceArea,
}: {
  tenantSlug: string;
  tenantName: string;
  services: WidgetService[];
  emergencyPhone?: string | null;
  emergencyNote?: string | null;
  hasServiceArea?: boolean;
}) {
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const monogram = tenantName.trim().charAt(0).toUpperCase() || "?";

  const [mode, setMode] = useState<Mode | null>(null);
  const [current, setCurrent] = useState<Step>("welcome");
  const [flow, setFlow] = useState<FlowItem[]>([]);
  const [data, setData] = useState<WidgetData>(emptyData);
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [manageUrl, setManageUrl] = useState<string | null>(null);

  const [avail, setAvail] = useState<AvailResponse | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [availReloadToken, setAvailReloadToken] = useState(0);
  const [monthCursor, setMonthCursor] = useState<{ y: number; m: number } | null>(null);
  const [selDate, setSelDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // FAQ: a small question-and-answer exchange before the customer commits to a path.
  const [faqInput, setFaqInput] = useState("");
  const [faqLog, setFaqLog] = useState<FaqTurn[]>([]);
  const [faqBusy, setFaqBusy] = useState(false);

  // Emergency fast path.
  const [emergency, setEmergency] = useState(false);

  // Postcode / service-area check.
  const [plz, setPlz] = useState("");
  const [plzState, setPlzState] = useState<PlzState>(null);

  // GDPR consent — the customer must actively agree before we store anything.
  const [consent, setConsent] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const done = reference !== null;

  useEffect(() => {
    if (done || reduceMotion || current === "welcome") {
      setTyping(false);
      return;
    }
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 560);
    return () => clearTimeout(t);
  }, [current, done, reduceMotion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [flow, current, typing, done]);

  // Prefetch availability in the background as soon as a service is picked, so
  // the calendar is ready by the time the customer reaches the date step.
  useEffect(() => {
    if (!mode || !data.serviceLabel) return;
    let cancelled = false;
    setAvail(null);
    setSelDate(null);
    setAvailLoading(true);
    setAvailError(null);
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantSlug, mode, serviceId: data.service ?? null }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((json: AvailResponse) => {
        if (cancelled) return;
        setAvail(json);
        const first = json.days.find((d) => d.hasAvailable) ?? json.days[0];
        if (first) {
          const [y, m] = first.date.split("-").map(Number);
          setMonthCursor({ y, m: m - 1 });
        }
      })
      .catch(() => {
        if (!cancelled) setAvailError("Verfügbarkeiten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, data.service, data.serviceLabel, tenantSlug, availReloadToken]);

  const progress = useMemo(() => {
    if (done) return 100;
    const path = pathFor(mode);
    const idx = path.indexOf(current);
    if (current === "welcome") return 4;
    return Math.max(4, Math.min(100, Math.round((idx / (path.length - 1)) * 100)));
  }, [mode, current, done]);

  function patch(p: Partial<WidgetData>) {
    setData((prev) => ({ ...prev, ...p }));
  }

  function goTo(step: Step | null) {
    if (step) setCurrent(step);
  }

  function answer(step: Step, text: string, sub?: string) {
    setFlow((prev) => [...prev, { step, text, sub }]);
    goTo(nextStep(step, mode));
  }

  function pick(key: string, cb: () => void) {
    setPending(key);
    if (reduceMotion) {
      cb();
      setPending(null);
      return;
    }
    setTimeout(() => {
      cb();
      setPending(null);
    }, 280);
  }

  function backTo(step: Step) {
    setFlow((prev) => {
      const i = prev.findIndex((f) => f.step === step);
      return i >= 0 ? prev.slice(0, i) : prev;
    });
    setFormError(null);
    setInvalid([]);
    setCurrent(step);
  }

  function goBackOne() {
    if (!flow.length) return;
    const last = flow[flow.length - 1];
    setFlow(flow.slice(0, -1));
    setFormError(null);
    setInvalid([]);
    setCurrent(last.step);
  }

  function reset() {
    setMode(null);
    setFlow([]);
    setData(emptyData);
    setReference(null);
    setFormError(null);
    setInvalid([]);
    setCurrent("welcome");
    resetAvailability();
  }

  function resetAvailability() {
    setAvail(null);
    setAvailError(null);
    setSelDate(null);
    setMonthCursor(null);
    setNotice(null);
  }

  function chooseMode(m: Mode, label: string) {
    setMode(m);
    setFlow((prev) => [...prev, { step: "welcome", text: label }]);
    setCurrent("service");
  }

  /** Emergency path: same intake, but flagged so the business sees it first. */
  function chooseEmergency() {
    setEmergency(true);
    setMode("booking");
    setFlow((prev) => [...prev, { step: "welcome", text: "Notfall" }]);
    setCurrent("service");
  }

  async function askFaq(e: React.FormEvent) {
    e.preventDefault();
    const question = faqInput.trim();
    if (question.length < 2 || faqBusy) return;

    setFaqBusy(true);
    setFaqInput("");
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, question }),
      });
      if (!res.ok) throw new Error("faq_failed");
      const json = await res.json();
      setFaqLog((prev) => [
        ...prev,
        { question, answer: json.answer, needsHuman: Boolean(json.needsHuman) },
      ]);
    } catch {
      setFaqLog((prev) => [
        ...prev,
        {
          question,
          answer: "Das konnte ich gerade nicht nachschlagen. Fragen Sie es gern direkt beim Betrieb an.",
          needsHuman: true,
        },
      ]);
    } finally {
      setFaqBusy(false);
    }
  }

  async function checkPlz(value: string) {
    const postcode = value.trim();
    if (!/^\d{5}$/.test(postcode)) {
      setPlzState(null);
      return;
    }
    setPlzState({ checking: true });
    try {
      const res = await fetch("/api/service-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug, postcode }),
      });
      if (!res.ok) throw new Error("check_failed");
      const json = await res.json();
      setPlzState({ checking: false, covered: Boolean(json.covered), checked: Boolean(json.checked) });
    } catch {
      // Never block the customer on a failed check.
      setPlzState({ checking: false, covered: true, checked: false });
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const room = 6 - data.fotos.length;
    const files = Array.from(fileList).slice(0, Math.max(0, room));
    const added: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      added.push(await compressImage(file));
    }
    if (added.length) setData((prev) => ({ ...prev, fotos: [...prev.fotos, ...added] }));
  }

  async function submit() {
    setSubmitting(true);
    setFormError(null);
    try {
      const address = [data.strasse, [plz, data.ort].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ") || null;
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          type: mode,
          serviceId: data.service ?? null,
          serviceLabel: data.serviceLabel ?? null,
          areaText: data.flaeche ?? null,
          situation: data.situation ?? null,
          address,
          postcode: /^\d{5}$/.test(plz) ? plz : null,
          isEmergency: emergency,
          consent: true,
          slotStart: data.slotStart ?? null,
          slotEnd: data.slotEnd ?? null,
          customer: {
            vorname: data.vorname,
            nachname: data.nachname,
            email: data.email,
            telefon: data.telefon,
          },
          photos: data.fotos,
        }),
      });
      if (res.status === 409) {
        patch({ slotStart: undefined, slotEnd: undefined });
        setSelDate(null);
        setNotice("Dieser Termin wurde leider gerade vergeben. Bitte wählen Sie einen anderen freien Termin.");
        setAvailReloadToken((t) => t + 1);
        backTo("termin");
        return;
      }
      if (!res.ok) throw new Error("request_failed");
      const json = await res.json();
      setReference(json.reference ?? "—");
      setManageUrl(json.manageUrl ?? null);
    } catch {
      setFormError("Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- render helpers ----
  const serviceChips = [...services, { id: "__other__", name: "Etwas anderes" }];

  function renderDock() {
    switch (current) {
      case "welcome":
        return (
          <div className="kt-choice">
            {/* Ask first, commit later — most visitors just have a question. */}
            <form className="kt-ask" onSubmit={askFaq}>
              <input
                type="text"
                className="kt-ask-in"
                placeholder="Frage stellen — z. B. „Wann haben Sie geöffnet?“"
                value={faqInput}
                onChange={(e) => setFaqInput(e.target.value)}
                disabled={faqBusy}
                aria-label="Frage an den Betrieb"
              />
              <button
                type="submit"
                className="kt-ask-go"
                disabled={faqBusy || faqInput.trim().length < 2}
                aria-label="Frage absenden"
              >
                {faqBusy ? <span className="kt-spin" /> : IconSend}
              </button>
            </form>

            <div className="kt-or">
              <span>oder</span>
            </div>

            <button
              className="kt-card"
              onClick={() => chooseMode("consultation", "Beratung / Rückruf")}
              type="button"
            >
              <span className="kt-ic">{IconChat}</span>
              <span className="kt-ct">
                <b>Beratung / Rückruf</b>
                <span>Fragen klären, Kostenvoranschlag oder erst besprechen.</span>
              </span>
              <span className="kt-chev">{IconChevron}</span>
            </button>
            <button className="kt-card" onClick={() => chooseMode("booking", "Termin buchen")} type="button">
              <span className="kt-ic">{IconCalendar}</span>
              <span className="kt-ct">
                <b>Termin buchen</b>
                <span>Sie wissen, was gemacht werden soll — Vor-Ort-Termin.</span>
              </span>
              <span className="kt-chev">{IconChevron}</span>
            </button>

            {emergencyPhone && (
              <button className="kt-card kt-sos" onClick={chooseEmergency} type="button">
                <span className="kt-ic">{IconAlert}</span>
                <span className="kt-ct">
                  <b>Notfall</b>
                  <span>
                    Sofort anrufen: {emergencyPhone}
                    {emergencyNote ? ` — ${emergencyNote}` : ""}
                  </span>
                </span>
                <span className="kt-chev">{IconChevron}</span>
              </button>
            )}
          </div>
        );

      case "service":
        return (
          <div className="kt-chips" style={{ pointerEvents: pending ? "none" : "auto" }}>
            {serviceChips.map((s) => {
              const isOther = s.id === "__other__";
              const sel = pending === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`kt-chip${sel ? " sel" : ""}`}
                  onClick={() => {
                    patch({ service: isOther ? null : s.id, serviceLabel: s.name });
                    resetAvailability();
                    pick(s.id, () => answer("service", s.name));
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        );

      case "flaeche": {
        const quick = ["bis 5 m²", "5–15 m²", "15–30 m²", "über 30 m²", "weiß ich nicht"];
        return (
          <div className="kt-field">
            <p className="kt-hint">Wählen Sie einen Bereich oder geben Sie die Fläche ein:</p>
            <div className="kt-chips" style={{ pointerEvents: pending ? "none" : "auto" }}>
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`kt-chip${pending === q ? " sel" : ""}`}
                  onClick={() => {
                    patch({ flaeche: q, flaecheNum: "" });
                    pick(q, () => answer("flaeche", q));
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="kt-area">
              <input
                className="kt-inp"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="z. B. 12"
                value={data.flaecheNum ?? ""}
                onChange={(e) => patch({ flaecheNum: e.target.value })}
                style={{ paddingRight: "2.6rem" }}
              />
              <span className="kt-unit">m²</span>
            </div>
            <div className="kt-actions">
              <button
                type="button"
                className="kt-btn kt-primary"
                onClick={() => {
                  const v = (data.flaecheNum ?? "").trim();
                  if (!v) return;
                  const label = `${v} m²`;
                  patch({ flaeche: label });
                  answer("flaeche", label);
                }}
              >
                Weiter
              </button>
            </div>
          </div>
        );
      }

      case "situation":
        return (
          <div className="kt-field">
            <textarea
              className="kt-inp kt-ta"
              placeholder="z. B. Altes Bad komplett erneuern, Fliesen und Sanitär raus, barrierefreie Dusche gewünscht …"
              value={data.situation ?? ""}
              onChange={(e) => patch({ situation: e.target.value })}
            />
            <div className="kt-actions">
              <button
                type="button"
                className="kt-btn kt-primary"
                onClick={() => answer("situation", (data.situation ?? "").trim() || "Keine Beschreibung")}
              >
                Weiter
              </button>
            </div>
          </div>
        );

      case "fotos":
        return (
          <div className="kt-field">
            <label className="kt-drop">
              {IconUpload}
              <b>Fotos hinzufügen</b>
              <span>tippen zum Auswählen · JPG, PNG · bis zu 6</span>
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {data.fotos.length > 0 && (
              <div className="kt-thumbs">
                {data.fotos.map((src, i) => (
                  <div key={i} className="kt-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${i + 1}`} />
                    <button
                      type="button"
                      className="kt-x"
                      aria-label="Foto entfernen"
                      onClick={() => setData((prev) => ({ ...prev, fotos: prev.fotos.filter((_, j) => j !== i) }))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="kt-actions">
              {data.fotos.length === 0 && (
                <button
                  type="button"
                  className="kt-btn kt-ghost"
                  onClick={() => answer("fotos", "Keine Fotos")}
                >
                  Überspringen
                </button>
              )}
              <button
                type="button"
                className="kt-btn kt-primary"
                onClick={() => {
                  const n = data.fotos.length;
                  answer("fotos", n ? `${n} ${n === 1 ? "Foto" : "Fotos"} hinzugefügt` : "Keine Fotos");
                }}
              >
                {data.fotos.length ? `Weiter (${data.fotos.length})` : "Weiter"}
              </button>
            </div>
          </div>
        );

      case "ort":
        return (
          <div className="kt-field">
            <label className="kt-lab">Adresse</label>
            <input
              className="kt-inp"
              placeholder="Straße und Hausnummer"
              value={data.strasse ?? ""}
              onChange={(e) => patch({ strasse: e.target.value })}
            />
            <div className="kt-row-plz">
              <input
                className={`kt-inp${invalid.includes("plz") ? " err" : ""}`}
                placeholder="PLZ"
                inputMode="numeric"
                maxLength={5}
                value={plz}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                  setPlz(v);
                  setInvalid((prev) => prev.filter((x) => x !== "plz"));
                  if (v.length === 5) void checkPlz(v);
                  else setPlzState(null);
                }}
              />
              <input
                className={`kt-inp${invalid.includes("ort") ? " err" : ""}`}
                placeholder="Ort"
                value={data.ort ?? ""}
                onChange={(e) => {
                  patch({ ort: e.target.value });
                  setInvalid((prev) => prev.filter((x) => x !== "ort"));
                }}
              />
            </div>

            {invalid.includes("plz") && <div className="kt-err">Bitte geben Sie eine fünfstellige PLZ an.</div>}
            {invalid.includes("ort") && <div className="kt-err">Bitte geben Sie den Ort an.</div>}

            {/* Tell the customer right away whether we even travel there. */}
            {plzState?.checking && <div className="kt-hint">Einzugsgebiet wird geprüft …</div>}
            {plzState && !plzState.checking && plzState.checked && plzState.covered && (
              <div className="kt-ok">✓ Sehr gut — zu Ihnen kommen wir.</div>
            )}
            {plzState && !plzState.checking && plzState.checked && !plzState.covered && (
              <div className="kt-warn">
                Diese Postleitzahl liegt außerhalb unseres üblichen Einzugsgebiets. Sie können die Anfrage
                trotzdem senden — wir melden uns und sagen Ihnen ehrlich, ob wir es einrichten können.
              </div>
            )}

            <div className="kt-actions">
              <button
                type="button"
                className="kt-btn kt-primary"
                onClick={() => {
                  const bad: string[] = [];
                  if (!/^\d{5}$/.test(plz)) bad.push("plz");
                  if (!(data.ort ?? "").trim()) bad.push("ort");
                  if (bad.length > 0) {
                    setInvalid(bad);
                    return;
                  }
                  const full = [data.strasse, `${plz} ${(data.ort ?? "").trim()}`]
                    .map((s) => (s ?? "").trim())
                    .filter(Boolean)
                    .join(", ");
                  answer("ort", full);
                }}
              >
                Weiter
              </button>
            </div>
          </div>
        );

      case "termin":
        return renderTermin();

      case "kontakt":
        return (
          <div className="kt-field">
            <div className="kt-row2">
              <input
                className={`kt-inp${invalid.includes("vorname") ? " err" : ""}`}
                placeholder="Vorname"
                value={data.vorname ?? ""}
                onChange={(e) => patch({ vorname: e.target.value })}
              />
              <input
                className={`kt-inp${invalid.includes("nachname") ? " err" : ""}`}
                placeholder="Nachname"
                value={data.nachname ?? ""}
                onChange={(e) => patch({ nachname: e.target.value })}
              />
            </div>
            <input
              className={`kt-inp${invalid.includes("email") ? " err" : ""}`}
              type="email"
              placeholder="E-Mail-Adresse"
              value={data.email ?? ""}
              onChange={(e) => patch({ email: e.target.value })}
            />
            <input
              className={`kt-inp${invalid.includes("telefon") ? " err" : ""}`}
              type="tel"
              placeholder="Telefonnummer"
              value={data.telefon ?? ""}
              onChange={(e) => patch({ telefon: e.target.value })}
            />
            {formError && <div className="kt-err">{formError}</div>}
            <div className="kt-actions">
              <button
                type="button"
                className="kt-btn kt-primary"
                onClick={() => {
                  const bad: string[] = [];
                  if (!(data.vorname ?? "").trim()) bad.push("vorname");
                  if (!(data.nachname ?? "").trim()) bad.push("nachname");
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email ?? "").trim())) bad.push("email");
                  if ((data.telefon ?? "").replace(/[^\d]/g, "").length < 6) bad.push("telefon");
                  if (bad.length) {
                    setInvalid(bad);
                    setFormError("Bitte prüfen Sie die markierten Felder.");
                    return;
                  }
                  setInvalid([]);
                  setFormError(null);
                  answer(
                    "kontakt",
                    `${(data.vorname ?? "").trim()} ${(data.nachname ?? "").trim()}`,
                    `${(data.email ?? "").trim()} · ${(data.telefon ?? "").trim()}`
                  );
                }}
              >
                Anfrage prüfen
              </button>
            </div>
          </div>
        );

      case "summary":
        return renderSummary();

      default:
        return null;
    }
  }

  function renderTermin() {
    if (availLoading && !avail) {
      return (
        <div className="kt-field">
          {notice && <div className="kt-notice">{notice}</div>}
          <div className="kt-loading">
            <span className="kt-spin" />
            Freie Termine werden geladen …
          </div>
        </div>
      );
    }
    if (availError) {
      return (
        <div className="kt-field">
          <div className="kt-notice">{availError}</div>
          <div className="kt-actions">
            <button
              type="button"
              className="kt-btn kt-primary"
              onClick={() => {
                setAvailError(null);
                setAvailReloadToken((t) => t + 1);
              }}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }
    if (!avail || !monthCursor) return null;

    const dayMap = new Map(avail.days.map((d) => [d.date, d]));
    const anyAvailable = avail.days.some((d) => d.hasAvailable);
    const minMonth = avail.days[0] ? monthKey(avail.days[0].date) : null;
    const maxMonth = avail.days.length ? monthKey(avail.days[avail.days.length - 1].date) : null;
    const curKey = monthCursor.y * 12 + monthCursor.m;

    const monthName = new Date(monthCursor.y, monthCursor.m, 1).toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
    const daysInMonth = new Date(monthCursor.y, monthCursor.m + 1, 0).getDate();
    const lead = (new Date(monthCursor.y, monthCursor.m, 1).getDay() + 6) % 7;
    const cells: (number | null)[] = [
      ...Array(lead).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    const selDay = selDate ? dayMap.get(selDate) : undefined;

    const shiftMonth = (delta: number) => {
      const total = monthCursor.y * 12 + monthCursor.m + delta;
      setMonthCursor({ y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 });
    };

    if (!anyAvailable) {
      return (
        <div className="kt-field">
          {notice && <div className="kt-notice">{notice}</div>}
          <div className="kt-notice">
            Aktuell sind online keine freien Zeiten in den nächsten Wochen verfügbar.
          </div>
          <div className="kt-actions">
            <button
              type="button"
              className="kt-btn kt-primary"
              onClick={() => answer("termin", "Kein fester Termin – bitte um Rückmeldung")}
            >
              Ohne festen Termin anfragen
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="kt-field">
        {notice && <div className="kt-notice">{notice}</div>}
        <div className="kt-cal">
          <div className="kt-cal-head">
            <span className="kt-cal-title">{monthName}</span>
            <div className="kt-cal-nav">
              <button
                type="button"
                aria-label="Vorheriger Monat"
                disabled={minMonth == null || curKey <= minMonth}
                onClick={() => shiftMonth(-1)}
              >
                {IconLeft}
              </button>
              <button
                type="button"
                aria-label="Nächster Monat"
                disabled={maxMonth == null || curKey >= maxMonth}
                onClick={() => shiftMonth(1)}
              >
                {IconRight}
              </button>
            </div>
          </div>
          <div className="kt-grid">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="kt-wd">
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (d == null) return <div key={`b${i}`} className="kt-day blank" />;
              const dateStr = `${monthCursor.y}-${pad2(monthCursor.m + 1)}-${pad2(d)}`;
              const ad = dayMap.get(dateStr);
              const on = !!ad?.hasAvailable;
              const sel = selDate === dateStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!on}
                  className={`kt-day ${sel ? "sel" : on ? "on" : "off"}`}
                  onClick={() => {
                    setSelDate(dateStr);
                    patch({ slotStart: undefined, slotEnd: undefined });
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {selDay ? (
          <>
            <p className="kt-cal-cap">
              Freie Zeiten am {dateLabel(selDay.date)} (je {avail.durationMinutes} Min):
            </p>
            <div className="kt-slots">
              {selDay.slots.map((s) => {
                const chosen = data.slotStart === s.start;
                const cls = chosen ? "sel" : s.taken ? "taken" : !s.available ? "off" : "";
                return (
                  <button
                    key={s.start}
                    type="button"
                    disabled={!s.available}
                    title={s.taken ? "Bereits vergeben" : undefined}
                    className={`kt-slot ${cls}`}
                    onClick={() =>
                      patch({
                        slotStart: s.start,
                        slotEnd: s.end,
                        datum: selDay.date,
                        tageszeit: `${s.label}–${s.endLabel} Uhr`,
                      })
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="kt-cal-cap">Bitte wählen Sie oben einen freien Tag (orange).</p>
        )}

        <div className="kt-actions">
          <button
            type="button"
            className="kt-btn kt-primary"
            disabled={!data.slotStart}
            onClick={() => answer("termin", data.datum ? dateLabel(data.datum) : "", data.tageszeit)}
          >
            Weiter
          </button>
        </div>
      </div>
    );
  }

  function renderSummary() {
    const rows: [string, string, Step][] = [];
    rows.push([
      "Anliegen",
      emergency ? "Notfall" : mode === "booking" ? "Termin buchen" : "Beratung / Rückruf",
      "welcome",
    ]);
    rows.push(["Leistung", data.serviceLabel ?? "—", "service"]);
    if (mode === "booking") rows.push(["Fläche", data.flaeche ?? "—", "flaeche"]);
    rows.push(["Situation", data.situation?.trim() || "—", "situation"]);
    rows.push(["Fotos", data.fotos.length ? `${data.fotos.length} ${data.fotos.length === 1 ? "Foto" : "Fotos"}` : "keine", "fotos"]);
    rows.push([
      "Ort",
      [data.strasse, [plz, data.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—",
      "ort",
    ]);
    rows.push([
      "Termin",
      data.slotStart && data.datum ? `${dateLabel(data.datum)}, ${data.tageszeit}` : "Kein fester Termin",
      "termin",
    ]);
    rows.push(["Name", `${data.vorname ?? ""} ${data.nachname ?? ""}`.trim(), "kontakt"]);
    rows.push(["Kontakt", `${data.email ?? ""} · ${data.telefon ?? ""}`, "kontakt"]);

    return (
      <div className="kt-field">
        <div className="kt-review">
          {rows.map(([k, v, step], i) => (
            <div key={i} className="kt-r">
              <span className="kt-k">{k}</span>
              <span className="kt-v">{v}</span>
              <button type="button" className="kt-edit" onClick={() => backTo(step)} disabled={submitting}>
                Ändern
              </button>
            </div>
          ))}
        </div>
        {formError && <div className="kt-err">{formError}</div>}

        {/* GDPR: an explicit, unticked opt-in before any personal data is stored. */}
        <label className="kt-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={submitting}
          />
          <span>
            Ich bin einverstanden, dass {tenantName} meine Angaben speichert und verarbeitet, um meine Anfrage
            zu bearbeiten. Die Daten werden nicht an Dritte weitergegeben. Ich kann diese Einwilligung
            jederzeit widerrufen.
          </span>
        </label>

        <div className="kt-actions">
          <button type="button" className="kt-btn kt-ghost" onClick={goBackOne} disabled={submitting}>
            Zurück
          </button>
          <button
            type="button"
            className="kt-btn kt-primary"
            onClick={() => void submit()}
            disabled={submitting || !consent}
          >
            {submitting ? "Wird gesendet …" : "Anfrage absenden"}
          </button>
        </div>
      </div>
    );
  }

  const showBack = current !== "welcome" && current !== "summary" && flow.length > 0 && !typing;

  return (
    <div className="kt">
      <style>{CSS}</style>

      <header className="kt-head">
        <div className="kt-avatar" aria-hidden="true">
          {monogram}
        </div>
        <div className="kt-who">
          <span className="kt-name">{tenantName}</span>
          <span className="kt-status">
            <span className="kt-dot" />
            Antwort meist in wenigen Minuten
          </span>
        </div>
        <button className="kt-close" type="button" onClick={reset} aria-label="Neu starten" title="Neu starten">
          {IconRestart}
        </button>
      </header>

      <div className="kt-progress">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="kt-scroll" ref={scrollRef}>
        <div className="kt-msg ai">
          <div className="kt-bubble">Willkommen bei {tenantName}.</div>
        </div>

        {/* Questions asked before picking a path, and their answers. */}
        {faqLog.map((turn, i) => (
          <div key={`faq-${i}`}>
            <div className="kt-msg me">
              <div className="kt-bubble">{turn.question}</div>
            </div>
            <div className="kt-msg ai">
              <div className="kt-bubble">
                {renderText(turn.answer)}
                {turn.needsHuman && (
                  <button type="button" className="kt-inline-cta" onClick={() => chooseMode("consultation", "Beratung / Rückruf")}>
                    Rückruf anfordern
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {faqBusy && (
          <div className="kt-msg ai">
            <div className="kt-typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}

        {flow.map((item, i) => (
          <div key={i}>
            <div className="kt-msg ai">
              <div className="kt-bubble">{renderText(PROMPTS[item.step])}</div>
            </div>
            <div className="kt-msg me">
              <div className="kt-bubble">
                {item.text}
                {item.sub && <span className="kt-sub">{item.sub}</span>}
              </div>
            </div>
          </div>
        ))}
        {!done && !typing && (
          <div className="kt-msg ai">
            <div className="kt-bubble">{renderText(PROMPTS[current])}</div>
          </div>
        )}
        {typing && (
          <div className="kt-msg ai">
            <div className="kt-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {done && (
          <div className="kt-success">
            <div className="kt-check">{IconCheck}</div>
            <h2>Vielen Dank, {data.vorname}!</h2>
            <p>
              {data.slotStart && data.datum
                ? `Ihr Wunschtermin am ${dateLabel(data.datum)} um ${data.tageszeit} ist bei uns eingegangen. Wir bestätigen ihn in Kürze.`
                : "Ihre Anfrage ist eingegangen. Wir melden uns zeitnah bei Ihnen — in der Regel innerhalb von 24 Stunden, meist schneller."}
            </p>
            <div className="kt-ref">
              Ihre Vorgangsnummer: <b>{reference}</b>
            </div>
            {data.slotStart && manageUrl && (
              <div className="kt-links">
                <a
                  className="kt-manage"
                  href={manageUrl.replace("/termin/", "/api/calendar/")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  In meinen Kalender eintragen
                </a>
                <a className="kt-manage" href={manageUrl} target="_blank" rel="noopener noreferrer">
                  Termin verschieben oder absagen
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="kt-dock">
        {done ? (
          <div className="kt-actions">
            <button type="button" className="kt-btn kt-ghost" style={{ flex: 1 }} onClick={reset}>
              Neue Anfrage
            </button>
          </div>
        ) : (
          !typing && renderDock()
        )}
        {showBack && (
          <div className="kt-back">
            <button type="button" className="kt-link" onClick={goBackOne}>
              ← Zurück
            </button>
          </div>
        )}
      </div>

      <div className="kt-foot">
        🔒 Ihre Angaben werden vertraulich behandelt · <b>KI-Terminassistent</b>
      </div>
    </div>
  );
}

function renderText(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));
}

// ---- inline icons ----
const IconChat = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IconCalendar = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconChevron = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconAlert = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const IconSend = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
  </svg>
);
const IconLeft = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const IconRight = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconUpload = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
);
const IconRestart = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const IconCheck = (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CSS = `
.kt {
  /* Dark mode is the fixed standard look for the widget, so every site shows it identically. */
  --panel: #171a1f; --panel-2: #1f242b; --ink: #eef1f4; --ink-soft: #9aa4af; --ink-faint: #6d7681;
  --line: #282d34; --line-soft: #22272e; --accent: #ff7d33; --accent-deep: #ec6a1e; --accent-soft: #2a1b10;
  --me: #eef1f4; --me-ink: #14171b; --good: #46b57c; --good-soft: #16281f; --red: #ff6b6b;
  --font: "Segoe UI", ui-sans-serif, system-ui, Roboto, "Helvetica Neue", Arial, sans-serif;
  color-scheme: dark;
  font-family: var(--font);
  color: var(--ink);
  background: var(--panel);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kt *, .kt *::before, .kt *::after { box-sizing: border-box; }
.kt button { font-family: var(--font); }

.kt-head { display: flex; align-items: center; gap: 0.7rem; padding: 0.85rem 0.95rem; border-bottom: 1px solid var(--line-soft); }
.kt-avatar { position: relative; width: 42px; height: 42px; flex: none; border-radius: 12px; background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 17px; box-shadow: 0 4px 12px -4px color-mix(in srgb, var(--accent) 60%, transparent); }
.kt-avatar::after { content: ""; position: absolute; right: -2px; bottom: -2px; width: 12px; height: 12px; border-radius: 50%; background: var(--good); border: 2.5px solid var(--panel); }
.kt-who { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.kt-name { font-size: 14.5px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
.kt-status { font-size: 11.5px; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 0.32rem; }
.kt-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--good); }
.kt-close { flex: none; width: 30px; height: 30px; border-radius: 8px; border: none; background: transparent; color: var(--ink-faint); cursor: pointer; display: grid; place-items: center; transition: background 0.15s, color 0.15s; }
.kt-close:hover { background: var(--panel-2); color: var(--ink); }

.kt-progress { height: 3px; background: var(--line-soft); position: relative; overflow: hidden; }
.kt-progress > i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, var(--accent-deep), var(--accent)); transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1); }

.kt-scroll { flex: 1; overflow-y: auto; padding: 1.05rem 0.95rem 0.7rem; display: flex; flex-direction: column; gap: 0.55rem; }
.kt-scroll::-webkit-scrollbar { width: 8px; }
.kt-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; border: 2px solid var(--panel); }

.kt-msg { display: flex; max-width: 100%; margin-bottom: 0.55rem; }
.kt-msg.ai { justify-content: flex-start; }
.kt-msg.me { justify-content: flex-end; }
.kt-bubble { max-width: 84%; padding: 0.6rem 0.78rem; font-size: 14px; line-height: 1.48; border-radius: 14px; white-space: pre-wrap; word-wrap: break-word; animation: kt-pop 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.kt-msg.ai .kt-bubble { background: var(--panel-2); color: var(--ink); border-bottom-left-radius: 5px; }
.kt-msg.me .kt-bubble { background: var(--me); color: var(--me-ink); border-bottom-right-radius: 5px; }
.kt-sub { display: block; margin-top: 2px; font-size: 12px; color: color-mix(in srgb, var(--me-ink) 62%, transparent); }
@keyframes kt-pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .kt-bubble { animation: none; } .kt-progress > i { transition: none; } }

.kt-typing { display: inline-flex; gap: 4px; padding: 0.72rem 0.8rem; }
.kt-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--ink-faint); animation: kt-blink 1.2s infinite ease-in-out; }
.kt-typing span:nth-child(2) { animation-delay: 0.18s; }
.kt-typing span:nth-child(3) { animation-delay: 0.36s; }
@keyframes kt-blink { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }

.kt-dock { border-top: 1px solid var(--line-soft); background: var(--panel); padding: 0.7rem 0.8rem 0.85rem; }
.kt-hint { font-size: 11.5px; color: var(--ink-faint); margin: 0 0 0.5rem; text-align: center; }

.kt-choice { display: flex; flex-direction: column; gap: 0.7rem; }
.kt-card { display: flex; align-items: center; gap: 0.85rem; text-align: left; width: 100%; padding: 1.05rem 1rem; border-radius: 15px; border: 2px solid color-mix(in srgb, var(--accent) 26%, var(--line)); background: color-mix(in srgb, var(--accent) 4%, var(--panel)); cursor: pointer; transition: border-color 0.15s, transform 0.1s, background 0.15s, box-shadow 0.15s; }
.kt-card:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 9%, var(--panel)); transform: translateY(-2px); box-shadow: 0 10px 22px -12px color-mix(in srgb, var(--accent) 55%, transparent); }
.kt-card:active { transform: translateY(0); }
.kt-ic { flex: none; width: 50px; height: 50px; border-radius: 13px; background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; display: grid; place-items: center; box-shadow: 0 5px 14px -5px color-mix(in srgb, var(--accent) 65%, transparent); }
.kt-ct { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.kt-ct b { font-size: 16px; font-weight: 750; letter-spacing: -0.01em; color: var(--ink); }
.kt-ct span { font-size: 12.5px; line-height: 1.45; color: var(--ink-soft); }
.kt-chev { flex: none; color: color-mix(in srgb, var(--accent) 55%, var(--ink-faint)); transition: transform 0.15s, color 0.15s; }
.kt-card:hover .kt-chev { color: var(--accent); transform: translateX(3px); }

.kt-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.kt-chip { font-size: 14px; font-weight: 650; padding: 0.62rem 0.95rem; border-radius: 12px; border: 1.6px solid var(--line); background: var(--panel); color: var(--ink); cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.12s, box-shadow 0.22s; }
.kt-chip:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, var(--panel)); }
.kt-chip:active { transform: translateY(1px); }
.kt-chip.sel { border-color: var(--accent); background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; transform: translateY(-1px); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent), 0 8px 20px -4px color-mix(in srgb, var(--accent) 72%, transparent); }

.kt-notice { font-size: 12px; line-height: 1.4; color: var(--ink); background: color-mix(in srgb, var(--accent) 10%, var(--panel-2)); border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--line)); border-radius: 9px; padding: 0.5rem 0.6rem; }

.kt-cal { display: flex; flex-direction: column; gap: 0.5rem; }
.kt-cal-head { display: flex; align-items: center; justify-content: space-between; }
.kt-cal-title { font-size: 14px; font-weight: 700; color: var(--ink); text-transform: capitalize; }
.kt-cal-nav { display: flex; gap: 0.35rem; }
.kt-cal-nav button { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel); color: var(--ink); cursor: pointer; display: grid; place-items: center; transition: border-color 0.15s, background 0.15s; }
.kt-cal-nav button:hover:not(:disabled) { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--panel)); }
.kt-cal-nav button:disabled { opacity: 0.3; cursor: not-allowed; }
.kt-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.kt-wd { text-align: center; font-size: 10.5px; font-weight: 700; color: var(--ink-faint); padding: 2px 0; }
.kt-day { height: 34px; border: none; background: transparent; color: var(--ink); font-size: 13px; border-radius: 9px; cursor: pointer; display: grid; place-items: center; font-variant-numeric: tabular-nums; transition: background 0.12s, box-shadow 0.15s; }
.kt-day.blank { visibility: hidden; }
.kt-day.off { color: var(--ink-faint); opacity: 0.35; cursor: not-allowed; }
.kt-day.on { background: color-mix(in srgb, var(--accent) 15%, var(--panel)); color: var(--ink); font-weight: 650; }
.kt-day.on:hover { background: color-mix(in srgb, var(--accent) 26%, var(--panel)); }
.kt-day.sel { background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; font-weight: 700; box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 26%, transparent); }

.kt-cal-cap { font-size: 12px; color: var(--ink-soft); margin: 0.15rem 0 0; }
.kt-loading { display: flex; align-items: center; gap: 0.5rem; font-size: 13px; color: var(--ink-soft); padding: 0.7rem 0.2rem; }
.kt-spin { width: 16px; height: 16px; flex: none; border-radius: 50%; border: 2px solid var(--line); border-top-color: var(--accent); animation: kt-spin 0.7s linear infinite; }
@keyframes kt-spin { to { transform: rotate(360deg); } }
.kt-slots { display: flex; flex-wrap: wrap; gap: 0.4rem; max-height: 132px; overflow-y: auto; padding: 0.1rem 0; }
.kt-slot { font-size: 13px; font-weight: 650; padding: 0.42rem 0.62rem; border-radius: 9px; border: 1.5px solid var(--line); background: var(--panel); color: var(--ink); cursor: pointer; font-variant-numeric: tabular-nums; transition: border-color 0.15s, background 0.15s, box-shadow 0.2s; }
.kt-slot:hover:not(:disabled) { border-color: var(--accent); }
.kt-slot.sel { border-color: var(--accent); background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
.kt-slot.taken { border-color: color-mix(in srgb, var(--red) 45%, var(--line)); background: color-mix(in srgb, var(--red) 15%, var(--panel)); color: var(--red); cursor: not-allowed; text-decoration: line-through; }
.kt-slot.off { opacity: 0.35; color: var(--ink-faint); cursor: not-allowed; text-decoration: line-through; }

.kt-field { display: flex; flex-direction: column; gap: 0.4rem; }
.kt-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.kt-lab { font-size: 12px; font-weight: 600; color: var(--ink-soft); }
.kt-inp { width: 100%; font-family: var(--font); font-size: 14px; color: var(--ink); background: var(--panel-2); border: 1.5px solid var(--line); border-radius: 11px; padding: 0.62rem 0.72rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.kt-ta { resize: vertical; min-height: 78px; line-height: 1.5; }
.kt-inp::placeholder { color: var(--ink-faint); }
.kt-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent); }
.kt-inp.err { border-color: #d9482f; box-shadow: 0 0 0 3px rgba(217, 72, 47, 0.15); }
.kt-err { font-size: 11.5px; color: #d9482f; }
.kt-area { position: relative; }
.kt-unit { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--ink-faint); pointer-events: none; }

.kt-drop { border: 1.6px dashed var(--line); border-radius: 12px; padding: 1rem 0.8rem; text-align: center; cursor: pointer; color: var(--ink-soft); background: var(--panel-2); transition: border-color 0.15s, background 0.15s; display: block; }
.kt-drop:hover { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 5%, var(--panel-2)); }
.kt-drop b { display: block; color: var(--ink); font-size: 13.5px; margin-top: 0.3rem; }
.kt-drop span { display: block; font-size: 11.5px; margin-top: 2px; }
.kt-thumbs { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.15rem; }
.kt-thumb { position: relative; width: 54px; height: 54px; border-radius: 9px; overflow: hidden; border: 1px solid var(--line); }
.kt-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.kt-x { position: absolute; top: 2px; right: 2px; width: 17px; height: 17px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; font-size: 11px; line-height: 1; cursor: pointer; display: grid; place-items: center; }

.kt-actions { display: flex; gap: 0.5rem; margin-top: 0.7rem; align-items: center; }
.kt-btn { font-size: 14px; font-weight: 700; border-radius: 11px; border: 1.5px solid transparent; padding: 0.66rem 0.9rem; cursor: pointer; transition: background 0.15s, opacity 0.15s, transform 0.08s, border-color 0.15s, box-shadow 0.2s, filter 0.15s; }
.kt-btn:active { transform: translateY(1px); }
.kt-primary { background: linear-gradient(150deg, var(--accent), var(--accent-deep)); color: #fff; flex: 1; }
.kt-primary:hover { filter: brightness(1.05); }
.kt-primary:active { filter: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 28%, transparent), 0 8px 22px -4px color-mix(in srgb, var(--accent) 80%, transparent); }
.kt-primary:disabled { opacity: 0.5; cursor: not-allowed; filter: none; box-shadow: none; }
.kt-ghost { background: transparent; color: var(--ink-soft); border-color: var(--line); }
.kt-ghost:hover { color: var(--ink); border-color: var(--ink-soft); }
.kt-link { background: none; border: none; color: var(--ink-soft); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0.3rem; }
.kt-link:hover { color: var(--accent); }
.kt-back { display: flex; justify-content: center; margin-top: 0.5rem; }

.kt-review { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.kt-r { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--line-soft); }
.kt-r:last-child { border-bottom: none; }
.kt-k { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-faint); flex: none; padding-top: 2px; min-width: 92px; }
.kt-v { font-size: 13.5px; color: var(--ink); text-align: right; flex: 1; word-break: break-word; }
.kt-edit { background: none; border: none; color: var(--accent); font-size: 11.5px; font-weight: 600; cursor: pointer; flex: none; padding: 2px 0 0; }
.kt-edit:disabled { opacity: 0.5; cursor: not-allowed; }

.kt-success { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1.4rem; gap: 0.7rem; }
.kt-check { width: 66px; height: 66px; border-radius: 50%; background: var(--good-soft); color: var(--good); display: grid; place-items: center; animation: kt-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.kt-success h2 { margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.01em; }
.kt-success p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--ink-soft); max-width: 30ch; }
.kt-ref { font-size: 12px; color: var(--ink-soft); background: var(--panel-2); border: 1px solid var(--line); padding: 0.4rem 0.7rem; border-radius: 9px; font-variant-numeric: tabular-nums; }
.kt-ref b { color: var(--ink); letter-spacing: 0.04em; }

/* ---- FAQ ask box (sits above the two paths) ---- */
.kt-ask { display: flex; gap: 0.4rem; align-items: center; }
.kt-ask-in { flex: 1; min-width: 0; background: var(--panel-2); border: 1px solid var(--line); color: var(--ink); border-radius: 11px; padding: 0.62rem 0.75rem; font: inherit; font-size: 13px; outline: none; transition: border-color 0.15s; }
.kt-ask-in::placeholder { color: var(--ink-faint); }
.kt-ask-in:focus { border-color: var(--accent); }
.kt-ask-in:disabled { opacity: 0.6; }
.kt-ask-go { flex: none; display: grid; place-items: center; width: 38px; height: 38px; border: none; border-radius: 11px; background: var(--accent); color: #fff; cursor: pointer; transition: filter 0.15s, opacity 0.15s; }
.kt-ask-go:hover:not(:disabled) { filter: brightness(1.1); }
.kt-ask-go:disabled { opacity: 0.4; cursor: not-allowed; }
.kt-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: kt-rot 0.6s linear infinite; }
@keyframes kt-rot { to { transform: rotate(360deg); } }

.kt-or { display: flex; align-items: center; gap: 0.6rem; margin: 0.15rem 0; }
.kt-or::before, .kt-or::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.kt-or span { font-size: 11px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }

.kt-inline-cta { display: block; margin-top: 0.5rem; background: none; border: none; padding: 0; color: var(--accent); font: inherit; font-size: 12.5px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }

/* ---- Emergency path ---- */
.kt-sos { border-color: color-mix(in srgb, var(--bad) 45%, transparent); }
.kt-sos .kt-ic { color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, transparent); }
.kt-sos:hover { border-color: var(--bad); }

/* ---- Postcode / service area ---- */
.kt-row-plz { display: grid; grid-template-columns: 5.5rem 1fr; gap: 0.5rem; }
.kt-hint { font-size: 12px; color: var(--ink-soft); }
.kt-ok { font-size: 12.5px; font-weight: 600; color: var(--good); }
.kt-warn { font-size: 12.5px; line-height: 1.5; color: var(--ink-soft); background: var(--panel-2); border: 1px solid var(--line); border-left: 2px solid var(--accent); padding: 0.5rem 0.65rem; border-radius: 8px; }

/* ---- GDPR consent ---- */
.kt-consent { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 11.5px; line-height: 1.5; color: var(--ink-soft); }
.kt-consent input { margin-top: 0.15rem; flex: none; accent-color: var(--accent); width: 15px; height: 15px; }
.kt-manage { font-size: 12.5px; font-weight: 600; color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.kt-manage:hover { filter: brightness(1.15); }
.kt-links { display: flex; flex-direction: column; gap: 0.45rem; align-items: center; }

.kt-foot { text-align: center; font-size: 10.5px; color: var(--ink-faint); padding: 0.5rem 0.8rem; border-top: 1px solid var(--line-soft); }
.kt-foot b { color: var(--ink-soft); font-weight: 600; }
`;
