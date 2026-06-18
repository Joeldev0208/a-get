import { ServiceError } from "@/lib/services/supabase-service";

interface ErrorBoxProps {
  error: Error | ServiceError | null;
  onRetry?: () => void;
}

export default function ErrorBox({ error, onRetry }: ErrorBoxProps) {
  if (!error) return null;

  const message =
    error instanceof ServiceError
      ? error.message
      : error.message || "Ha ocurrido un error inesperado.";

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-red-500">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">
            Error
          </h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}