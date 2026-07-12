import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

export function requestConfirmationEmail(params: {
  tenantName: string;
  customerName: string;
  type: "consultation" | "booking";
  reference: string;
  serviceLabel?: string | null;
  preferredDate?: Date | null;
  preferredTime?: string | null;
  hasSlot: boolean;
  timezone: string;
}) {
  const { tenantName, customerName, type, reference, serviceLabel, preferredDate, preferredTime, hasSlot, timezone } =
    params;

  const dateStr = preferredDate
    ? formatInTimeZone(preferredDate, timezone, "EEEE, d. MMMM yyyy", { locale: de })
    : null;
  const timing = [dateStr, preferredTime].filter(Boolean).join(", ");
  const kind = type === "booking" ? "Terminanfrage" : "Anfrage";
  const slotWord = type === "booking" ? "Ihr Termin" : "Ihr Beratungstermin";

  const lines: string[] = [];
  if (serviceLabel) lines.push(`Leistung: ${serviceLabel}`);
  if (timing) lines.push(`${hasSlot ? "Termin" : type === "booking" ? "Wunschtermin" : "Erreichbarkeit"}: ${timing}`);
  lines.push(`Vorgangsnummer: ${reference}`);

  const intro = hasSlot
    ? `vielen Dank für Ihre Buchung. Wir haben ${slotWord} vorgemerkt und bestätigen ihn in Kürze verbindlich.`
    : `vielen Dank für Ihre ${kind}. Wir haben sie erhalten und melden uns zeitnah bei Ihnen – in der Regel innerhalb von 24 Stunden.`;

  const subject = hasSlot
    ? `Terminanfrage bei ${tenantName} eingegangen${timing ? ` – ${timing}` : ""} (${reference})`
    : `Ihre ${kind} bei ${tenantName} ist eingegangen (${reference})`;

  const text =
    `Hallo ${customerName},\n\n${intro}\n\n` +
    `Ihre Angaben:\n${lines.join("\n")}\n\n` +
    `Bei Fragen antworten Sie einfach auf diese E-Mail.\n\nViele Grüße\n${tenantName}`;
  const html =
    `<p>Hallo ${customerName},</p>` +
    `<p>${intro}</p>` +
    `<p><strong>Ihre Angaben:</strong></p><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` +
    `<p>Bei Fragen antworten Sie einfach auf diese E-Mail.</p><p>Viele Grüße<br/>${tenantName}</p>`;

  return { subject, text, html };
}
