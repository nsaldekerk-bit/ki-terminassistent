import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

/** Sent to the customer after they rescheduled or cancelled themselves. */
export function requestChangeConfirmationEmail(params: {
  kind: "rescheduled" | "cancelled";
  tenantName: string;
  customerName: string;
  reference: string;
  serviceLabel?: string | null;
  newStart: Date | null;
  newTime: string | null;
  timezone: string;
  manageUrl: string | null;
}) {
  const { kind, tenantName, customerName, reference, serviceLabel, newStart, newTime, timezone, manageUrl } =
    params;

  const dateStr = newStart
    ? formatInTimeZone(newStart, timezone, "EEEE, d. MMMM yyyy", { locale: de })
    : null;
  const timing = [dateStr, newTime].filter(Boolean).join(", ");

  const lines: string[] = [];
  if (serviceLabel) lines.push(`Leistung: ${serviceLabel}`);
  if (kind === "rescheduled" && timing) lines.push(`Neuer Termin: ${timing}`);
  lines.push(`Vorgangsnummer: ${reference}`);

  const subject =
    kind === "rescheduled"
      ? `Ihr Termin bei ${tenantName} wurde verschoben${timing ? ` – ${timing}` : ""} (${reference})`
      : `Ihr Termin bei ${tenantName} wurde abgesagt (${reference})`;

  const intro =
    kind === "rescheduled"
      ? `Ihr Termin wurde erfolgreich verschoben. Wir haben den neuen Termin vorgemerkt.`
      : `Ihr Termin wurde abgesagt. Falls Sie einen neuen Termin brauchen, melden Sie sich jederzeit gern wieder.`;

  const manageLine =
    kind === "rescheduled" && manageUrl
      ? `Sie können Ihren Termin jederzeit erneut verschieben oder absagen:\n${manageUrl}`
      : null;

  const text =
    `Hallo ${customerName},\n\n${intro}\n\n` +
    `Ihre Angaben:\n${lines.join("\n")}\n\n` +
    (manageLine ? `${manageLine}\n\n` : "") +
    `Bei Fragen antworten Sie einfach auf diese E-Mail.\n\nViele Grüße\n${tenantName}`;

  const html =
    `<p>Hallo ${customerName},</p>` +
    `<p>${intro}</p>` +
    `<p><strong>Ihre Angaben:</strong></p><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` +
    (kind === "rescheduled" && manageUrl
      ? `<p><a href="${manageUrl}">Termin erneut verschieben oder absagen</a></p>`
      : "") +
    `<p>Bei Fragen antworten Sie einfach auf diese E-Mail.</p><p>Viele Grüße<br/>${tenantName}</p>`;

  return { subject, text, html };
}
