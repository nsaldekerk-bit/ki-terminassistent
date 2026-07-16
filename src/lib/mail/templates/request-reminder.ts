import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

/** Sent to the customer roughly 24h before their appointment. */
export function requestReminderEmail(params: {
  tenantName: string;
  customerName: string;
  reference: string;
  serviceLabel?: string | null;
  slotStart: Date;
  slotEnd: Date;
  address?: string | null;
  timezone: string;
  manageUrl: string | null;
}) {
  const { tenantName, customerName, reference, serviceLabel, slotStart, slotEnd, address, timezone, manageUrl } =
    params;

  const dateStr = formatInTimeZone(slotStart, timezone, "EEEE, d. MMMM yyyy", { locale: de });
  const from = formatInTimeZone(slotStart, timezone, "HH:mm");
  const to = formatInTimeZone(slotEnd, timezone, "HH:mm");
  const timing = `${dateStr}, ${from}–${to} Uhr`;

  const lines: string[] = [];
  if (serviceLabel) lines.push(`Leistung: ${serviceLabel}`);
  lines.push(`Termin: ${timing}`);
  if (address) lines.push(`Ort: ${address}`);
  lines.push(`Vorgangsnummer: ${reference}`);

  const subject = `Erinnerung: Ihr Termin bei ${tenantName} morgen um ${from} Uhr`;

  const text =
    `Hallo ${customerName},\n\n` +
    `nur eine kurze Erinnerung an Ihren Termin morgen.\n\n` +
    `${lines.join("\n")}\n\n` +
    (manageUrl ? `Passt es doch nicht? Hier können Sie verschieben oder absagen:\n${manageUrl}\n\n` : "") +
    `Bis morgen!\n${tenantName}`;

  const html =
    `<p>Hallo ${customerName},</p>` +
    `<p>nur eine kurze Erinnerung an Ihren Termin <strong>morgen</strong>.</p>` +
    `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` +
    (manageUrl
      ? `<p>Passt es doch nicht? <a href="${manageUrl}">Termin verschieben oder absagen</a></p>`
      : "") +
    `<p>Bis morgen!<br/>${tenantName}</p>`;

  return { subject, text, html };
}
