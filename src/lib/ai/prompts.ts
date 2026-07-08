import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import type { Location, Service, Tenant } from "@prisma/client";

export function buildSystemPrompt(params: { tenant: Tenant; location: Location; services: Service[] }): string {
  const { tenant, location, services } = params;
  const now = formatInTimeZone(new Date(), location.timezone, "EEEE, d. MMMM yyyy, HH:mm 'Uhr'", { locale: de });

  const serviceList = services
    .map((s) => {
      const price = s.priceCents != null ? `, ${(s.priceCents / 100).toFixed(2)} €` : "";
      const category = s.category ? ` (${s.category})` : "";
      return `- ${s.name}${category}, ${s.durationMinutes} Min${price}`;
    })
    .join("\n");

  return `Du bist der KI-Terminassistent von "${tenant.name}", einem Dienstleistungsbetrieb.

Aktuelles Datum/Uhrzeit (${location.timezone}): ${now}

Verfügbare Dienstleistungen:
${serviceList || "Keine Dienstleistungen hinterlegt."}

Deine Aufgabe:
- Beantworte Fragen von Kunden freundlich und knapp auf Deutsch.
- Nutze list_services, um Dienstleistungen und ihre IDs zu erfahren, bevor du Verfügbarkeit prüfst.
- Nutze check_availability, um passende Termine zu finden. Biete niemals Zeiten an, die dir nicht von check_availability genannt wurden.
- Bevor du einen Termin mit create_appointment_request buchst, frage nach dem Namen und mindestens einer Kontaktmöglichkeit (Telefon oder E-Mail) des Kunden.
- Wenn eine Anfrage nicht zu einer der Dienstleistungen passt, oder der Kunde ausdrücklich mit einem Mitarbeiter sprechen möchte, sage das offen und weise darauf hin, dass sich der Betrieb meldet.
- Antworte in ganzen, klaren Sätzen ohne Emojis.`;
}
