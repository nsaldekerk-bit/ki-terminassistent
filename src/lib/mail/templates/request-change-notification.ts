import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

/** Sent to the business when a customer reschedules or cancels themselves. */
export function requestChangeNotificationEmail(params: {
  kind: "rescheduled" | "cancelled";
  reference: string;
  customerName: string;
  customerEmail?: string | null;
  serviceLabel?: string | null;
  previousStart: Date | null;
  newStart: Date | null;
  newTime: string | null;
  timezone: string;
}) {
  const { kind, reference, customerName, customerEmail, serviceLabel, previousStart, newStart, newTime, timezone } =
    params;

  const fmt = (d: Date) => formatInTimeZone(d, timezone, "EEEE, d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de });

  const lines: string[] = [`Kunde: ${customerName}`];
  if (customerEmail) lines.push(`E-Mail: ${customerEmail}`);
  if (serviceLabel) lines.push(`Leistung: ${serviceLabel}`);
  if (previousStart) lines.push(`Bisher: ${fmt(previousStart)}`);
  if (kind === "rescheduled" && newStart) {
    lines.push(`Neu: ${fmt(newStart)}${newTime ? ` (${newTime})` : ""}`);
  }
  lines.push(`Vorgangsnummer: ${reference}`);

  const subject =
    kind === "rescheduled"
      ? `Kunde hat Termin verschoben: ${customerName} (${reference})`
      : `Kunde hat Termin abgesagt: ${customerName} (${reference})`;

  const intro =
    kind === "rescheduled"
      ? `${customerName} hat den Termin selbst über den Terminlink verschoben. Der neue Termin steht in Ihrem Dashboard.`
      : `${customerName} hat den Termin selbst über den Terminlink abgesagt. Die Zeit ist wieder frei und kann neu vergeben werden.`;

  const text = `${intro}\n\n${lines.join("\n")}\n`;
  const html =
    `<p>${intro}</p><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;

  return { subject, text, html };
}
