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
  /** Personal link to reschedule or cancel. Only meaningful with a real slot. */
  manageUrl?: string | null;
}) {
  const { tenantName, customerName, type, reference, serviceLabel, preferredDate, preferredTime, hasSlot, timezone, manageUrl } =
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

  // Only a booking with a concrete slot can be moved, so only offer the link there.
  const showManage = hasSlot && Boolean(manageUrl);

  const text =
    `Hallo ${customerName},\n\n${intro}\n\n` +
    `Ihre Angaben:\n${lines.join("\n")}\n\n` +
    (showManage
      ? `Sie können Ihren Termin jederzeit selbst verschieben oder absagen:\n${manageUrl}\n\n`
      : "") +
    `Bei Fragen antworten Sie einfach auf diese E-Mail.\n\nViele Grüße\n${tenantName}`;
  const html =
    `<p>Hallo ${customerName},</p>` +
    `<p>${intro}</p>` +
    `<p><strong>Ihre Angaben:</strong></p><ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>` +
    (showManage ? `<p><a href="${manageUrl}">Termin verschieben oder absagen</a></p>` : "") +
    `<p>Bei Fragen antworten Sie einfach auf diese E-Mail.</p><p>Viele Grüße<br/>${tenantName}</p>`;

  return { subject, text, html };
}
