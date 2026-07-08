import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";

export function bookingConfirmationEmail(params: {
  tenantName: string;
  customerName: string;
  serviceName: string;
  startTime: Date;
  timezone: string;
}) {
  const { tenantName, customerName, serviceName, startTime, timezone } = params;
  const formatted = formatInTimeZone(startTime, timezone, "EEEE, d. MMMM yyyy, HH:mm 'Uhr'", { locale: de });

  const subject = `Terminbestätigung – ${serviceName} bei ${tenantName}`;
  const text = `Hallo ${customerName},\n\ndeine Terminanfrage bei ${tenantName} wurde bestätigt:\n\n${serviceName}\n${formatted}\n\nBei Fragen antworte einfach auf diese E-Mail.\n\nViele Grüße\n${tenantName}`;
  const html = `<p>Hallo ${customerName},</p><p>deine Terminanfrage bei <strong>${tenantName}</strong> wurde bestätigt:</p><p><strong>${serviceName}</strong><br/>${formatted}</p><p>Bei Fragen antworte einfach auf diese E-Mail.</p><p>Viele Grüße<br/>${tenantName}</p>`;

  return { subject, text, html };
}
