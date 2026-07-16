import { notFound } from "next/navigation";
import { addDays, differenceInMinutes } from "date-fns";
import { getRequestByToken, manageState } from "@/lib/requests/manage";
import { getWidgetAvailability } from "@/lib/availability/widget";
import { ManageBooking } from "@/components/booking/ManageBooking";

export const dynamic = "force-dynamic";

const RANGE_DAYS = 28;
const FALLBACK_MINUTES = 60;

export async function generateMetadata() {
  // Keep manage links out of search engines — they are personal.
  return { title: "Ihr Termin", robots: { index: false, follow: false } };
}

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getRequestByToken(token);

  if (!request) {
    notFound();
  }

  const state = manageState(request);

  // Keep the new appointment the same length as the one the customer booked.
  const durationMinutes =
    request.slotStart && request.slotEnd
      ? Math.max(15, differenceInMinutes(request.slotEnd, request.slotStart))
      : (request.service?.durationMinutes ?? FALLBACK_MINUTES);

  const availability = state.editable
    ? await getWidgetAvailability({
        tenantId: request.tenantId,
        durationMinutes,
        fromDate: new Date(),
        toDate: addDays(new Date(), RANGE_DAYS),
        excludeRequestId: request.id,
      })
    : null;

  return (
    <ManageBooking
      token={token}
      tenantName={request.tenant.name}
      customerName={request.customer.name}
      reference={request.reference}
      serviceLabel={request.serviceLabel ?? request.service?.name ?? null}
      address={request.address}
      slotStart={request.slotStart?.toISOString() ?? null}
      slotEnd={request.slotEnd?.toISOString() ?? null}
      editable={state.editable}
      lockedReason={state.reason ?? null}
      timezone={availability?.timezone ?? "Europe/Berlin"}
      days={availability?.days ?? []}
    />
  );
}
