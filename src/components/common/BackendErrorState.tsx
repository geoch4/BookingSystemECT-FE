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

  if (error.response.status === 401) {
    return {
      title: 'Du behöver logga in igen',
      message: 'Din inloggning verkar ha gått ut. Logga in igen för att fortsätta.',
      tone: 'warning' as const,
    };
  }

  if (error.response.status === 403) {
    return {
      title: 'Du har inte behörighet till den här vyn',
      message: 'Din roll saknar åtkomst här. Välj en vy som passar din roll eller kontakta administratör om du borde ha åtkomst.',
      tone: 'permission' as const,
    };
  }

  if (error.response.status === 404) {
    return {
      title: 'Backend saknar rätt API-endpoint',
      message: 'Servern svarar, men adressen som frontend använder finns inte. Kontrollera API-routes och proxyinställningen.',
      tone: 'warning' as const,
    };
  }

  if (error.response.status >= 500) {
    return {
      title: 'Backend har ett serverfel',
      message: 'Servern kunde inte behandla begäran. Försök igen och kontrollera backendloggen om felet kvarstår.',
      tone: 'warning' as const,
    };
  }

  return {
    title: 'Backend kunde inte leverera informationen',
    message: `Begäran misslyckades med status ${error.response.status}. Försök igen eller kontrollera backendens svar.`,
    tone: 'warning' as const,
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
  const tone = details?.tone ?? 'warning';
  const toneClass = tone === 'permission'
    ? {
        box: 'border-[#B7C7DB] bg-[#F5F8FC] text-[#243B5A]',
        icon: 'text-[#4B6B93]',
        title: 'text-[#1E3A5F]',
        message: 'text-[#405875]',
        button: 'bg-[#1F5C99] hover:bg-[#164977]',
      }
    : {
        box: 'border-[#D97706] bg-[#FFF7E6] text-[#713F12]',
        icon: 'text-[#B45309]',
        title: 'text-[#713F12]',
        message: 'text-[#854D0E]',
        button: 'bg-[#92400E] hover:bg-[#78350F]',
      };

  return (
    <div
      role="alert"
      className={`rounded-lg border shadow-sm ${toneClass.box} ${
        compact ? 'px-4 py-3' : 'p-5'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 shrink-0 ${toneClass.icon}`} size={compact ? 19 : 22} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className={`font-bold ${toneClass.title}`}>{visibleTitle}</div>
          <p className={`mt-1 text-sm leading-5 ${toneClass.message}`}>{visibleMessage}</p>
          <button
            type="button"
            onClick={onRetry}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md active:translate-y-0 ${toneClass.button}`}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Försök igen
          </button>
        </div>
      </div>
    </div>
  );
}
