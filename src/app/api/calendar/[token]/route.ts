import type { NextRequest } from "next/server";
import { getRequestByToken } from "@/lib/requests/manage";
import { manageUrlFor } from "@/lib/requests/token";
import { buildIcs } from "@/lib/calendar/ics";

export const maxDuration = 15;

/**
 * Serves the customer's appointment as a calendar file, so one tap adds it to
 * their phone. Reached from the confirmation screen and the confirmation email.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/calendar/[token]">) {
  const { token } = await ctx.params;

  const request = await getRequestByToken(token);
  if (!request || !request.slotStart || !request.slotEnd || request.status === "cancelled") {
    return new Response("Not found", { status: 404 });
  }

  const service = request.serviceLabel ?? request.service?.name ?? "Termin";
  const ics = buildIcs({
    uid: `${request.id}@terminassistent`,
    start: request.slotStart,
    end: request.slotEnd,
    summary: `${service} — ${request.tenant.name}`,
    description: [
      `Ihr Termin bei ${request.tenant.name}.`,
      `Vorgangsnummer: ${request.reference}`,
      request.manageToken ? `Verschieben oder absagen: ${manageUrlFor(request.manageToken)}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    location: request.address,
    organizerName: request.tenant.name,
    url: request.manageToken ? manageUrlFor(request.manageToken) : null,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="termin-${request.reference}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
