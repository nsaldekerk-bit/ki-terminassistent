import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

export function ownerNotificationEmail(params: {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName: string;
  startTime: Date;
  timezone: string;
}) {
  const { customerName, customerPhone, customerEmail, serviceName, startTime, timezone } = params;
  const formatted = formatInTimeZone(startTime, timezone, "EEEE, d. MMMM yyyy, HH:mm 'Uhr'", { locale: de });
  const contact = [customerPhone, customerEmail].filter(Boolean).join(", ") || "keine Kontaktdaten hinterlegt";

  const subject = `Neue Buchung: ${serviceName} – ${formatted}`;
  const text = `Neue Terminbuchung über den Chat-Assistenten:\n\nDienstleistung: ${serviceName}\nZeitpunkt: ${formatted}\nKunde: ${customerName}\nKontakt: ${contact}`;
  const html = `<p>Neue Terminbuchung über den Chat-Assistenten:</p><ul><li><strong>Dienstleistung:</strong> ${serviceName}</li><li><strong>Zeitpunkt:</strong> ${formatted}</li><li><strong>Kunde:</strong> ${customerName}</li><li><strong>Kontakt:</strong> ${contact}</li></ul>`;

  return { subject, text, html };
}
