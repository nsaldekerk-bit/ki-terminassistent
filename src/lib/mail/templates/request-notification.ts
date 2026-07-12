import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

export function requestNotificationEmail(params: {
  type: "consultation" | "booking";
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceLabel?: string | null;
  areaText?: string | null;
  situation?: string | null;
  address?: string | null;
  preferredDate?: Date | null;
  preferredTime?: string | null;
  photoCount: number;
  timezone: string;
}) {
  const {
    type,
    reference,
    customerName,
    customerPhone,
    customerEmail,
    serviceLabel,
    areaText,
    situation,
    address,
    preferredDate,
    preferredTime,
    photoCount,
    timezone,
  } = params;

  const kind = type === "booking" ? "Terminanfrage" : "Beratungsanfrage";
  const dateStr = preferredDate
    ? formatInTimeZone(preferredDate, timezone, "EEEE, d. MMMM yyyy", { locale: de })
    : null;
  const timing = [dateStr, preferredTime].filter(Boolean).join(", ");

  const rows: [string, string | null | undefined][] = [
    ["Leistung", serviceLabel],
    ["Fläche", areaText],
    ["Ort", address],
    [type === "booking" ? "Wunschtermin" : "Erreichbar", timing || null],
    ["Situation", situation],
    ["Fotos", photoCount ? `${photoCount} angehängt (im Dashboard sichtbar)` : null],
    ["Kunde", customerName],
    ["Kontakt", `${customerPhone} · ${customerEmail}`],
    ["Vorgangsnummer", reference],
  ];
  const visible = rows.filter(([, v]) => v);

  const subject = `Neue ${kind}${serviceLabel ? `: ${serviceLabel}` : ""} – ${customerName}`;
  const text =
    `Neue ${kind} über den Terminassistenten:\n\n` +
    visible.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html =
    `<p>Neue <strong>${kind}</strong> über den Terminassistenten:</p><ul>` +
    visible.map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join("") +
    `</ul>`;

  return { subject, text, html };
}
