import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { getI18n } from "@/lib/i18n/server";
import { DATE_FNS_LOCALES } from "@/lib/i18n/date";
import { ReplyBox } from "@/components/admin/ReplyBox";
import { manageUrlFor } from "@/lib/requests/token";
import { updateRequestStatus } from "../actions";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await requireTenantId();
  const { locale, t } = await getI18n();
  const d = t.admin.requestDetail;
  const dfl = DATE_FNS_LOCALES[locale];
  const dt = (date: Date) => formatInTimeZone(date, "UTC", "d MMM yyyy, HH:mm", { locale: dfl });

  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });

  const request = await prisma.bookingRequest.findFirst({
    where: { id, tenantId },
    include: { customer: true, service: true, photos: true, tenant: true },
  });

  if (!request) {
    notFound();
  }

  const firstName = request.customer.name.split(" ")[0] || request.customer.name;
  // The draft is a starting point the owner edits before sending; kept in German
  // as most customers of a German Handwerksbetrieb are German-speaking.
  const replySubject = `Ihre Anfrage bei ${request.tenant.name} (${request.reference})`;
  const replyDefaultBody = `Hallo ${firstName},\n\nvielen Dank für Ihre Anfrage (${request.reference}).\n\n\n\nViele Grüße\n${request.tenant.name}`;

  const typeLabels: Record<string, string> = {
    consultation: d.typeConsultation,
    booking: d.typeBooking,
  };
  const statusLabels: Record<string, string> = {
    new: t.admin.requests.statusNew,
    contacted: t.admin.requests.statusContacted,
    scheduled: t.admin.requests.statusScheduled,
    closed: t.admin.requests.statusClosed,
    cancelled: t.admin.requests.statusCancelled,
  };

  const preferred = request.preferredDate
    ? formatInTimeZone(request.preferredDate, location.timezone, "EEEE, d MMMM yyyy", { locale: dfl })
    : null;
  const timing = [preferred, request.preferredTime].filter(Boolean).join(", ") || "—";

  const rows: [string, string][] = [
    [d.rowType, request.isEmergency ? d.emergency : typeLabels[request.type] ?? request.type],
    [d.rowService, request.serviceLabel ?? request.service?.name ?? "—"],
    [d.rowArea, request.areaText ?? "—"],
    [d.rowLocation, request.address ?? "—"],
    [request.type === "booking" ? d.rowPreferred : d.rowReachable, timing],
    [d.rowCustomer, request.customer.name],
    [d.rowContact, [request.customer.phone, request.customer.email].filter(Boolean).join(" · ") || "—"],
    [d.rowReference, request.reference],
    [d.rowReceived, dt(request.createdAt)],
  ];

  if (request.consentAt) {
    rows.push([d.rowConsent, d.consentGiven(dt(request.consentAt))]);
  }
  if (request.reminderSentAt) {
    rows.push([d.rowReminder, d.reminderSent(dt(request.reminderSentAt))]);
  }
  if (request.rescheduledAt) {
    rows.push([d.rowRescheduled, dt(request.rescheduledAt)]);
  }
  if (request.cancelledAt) {
    rows.push([d.rowCancelled, dt(request.cancelledAt)]);
  }

  // The customer's personal link — handy to resend if they lost the email.
  const manageUrl = request.manageToken ? manageUrlFor(request.manageToken) : null;

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">
          {d.titlePrefix} {request.reference}
        </h1>
        <Link href="/admin/requests" className="text-sm text-gray-500 hover:underline">
          {d.allRequests}
        </Link>
      </div>

      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 px-4 py-2.5 text-sm">
            <dt className="w-36 flex-none text-gray-500">{k}</dt>
            <dd className="flex-1 text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>

      {manageUrl && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-gray-700">{d.manageTitle}</h2>
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs break-all text-gray-600">
            <a href={manageUrl} target="_blank" rel="noreferrer" className="hover:underline">
              {manageUrl}
            </a>
          </p>
          <p className="text-xs text-gray-400">{d.manageHint}</p>
        </div>
      )}

      {request.situation && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-gray-700">{d.situation}</h2>
          <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            {request.situation}
          </p>
        </div>
      )}

      {request.photos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">{d.photosTitle(request.photos.length)}</h2>
          <div className="flex flex-wrap gap-2">
            {request.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer">
                <img
                  src={p.dataUrl}
                  alt={d.photoAlt}
                  className="h-28 w-28 rounded-lg border border-gray-200 object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <form action={updateRequestStatus} className="flex items-center gap-2 border-t border-gray-100 pt-4">
        <input type="hidden" name="id" value={request.id} />
        <label className="text-sm text-gray-600">{t.admin.status}</label>
        <select
          key={request.status}
          name="status"
          defaultValue={request.status}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="text-sm text-gray-700 hover:underline">
          {t.admin.save}
        </button>
      </form>

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <h2 className="text-sm font-medium text-gray-700">{d.replyTitle}</h2>
        <ReplyBox
          locale={locale}
          requestId={request.id}
          customerEmail={request.customer.email}
          subject={replySubject}
          defaultBody={replyDefaultBody}
        />
      </div>
    </div>
  );
}
