"use client";

const ERROR_MESSAGES: Record<string, string> = {
  service_in_use: "Diese Dienstleistung kann nicht gelöscht werden, da bereits Termine damit verknüpft sind.",
  invalid_input: "Eingabe ungültig. Bitte prüfe deine Angaben.",
};

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = ERROR_MESSAGES[error.message] ?? "Etwas ist schiefgelaufen. Bitte versuche es erneut.";

  return (
    <div className="p-6">
      <p className="text-sm text-red-600">{message}</p>
      <button
        onClick={() => reset()}
        className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
