import { AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface BackendErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry: () => void;
  compact?: boolean;
}

function describeBackendError(error: unknown) {
  if (!axios.isAxiosError(error)) return null;

  if (!error.response) {
    return {
      title: 'Backend kan inte nås',
      message: 'Servern svarar inte. Kontrollera att backend är startad och att nätverksanslutningen fungerar.',
    };
  }

  if (error.response.status === 404) {
    return {
      title: 'Backend saknar rätt API-endpoint',
      message: 'Servern svarar, men adressen som frontend använder finns inte. Kontrollera API-routes och proxyinställningen.',
    };
  }

  if (error.response.status >= 500) {
    return {
      title: 'Backend har ett serverfel',
      message: 'Servern kunde inte behandla begäran. Försök igen och kontrollera backendloggen om felet kvarstår.',
    };
  }

  return {
    title: 'Backend kunde inte leverera informationen',
    message: `Begäran misslyckades med status ${error.response.status}. Försök igen eller kontrollera backendens svar.`,
  };
}

export default function BackendErrorState({
  title,
  message,
  error,
  onRetry,
  compact = false,
}: BackendErrorStateProps) {
  const details = describeBackendError(error);
  const visibleTitle = title ?? details?.title ?? 'Kunde inte hämta information från backend';
  const visibleMessage = message ?? details?.message ?? 'Informationen kan inte hämtas just nu. Försök igen.';

  return (
    <div
      role="alert"
      className={`rounded-lg border border-[#D97706] bg-[#FFF7E6] text-[#713F12] shadow-sm ${
        compact ? 'px-4 py-3' : 'p-5'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-[#B45309]" size={compact ? 19 : 22} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[#713F12]">{visibleTitle}</div>
          <p className="mt-1 text-sm leading-5 text-[#854D0E]">{visibleMessage}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#92400E] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-[#78350F] hover:shadow-md active:translate-y-0"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Försök igen
          </button>
        </div>
      </div>
    </div>
  );
}
