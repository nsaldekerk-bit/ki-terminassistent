import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { requireTenantId } from "@/lib/auth-helpers";
import { ReplyBox } from "@/components/admin/ReplyBox";
import { manageUrlFor } from "@/lib/requests/token";
import { updateRequestStatus } from "../actions";

const TYPE_LABELS: Record<string, string> = {
  consultation: "Beratung / Rückruf",
  booking: "Termin buchen",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  scheduled: "Terminiert",
  closed: "Abgeschlossen",
  cancelled: "Vom Kunden abgesagt",
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await requireTenantId();
  const location = await prisma.location.findFirstOrThrow({ where: { tenantId } });

  const request = await prisma.bookingRequest.findFirst({
    where: { id, tenantId },
    include: { customer: true, service: true, photos: true, tenant: true },
  });

  if (!request) {
    notFound();
  }

  const firstName = request.customer.name.split(" ")[0] || request.customer.name;
  const replySubject = `Ihre Anfrage bei ${request.tenant.name} (${request.reference})`;
  const replyDefaultBody = `Hallo ${firstName},\n\nvielen Dank für Ihre Anfrage (${request.reference}).\n\n\n\nViele Grüße\n${request.tenant.name}`;

  const preferred = request.preferredDate
    ? formatInTimeZone(request.preferredDate, location.timezone, "EEEE, d. MMMM yyyy", { locale: de })
    : null;
  const timing = [preferred, request.preferredTime].filter(Boolean).join(", ") || "—";

  const rows: [string, string][] = [
    ["Art", TYPE_LABELS[request.type] ?? request.type],
    ["Leistung", request.serviceLabel ?? request.service?.name ?? "—"],
    ["Fläche", request.areaText ?? "—"],
    ["Ort", request.address ?? "—"],
    [request.type === "booking" ? "Wunschtermin" : "Erreichbar", timing],
    ["Kunde", request.customer.name],
    ["Kontakt", [request.customer.phone, request.customer.email].filter(Boolean).join(" · ") || "—"],
    ["Vorgangsnummer", request.reference],
    ["Eingegangen", formatInTimeZone(request.createdAt, location.timezone, "d. MMM yyyy, HH:mm 'Uhr'", { locale: de })],
  ];

  if (request.rescheduledAt) {
    rows.push([
      "Verschoben am",
      formatInTimeZone(request.rescheduledAt, location.timezone, "d. MMM yyyy, HH:mm 'Uhr'", { locale: de }),
    ]);
  }
  if (request.cancelledAt) {
    rows.push([
      "Abgesagt am",
      formatInTimeZone(request.cancelledAt, location.timezone, "d. MMM yyyy, HH:mm 'Uhr'", { locale: de }),
    ]);
  }

  // The customer's personal link — handy to resend if they lost the email.
  const manageUrl = request.manageToken ? manageUrlFor(request.manageToken) : null;

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Anfrage {request.reference}</h1>
        <Link href="/admin/requests" className="text-sm text-gray-500 hover:underline">
          ← Alle Anfragen
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
          <h2 className="text-sm font-medium text-gray-700">Terminlink des Kunden</h2>
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs break-all text-gray-600">
            <a href={manageUrl} target="_blank" rel="noreferrer" className="hover:underline">
              {manageUrl}
            </a>
          </p>
          <p className="text-xs text-gray-400">
            Damit verschiebt oder storniert der Kunde selbst. Nur weitergeben, wenn er die Bestätigung verloren
            hat.
          </p>
        </div>
      )}

      {request.situation && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-gray-700">Situation</h2>
          <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            {request.situation}
          </p>
        </div>
      )}

      {request.photos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Fotos ({request.photos.length})</h2>
          <div className="flex flex-wrap gap-2">
            {request.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer">
                <img
                  src={p.dataUrl}
                  alt="Kundenfoto"
                  className="h-28 w-28 rounded-lg border border-gray-200 object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <form action={updateRequestStatus} className="flex items-center gap-2 border-t border-gray-100 pt-4">
        <input type="hidden" name="id" value={request.id} />
        <label className="text-sm text-gray-600">Status</label>
        <select
          key={request.status}
          name="status"
          defaultValue={request.status}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="text-sm text-gray-700 hover:underline">
          Speichern
        </button>
      </form>

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <h2 className="text-sm font-medium text-gray-700">Antwort an den Kunden</h2>
        <ReplyBox
          requestId={request.id}
          customerEmail={request.customer.email}
          subject={replySubject}
          defaultBody={replyDefaultBody}
        />
      </div>
    </div>
  );
}
