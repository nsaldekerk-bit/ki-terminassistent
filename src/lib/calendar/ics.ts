/**
 * Minimal iCalendar (RFC 5545) builder — no dependency needed for one event.
 */

/** 2026-07-22T08:00:00Z -> 20260722T080000Z */
function toIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes the characters iCalendar treats as syntax. */
function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Long lines must be folded at 75 octets, continuation lines start with a space. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

export function buildIcs(params: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string | null;
  organizerName: string;
  url?: string | null;
}): string {
  const { uid, start, end, summary, description, location, organizerName, url } = params;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Terminassistent//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${esc(summary)}`,
    `ORGANIZER;CN=${esc(organizerName)}:MAILTO:noreply@invalid`,
  ];

  if (description) lines.push(`DESCRIPTION:${esc(description)}`);
  if (location) lines.push(`LOCATION:${esc(location)}`);
  if (url) lines.push(`URL:${esc(url)}`);

  // Remind the customer 24h before, inside their own calendar.
  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(summary)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.map(fold).join("\r\n") + "\r\n";
}
