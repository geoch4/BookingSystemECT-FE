import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, Brain, CalendarCheck, ClipboardList, PauseCircle, Printer, Search, XCircle } from 'lucide-react';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto, PatientDto } from '../types';
import { TREATMENT_TYPE_LABELS, isEctType, isRtmsType } from '../types';
import { getAllBookingReferralMeta, getReferralMetaForBooking } from '../utils/bookingMeta';
import type { BookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings, updateDemoBooking } from '../utils/demoBookings';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import DashboardTessaBar from '../components/dashboard/DashboardTessaBar';
import SlotTable from '../components/dashboard/SlotTable';
import StandbyList from '../components/dashboard/StandbyList';
import { useQuickUpdate } from '../hooks/useQuickUpdate';
import { useLanguage } from '../context/LanguageContext';
import { DEMO_MODE } from '../config/demo';
import { getPortalMode } from '../config/portal';
import type { Slot } from '../components/dashboard/SlotRow';

// ─── Constants ────────────────────────────────────────────────────────────────

const ECT_TIMES = ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45'];
const RTMS_TIMES = ['13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30'];

type ModuleView = 'all' | 'ect' | 'rtms';
type DepartmentCategoryFilter = 'all' | 'drafts' | 'referrals' | 'confirmed' | 'attention';
type QuickActionType = 'pause' | 'cancel' | 'end';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Converts a Date to a YYYY-MM-DD string for use as the selected-date state.
function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Formats a YYYY-MM-DD date as a long localized date for the page header.
function formatFullDate(ymd: string, locale: string) {
  return new Date(ymd + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// Determines which module (ECT/rTMS/both) to show, from the route or the ?module= query param.
function getModuleView(pathname: string, search: string): ModuleView {
  const moduleParam = new URLSearchParams(search).get('module');
  if (pathname === '/rtms' || moduleParam === 'rtms') return 'rtms';
  if (moduleParam === 'ect') return 'ect';
  return 'all';
}

function getDateParam(search: string) {
  const value = new URLSearchParams(search).get('date');
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function departmentStatusLabel(booking: BookingDto) {
  if (booking.status === 'Confirmed') {
    return {
      label: 'Tid bekräftad',
      detail: 'Behandlingsenheten har bekräftat patientens tid.',
      className: 'border-[#A9D8BE] bg-[#E8F7F1] text-[#0F6840]',
    };
  }

  if (booking.status === 'Cancelled') {
    return {
      label: 'Avbokad',
      detail: 'Tiden är avbokad. Kontrollera orsak i bokningsvyn vid behov.',
      className: 'border-[#E5A3A6] bg-[#FDEAEA] text-[#9F1D1D]',
    };
  }

  if (booking.priority === 'Red') {
    return {
      label: 'Akut - väntar bekräftelse',
      detail: 'Remissen är skickad som akut och väntar på bekräftelse.',
      className: 'border-[#E5A3A6] bg-[#FDEAEA] text-[#9F1D1D]',
    };
  }

  if (booking.priority === 'Yellow') {
    return {
      label: 'Behöver bevakas',
      detail: 'Remissen är skickad och behöver följas upp.',
      className: 'border-[#E6C77A] bg-[#FFF0CC] text-[#875100]',
    };
  }

  return {
    label: 'Väntar på bekräftelse',
    detail: 'Remissen är skickad till behandlingsenheten.',
    className: 'border-[#93C5FD] bg-[#EFF6FF] text-[#185FA5]',
  };
}

function formatTime(date: string) {
  return date.slice(11, 16);
}

function fallbackPatient(patientId: number): PatientDto {
  const names = [
    'Anna Lindgren', 'Karim Hassan', 'Maja Berg', 'Leo Sand',
    'Britta Andersson', 'Göran Lindqvist', 'Klara Svensson', 'Erik Lund',
    'Sara Holm', 'Johan Berg', 'Elin Nord', 'Oskar Lind',
    'Fatima Ali', 'Nils Ekström', 'Maria Ek', 'Hanna Dahl',
    'Jonas Wik', 'Lina Fors', 'Peter Nyberg', 'Amina Said',
    'Malin Roos', 'Daniel Bergström', 'Sofia Nordin', 'Ahmed Rahman',
    'Eva Karlsson', 'Mikael Sandell', 'Ida Blom', 'Thomas Wallin',
  ];
  return {
    patientId,
    fullName: names[Math.abs(patientId) % names.length] ?? `Patient #${patientId}`,
    socialSecurityNumber: `${String(1970 + (patientId % 30)).padStart(4, '0')}${String((patientId % 12) + 1).padStart(2, '0')}${String((patientId % 27) + 1).padStart(2, '0')}-${String(1000 + patientId).slice(-4)}`,
  };
}

function priorityRank(priority: BookingPriority) {
  if (priority === 'Red') return 0;
  if (priority === 'Yellow') return 1;
  return 2;
}

type DraftReferral = {
  id: string;
  patientName: string;
  personalNumber: string;
  treatment: string;
  department: string;
  plannedStart: string;
  missing: string;
};

const ECT_DRAFT_REFERRALS: DraftReferral[] = [
  {
    id: 'ect-draft-1',
    patientName: 'Anna Lindgren',
    personalNumber: '19780512-2384',
    treatment: 'ECT - planerad',
    department: 'Avdelning 361',
    plannedStart: 'Nästa vecka',
    missing: 'Hälsodeklaration saknas',
  },
  {
    id: 'ect-draft-2',
    patientName: 'Karim Hassan',
    personalNumber: '19691103-4472',
    treatment: 'ECT - underhåll',
    department: 'Avdelning 360',
    plannedStart: 'Inom 2 veckor',
    missing: 'Läkemedelslista ska kompletteras',
  },
];

const RTMS_DRAFT_REFERRALS: DraftReferral[] = [
  {
    id: 'rtms-draft-1',
    patientName: 'Maja Berg',
    personalNumber: '19860421-5521',
    treatment: 'rTMS - depression',
    department: 'Affektiv mottagning',
    plannedStart: 'Planeras senare',
    missing: 'Kontraindikationschecklista saknas',
  },
  {
    id: 'rtms-draft-2',
    patientName: 'Leo Sand',
    personalNumber: '19921008-1194',
    treatment: 'rTMS - ångest/OCD',
    department: 'OCD-mottagningen',
    plannedStart: 'Inom 1 månad',
    missing: 'Tidigare behandlingar ska beskrivas',
  },
];

function DepartmentReferralList({
  bookings,
  patientMap,
  referralMetaByBookingId,
  treatmentLabel,
}: {
  bookings: BookingDto[];
  patientMap: Record<number, PatientDto>;
  referralMetaByBookingId: Record<number, BookingReferralMeta>;
  treatmentLabel: string;
}) {
  const [activeFilter, setActiveFilter] = useState<DepartmentCategoryFilter>('all');
  const draftReferrals = treatmentLabel === 'ECT' ? ECT_DRAFT_REFERRALS : RTMS_DRAFT_REFERRALS;
  const referrals = [...bookings]
    .filter((booking) => booking.status !== 'Confirmed')
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.date.localeCompare(b.date));
  const confirmedBookings = [...bookings]
    .filter((booking) => booking.status === 'Confirmed')
    .sort((a, b) => a.date.localeCompare(b.date));
  const actionNeeded = referrals.filter((booking) => booking.priority === 'Red' || booking.priority === 'Yellow').length;
  const attentionReferrals = referrals.filter((booking) => booking.priority === 'Red' || booking.priority === 'Yellow');
  const cancelled = bookings.filter((booking) => booking.status === 'Cancelled').length;
  const showDrafts = activeFilter === 'all' || activeFilter === 'drafts';
  const showReferrals = activeFilter === 'all' || activeFilter === 'referrals' || activeFilter === 'attention';
  const showConfirmed = activeFilter === 'all' || activeFilter === 'confirmed';
  const visibleReferrals = activeFilter === 'attention' ? attentionReferrals : referrals;

  function filterCardClass(filter: DepartmentCategoryFilter, baseClass: string) {
    const isActive = activeFilter === filter;
    return `${baseClass} cursor-pointer text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
      isActive ? 'ring-2 ring-[#185FA5] ring-offset-2' : ''
    }`;
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1A2332]">Översikt för {treatmentLabel}</h2>
          <p className="mt-1 text-sm text-[#8494AA]">
            Klicka på ett kort för att filtrera listorna: utkast, skickade remisser, bekräftade tider eller ärenden som behöver bevakas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'drafts' ? 'all' : 'drafts')}
            className={filterCardClass('drafts', 'rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4')}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Förberedda/utkast</div>
            <div className="mt-1 text-2xl font-bold text-[#1A2332]">{draftReferrals.length}</div>
            <p className="mt-1 text-xs text-[#64748B]">Påbörjade remisser som inte är skickade ännu.</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'referrals' ? 'all' : 'referrals')}
            className={filterCardClass('referrals', 'rounded-xl border border-[#93C5FD] bg-[#EFF6FF] p-4')}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-[#185FA5]">Skickade remisser</div>
            <div className="mt-1 text-2xl font-bold text-[#1A2332]">{referrals.length}</div>
            <p className="mt-1 text-xs text-[#64748B]">Väntar på prioritering eller bekräftelse.</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'confirmed' ? 'all' : 'confirmed')}
            className={filterCardClass('confirmed', 'rounded-xl border border-[#A9D8BE] bg-[#E8F7F1] p-4')}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-[#0F6840]">Bekräftade tider</div>
            <div className="mt-1 text-2xl font-bold text-[#1A2332]">{confirmedBookings.length}</div>
            <p className="mt-1 text-xs text-[#64748B]">Tider bekräftade av behandlingsenheten.</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'attention' ? 'all' : 'attention')}
            className={filterCardClass('attention', 'rounded-xl border border-[#E6C77A] bg-[#FFF0CC] p-4')}
          >
            <div className="text-xs font-bold uppercase tracking-wide text-[#875100]">Behöver bevakas</div>
            <div className="mt-1 text-2xl font-bold text-[#1A2332]">{actionNeeded}</div>
            <p className="mt-1 text-xs text-[#64748B]">{cancelled} avbokade ärenden.</p>
          </button>
        </div>

        {activeFilter !== 'all' && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-2 text-sm">
            <span className="font-semibold text-[#1A2332]">
              Visar: {
                activeFilter === 'drafts' ? 'Förberedda/utkast'
                  : activeFilter === 'referrals' ? 'Skickade remisser'
                    : activeFilter === 'confirmed' ? 'Bekräftade tider'
                      : 'Behöver bevakas'
              }
            </span>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="font-semibold text-[#185FA5] hover:underline"
            >
              Visa alla
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {showDrafts && <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#1A2332]">Förberedda remisser / utkast</h3>
            <p className="mt-1 text-sm text-[#8494AA]">
              Exempel på patienter där avdelningen kan börja förbereda remissen innan den skickas till behandlingsenheten.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {draftReferrals.map((draft) => (
              <article key={draft.id} className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-[#1A2332]">{draft.patientName}</div>
                    <div className="mt-0.5 text-xs font-mono text-[#8494AA]">{draft.personalNumber}</div>
                  </div>
                  <span className="rounded-full border border-[#C3CEDA] bg-white px-3 py-1 text-xs font-bold text-[#64748B]">
                    Utkast
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Planerad start</div>
                    <div className="mt-1 text-sm font-semibold text-[#1A2332]">{draft.plannedStart}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                    <div className="mt-1 text-sm font-semibold text-[#1A2332]">{draft.treatment}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning</div>
                    <div className="mt-1 text-sm font-semibold text-[#1A2332]">{draft.department}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Saknas</div>
                    <div className="mt-1 text-sm font-semibold text-[#1A2332]">{draft.missing}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>}

        {showReferrals && <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#1A2332]">
              {activeFilter === 'attention' ? 'Remisser som behöver bevakas' : 'Remisser i ordningslista'}
            </h3>
            <p className="mt-1 text-sm text-[#8494AA]">
              {activeFilter === 'attention'
                ? 'Visar remisser med akut eller gul prioritet.'
                : 'Prioriteras efter akut/gul/grön och därefter önskat startdatum.'}
            </p>
          </div>

          {visibleReferrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-8 text-center">
              <div className="text-sm font-bold text-[#1A2332]">Inga remisser väntar</div>
              <p className="mt-1 text-sm text-[#8494AA]">Förbered en ny remiss när patienten är aktuell.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReferrals.map((booking, index) => {
                const patient = patientMap[booking.patientId];
                const referralMeta = getReferralMetaForBooking(booking, referralMetaByBookingId[booking.bookingId]);
                const status = departmentStatusLabel(booking);

                return (
                  <article key={booking.bookingId} className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF4FC] text-sm font-bold text-[#185FA5]">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-base font-bold text-[#1A2332]">
                            {patient?.fullName ?? `Patient #${booking.patientId}`}
                          </div>
                          <div className="mt-0.5 text-xs font-mono text-[#8494AA]">
                            {patient?.socialSecurityNumber ?? 'Personnummer saknas'}
                          </div>
                        </div>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Önskad start</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{booking.date.slice(0, 10)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                          {TREATMENT_TYPE_LABELS[booking.treatmentTypeId]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                          {referralMeta?.department || 'Ej angiven'}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>}

        {showConfirmed && <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#1A2332]">Bekräftade tider</h3>
            <p className="mt-1 text-sm text-[#8494AA]">
              Här visas bara de patienter där ECT/rTMS-enheten har bekräftat datum och tid.
            </p>
          </div>

          {confirmedBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-8 text-center">
              <div className="text-sm font-bold text-[#1A2332]">Inga bekräftade tider</div>
              <p className="mt-1 text-sm text-[#8494AA]">Bekräftade tider visas här när enheten har bokat patienten.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmedBookings.map((booking) => {
                const patient = patientMap[booking.patientId];
                const referralMeta = getReferralMetaForBooking(booking, referralMetaByBookingId[booking.bookingId]);

                return (
                  <article key={booking.bookingId} className="rounded-xl border border-[#A9D8BE] bg-[#E8F7F1] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-[#1A2332]">
                          {patient?.fullName ?? `Patient #${booking.patientId}`}
                        </div>
                        <div className="mt-0.5 text-xs font-mono text-[#4B7B66]">
                          {patient?.socialSecurityNumber ?? 'Personnummer saknas'}
                        </div>
                      </div>
                      <span className="rounded-full border border-[#A9D8BE] bg-white px-3 py-1 text-xs font-bold text-[#0F6840]">
                        Tid bekräftad
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Bekräftad tid</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                          {booking.date.slice(0, 10)} kl. {formatTime(booking.date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Behandling</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                          {TREATMENT_TYPE_LABELS[booking.treatmentTypeId]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Avdelning</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                          {referralMeta?.department || 'Ej angiven'}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>}
      </div>
    </section>
  );
}

function PatientActionPanel({
  bookings,
  patientMap,
  treatmentLabel,
  pausedBookingIds,
  presetSearch,
  onPause,
  onCancel,
}: {
  bookings: BookingDto[];
  patientMap: Record<number, PatientDto>;
  treatmentLabel: string;
  pausedBookingIds: Set<number>;
  presetSearch: string;
  onPause: (bookingId: number) => void;
  onCancel: (booking: BookingDto) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<QuickActionType | null>(null);
  const [comment, setComment] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!presetSearch) return;
    const id = window.setTimeout(() => setQuery(presetSearch), 0);
    return () => window.clearTimeout(id);
  }, [presetSearch]);
  const activeBookings = bookings
    .filter((booking) => booking.status !== 'Cancelled')
    .sort((a, b) => a.date.localeCompare(b.date));
  const examplePatients = activeBookings.slice(0, 3).map((booking) => ({
    booking,
    patient: patientMap[booking.patientId] ?? fallbackPatient(booking.patientId),
  }));
  const examplePatient = examplePatients[0]?.patient ?? null;
  const searchDigits = query.replace(/\D/g, '');
  const normalizedQuery = query.trim().toLowerCase();
  const matchedBooking = activeBookings.find((booking) => {
    const patient = patientMap[booking.patientId] ?? fallbackPatient(booking.patientId);
    const patientDigits = patient.socialSecurityNumber.replace(/\D/g, '');
    return searchDigits.length >= 4
      ? patientDigits.includes(searchDigits)
      : normalizedQuery.length >= 2 && patient.fullName.toLowerCase().includes(normalizedQuery);
  });
  const patient = matchedBooking ? (patientMap[matchedBooking.patientId] ?? fallbackPatient(matchedBooking.patientId)) : null;
  const hasSearched = query.trim().length > 0;
  const actionLabels: Record<QuickActionType, string> = {
    pause: 'Pausa behandling',
    cancel: 'Avboka tid',
    end: 'Avsluta behandling',
  };
  const actionDescriptions: Record<QuickActionType, string> = {
    pause: 'Behandlingen pausas tillfälligt och behandlingsenheten får orsaken.',
    cancel: 'Den planerade tiden avbokas och behandlingsenheten får orsaken.',
    end: 'Behandlingsserien markeras som avslutad och behandlingsenheten får orsaken.',
  };

  function openAction(action: QuickActionType) {
    setSelectedAction(action);
    setComment('');
    setSentMessage(null);
  }

  function closeAction() {
    setSelectedAction(null);
    setComment('');
  }

  function submitAction() {
    if (!selectedAction || !matchedBooking || !patient || !comment.trim()) return;

    if (selectedAction === 'pause' || selectedAction === 'end') {
      onPause(matchedBooking.bookingId);
    }
    if (selectedAction === 'cancel') {
      onCancel(matchedBooking);
    }

    setSentMessage(`${actionLabels[selectedAction]} är skickad till behandlingsenheten.`);
    closeAction();
  }

  return (
    <section id="patient-action-panel" className="mb-5 rounded-2xl border border-[#C9D6E6] bg-[#F8FAFC] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
        <h2 className="text-base font-bold text-[#1A2332]">Patientåtgärd</h2>
        <p className="text-sm text-[#8494AA]">
          Sök fram en patient med personnummer för att pausa, avboka eller avsluta en pågående {treatmentLabel}-process.
        </p>
        </div>
        {examplePatients.length > 0 && (
          <div className="flex max-w-full flex-wrap gap-2">
            {examplePatients.map(({ booking, patient: demoPatient }) => (
              <button
                key={booking.bookingId}
                type="button"
                onClick={() => setQuery(demoPatient.socialSecurityNumber)}
                className="rounded-full border border-[#C9D6E6] bg-white px-3 py-1.5 text-xs font-semibold text-[#185FA5] hover:border-[#1A4F8A] hover:bg-[#EFF6FF]"
              >
                Testa {demoPatient.socialSecurityNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8494AA]" size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={examplePatient ? `Sök personnummer, t.ex. ${examplePatient.socialSecurityNumber}` : 'Sök personnummer'}
          className="w-full rounded-xl border border-[#DDE3EC] bg-white py-3 pl-10 pr-3 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
        />
      </div>

      {patient && matchedBooking && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#C9D6E6] bg-white p-4 shadow-sm">
          <div>
            <div className="text-base font-bold text-[#1A2332]">{patient.fullName}</div>
            <div className="mt-0.5 font-mono text-xs text-[#64748B]">{patient.socialSecurityNumber}</div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Tid</div>
                <div className="font-semibold text-[#1A2332]">{matchedBooking.date.slice(0, 10)} kl. {formatTime(matchedBooking.date)}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                <div className="font-semibold text-[#1A2332]">{TREATMENT_TYPE_LABELS[matchedBooking.treatmentTypeId]}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Status</div>
                <div className="font-semibold text-[#1A2332]">
                  {pausedBookingIds.has(matchedBooking.bookingId) ? 'Pausad' : matchedBooking.status === 'Confirmed' ? 'Bekräftad' : 'Väntar'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openAction('pause')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E6C77A] bg-[#FFF0CC] px-4 py-2 text-sm font-bold text-[#875100] hover:bg-[#FFE8A3]"
            >
              <PauseCircle size={18} aria-hidden="true" />
              Pausa
            </button>
            <button
              type="button"
              onClick={() => openAction('cancel')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5A3A6] bg-[#FDEAEA] px-4 py-2 text-sm font-bold text-[#9F1D1D] hover:bg-[#FBDADA]"
            >
              <XCircle size={18} aria-hidden="true" />
              Avboka tid
            </button>
            <button
              type="button"
              onClick={() => openAction('end')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#C9D6E6] bg-[#EEF2F7] px-4 py-2 text-sm font-bold text-[#334155] hover:bg-[#E2E8F0]"
            >
              <XCircle size={18} aria-hidden="true" />
              Avsluta
            </button>
          </div>
        </div>
      )}

      {sentMessage && (
        <p className="mt-3 rounded-lg border border-[#A9D8BE] bg-[#E8F7F1] px-3 py-2 text-sm font-semibold text-[#0F6840]">
          {sentMessage}
        </p>
      )}

      {hasSearched && !patient && (
        <p className="mt-3 rounded-lg border border-[#E6C77A] bg-[#FFF0CC] px-3 py-2 text-sm font-semibold text-[#875100]">
          Ingen aktiv {treatmentLabel}-behandling hittades på det personnumret.
        </p>
      )}

      {selectedAction && patient && matchedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Bekräfta åtgärd</div>
              <h3 className="mt-1 text-xl font-bold text-[#1A2332]">{actionLabels[selectedAction]}</h3>
              <p className="mt-1 text-sm text-[#64748B]">{actionDescriptions[selectedAction]}</p>
            </div>

            <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4 text-sm">
              <div className="font-bold text-[#1A2332]">{patient.fullName}</div>
              <div className="font-mono text-xs text-[#64748B]">{patient.socialSecurityNumber}</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                  <div className="font-semibold text-[#1A2332]">{TREATMENT_TYPE_LABELS[matchedBooking.treatmentTypeId]}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Tid</div>
                  <div className="font-semibold text-[#1A2332]">{matchedBooking.date.slice(0, 10)} kl. {formatTime(matchedBooking.date)}</div>
                </div>
              </div>
            </div>

            <label className="mt-4 block text-sm font-bold text-[#1A2332]" htmlFor="quick-action-comment">
              Orsak / kommentar *
            </label>
            <textarea
              id="quick-action-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Skriv varför åtgärden behövs. Kommentaren skickas till behandlingsenheten."
              className="mt-2 w-full rounded-xl border border-[#DDE3EC] p-3 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
            />
            {!comment.trim() && (
              <p className="mt-2 text-xs font-semibold text-[#C42B2B]">
                Kommentar krävs innan åtgärden kan skickas.
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeAction}
                className="rounded-lg border border-[#DDE3EC] px-4 py-2 text-sm font-semibold text-[#4B5770] hover:bg-[#F0F4F8]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={!comment.trim()}
                className="rounded-lg bg-[#1A4F8A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163F70] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Skicka till behandlingsenheten
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const location = useLocation();
  const routeNavigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => getDateParam(location.search) ?? toYMD(new Date()));
  const [pausedBookingIds, setPausedBookingIds] = useState<Set<number>>(() => new Set());
  const [showAcuteOnly, setShowAcuteOnly] = useState(false);
  const [patientActionSearch, setPatientActionSearch] = useState('');
  const moduleView = getModuleView(location.pathname, location.search);
  const portalMode = getPortalMode();
  const referralMetaByBookingId = getAllBookingReferralMeta();

  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const apiBookings = bookingsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const [demoBookings, setDemoBookings] = useState<BookingDto[]>(getDemoBookings);
  const bookings = DEMO_MODE ? [...apiBookings, ...demoBookings] : apiBookings;
  const isLoading = !DEMO_MODE && (bookingsQuery.isLoading || patientsQuery.isLoading);
  const backendUnavailable = !DEMO_MODE && (bookingsQuery.isError || patientsQuery.isError);

  useEffect(() => {
    const dateParam = getDateParam(location.search);
    if (!dateParam) return;
    const id = window.setTimeout(() => setSelectedDate(dateParam), 0);
    return () => window.clearTimeout(id);
  }, [location.search]);

  const quickUpdate = useQuickUpdate();
  const patientMap: Record<number, PatientDto> = Object.fromEntries([
    ...bookings.map((booking) => [booking.patientId, fallbackPatient(booking.patientId)] as const),
    ...patients.map((patient) => [patient.patientId, patient] as const),
  ]);
  const todayBookings = bookings.filter((b) => b.date.slice(0, 10) === selectedDate);

  // Builds the full list of time slots for a block, filling in the booking (if any) for each time.
  function buildSlots(times: string[], typeHint: 'ECT' | 'rTMS'): Slot[] {
    const filterFn = typeHint === 'ECT' ? isEctType : isRtmsType;
    const sourceBookings = showAcuteOnly
      ? todayBookings.filter((booking) => booking.priority === 'Red' && booking.status !== 'Cancelled')
      : todayBookings;
    return times.map((time) => {
      const booking = sourceBookings
        .filter((b) => filterFn(b.treatmentTypeId))
        .find((b) => b.date.slice(11, 16) === time);
      return {
        time, type: typeHint, booking,
        patient: booking ? patientMap[booking.patientId] : undefined,
        treatmentTypeName: booking ? (TREATMENT_TYPE_LABELS[booking.treatmentTypeId] ?? `Typ ${booking.treatmentTypeId}`) : undefined,
      };
    });
  }

  // Updates a booking's status/priority from the slot table. Demo bookings (negative
  // id) are updated locally instead of via the API since they don't exist in the backend.
  function handleStatusChange(b: BookingDto, status: BookingStatus, priority: BookingPriority, cancellationReason?: string) {
    const dto: CreateBookingDto = {
      date: b.date, patientId: b.patientId, treatmentTypeId: b.treatmentTypeId,
      createdById: b.createdById, createdAt: b.createdAt, priority, status,
      referralDepartment: b.referralDepartment,
      referralContactName: b.referralContactName,
      referralContactPhone: b.referralContactPhone,
      cancellationReason: status === 'Cancelled' ? cancellationReason : undefined,
    };
    if (b.bookingId < 0) {
      const updated = { ...b, status, priority, cancellationReason: status === 'Cancelled' ? cancellationReason : undefined };
      updateDemoBooking(updated);
      setDemoBookings((prev) => prev.map((bk) => bk.bookingId === b.bookingId ? updated : bk));
      return;
    }
    quickUpdate.mutate({
      id: b.bookingId,
      dto,
      auditReason: status === 'Cancelled'
        ? cancellationReason || 'Avbokning utan angiven orsak'
        : `Status ändrad till ${status}. Prioritet ${priority}.`,
    });
  }

  // Moves the selected date forward/backward by `delta` days.
  function navigateDay(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setShowAcuteOnly(false);
    setSelectedDate(toYMD(d));
  }

  function openPrintList() {
    const params = new URLSearchParams({ date: selectedDate });
    if (moduleView === 'ect' || moduleView === 'rtms') params.set('module', moduleView);
    routeNavigate(`/print/daily-list?${params.toString()}`);
  }

  const moduleBookings = todayBookings.filter((b) => {
    if (moduleView === 'all') return true;
    return moduleView === 'ect' ? isEctType(b.treatmentTypeId) : isRtmsType(b.treatmentTypeId);
  });
  const redToday = moduleBookings.filter((b) => b.priority === 'Red' && b.status !== 'Cancelled').length;
  const acuteBookings = moduleBookings
    .filter((b) => b.priority === 'Red' && b.status !== 'Cancelled')
    .sort((a, b) => a.date.localeCompare(b.date));
  const visibleBookings = showAcuteOnly
    ? acuteBookings
    : moduleBookings;
  // Picks the page title based on which module view is active.
  const dashboardTitle =
    moduleView === 'ect' ? t('ectDashboard') :
    moduleView === 'rtms' ? t('rtmsDashboard') :
    portalMode === 'admin' ? 'Dagens lista' : t('coordinatorDashboard');
  const treatmentLabel = moduleView === 'ect' ? 'ECT' : moduleView === 'rtms' ? 'rTMS' : null;
  const treatmentParam = moduleView === 'ect' ? 'ect' : moduleView === 'rtms' ? 'rtms' : null;
  const TreatmentIcon = moduleView === 'rtms' ? Activity : Brain;
  const treatmentActionGroups = treatmentParam ? [
    {
      title: 'Remiss',
      description: `Förbered underlag, önska behandlingsstart och skicka ${treatmentLabel}-remissen när allt är klart.`,
      icon: ClipboardList,
      actions: [
        { label: 'Förbered utkast', route: `/referral?treatment=${treatmentParam}` },
        { label: 'Önska behandlingsstart', route: `/referral?treatment=${treatmentParam}` },
        { label: `Skicka ${treatmentLabel}-remiss`, route: `/referral?treatment=${treatmentParam}` },
      ],
    },
    {
      title: 'Status och bevakning',
      description: `Följ skickade remisser, se vilka som väntar och vilka som behöver extra uppmärksamhet.`,
      icon: TreatmentIcon,
      actions: [
        { label: 'Följ status', route: '/referrals' },
        { label: 'Behöver bevakas', route: '/referrals' },
        { label: 'Bekräftade tider', route: '/confirmed-bookings' },
      ],
    },
    {
      title: 'Bokad behandling',
      description: `Hantera patienter som redan har fått en bekräftad tid från behandlingsenheten.`,
      icon: CalendarCheck,
      actions: [
        { label: 'Se bekräftad tid', route: '/confirmed-bookings' },
        { label: 'Pausa behandling', route: '/confirmed-bookings' },
        { label: 'Avboka tid', route: '/confirmed-bookings' },
      ],
    },
  ] : [];

  return (
    <div className="p-4 w-full">
      {/* Header + date nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold text-[#1A2332]">{dashboardTitle}</h1>
          <p className="text-sm text-[#8494AA] capitalize">{formatFullDate(selectedDate, locale)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {redToday > 0 && (
            <button
              type="button"
              onClick={() => setShowAcuteOnly((current) => !current)}
              className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs transition-colors ${
                showAcuteOnly
                  ? 'border-[#C42B2B] bg-[#C42B2B] text-white'
                  : 'border-[#C42B2B] bg-[#FDEAEA] text-[#C42B2B] hover:bg-[#FBDADA]'
              }`}
              aria-pressed={showAcuteOnly}
            >
              <span className={`h-2 w-2 rounded-full ${showAcuteOnly ? 'bg-white' : 'bg-[#C42B2B]'}`} />
              <span className="font-semibold">{redToday} akut</span>
            </button>
          )}
          <button onClick={() => navigateDay(-1)} aria-label={t('previousDay')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] text-[#4B5770] transition-colors">
            <span aria-hidden="true">‹</span>
          </button>
          <button onClick={() => { setShowAcuteOnly(false); setSelectedDate(toYMD(new Date())); }}
            className="px-3 py-1.5 text-xs font-medium border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] rounded-lg text-[#4B5770] transition-colors">
            {t('today')}
          </button>
          <button onClick={() => navigateDay(1)} aria-label={t('nextDay')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] text-[#4B5770] transition-colors">
            <span aria-hidden="true">›</span>
          </button>
          {portalMode === 'admin' && (
            <>
              <button
                type="button"
                onClick={openPrintList}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#1A4F8A] bg-white px-3 text-xs font-semibold text-[#185FA5] transition-colors hover:bg-[#EFF6FF]"
              >
                <Printer size={15} aria-hidden="true" />
                Skriv ut lista
              </button>
            </>
          )}
        </div>
      </div>

      {portalMode === 'admin' && <DashboardTessaBar bookings={visibleBookings} />}

      {DEMO_MODE && (bookingsQuery.isError || patientsQuery.isError) && (
        <div className="mb-4">
          <BackendErrorState
            compact
            title="Backend kan inte nås - visar exempeldata"
            message="Dagens lista använder mockdata just nu. Kontrollera backend innan skarp drift."
            error={bookingsQuery.error ?? patientsQuery.error}
            onRetry={() => { void bookingsQuery.refetch(); void patientsQuery.refetch(); }}
          />
        </div>
      )}

      {showAcuteOnly && (
        <div className="mb-4 rounded-xl border border-[#C42B2B] bg-[#FDEAEA] px-4 py-3 text-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="font-semibold text-[#9F1D1D]">
              Visar endast akuta ärenden för valt datum.
            </div>
            <button
              type="button"
              onClick={() => setShowAcuteOnly(false)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#9F1D1D] hover:bg-[#F8FAFC]"
            >
              Visa alla ärenden
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {acuteBookings.map((booking) => {
              const patient = patientMap[booking.patientId] ?? fallbackPatient(booking.patientId);
              return (
                <div key={booking.bookingId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5A3A6] bg-white px-3 py-2">
                  <div>
                    <div className="font-bold text-[#1A2332]">{patient.fullName}</div>
                    <div className="font-mono text-xs text-[#64748B]">{patient.socialSecurityNumber}</div>
                  </div>
                  <div className="text-xs text-[#4B5770]">
                    <div className="font-bold text-[#9F1D1D]">{formatTime(booking.date)} · {TREATMENT_TYPE_LABELS[booking.treatmentTypeId]}</div>
                    <div>{booking.referralDepartment || 'Avdelning saknas'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientActionSearch(patient.socialSecurityNumber);
                      setShowAcuteOnly(false);
                      window.setTimeout(() => {
                        document.getElementById('patient-action-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 0);
                    }}
                    className="rounded-lg border border-[#C42B2B] px-3 py-1.5 text-xs font-bold text-[#9F1D1D] hover:bg-[#FDEAEA]"
                  >
                    Visa patient
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {portalMode === 'department' && treatmentLabel && (
        <>
          <section className="mb-5 rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#1A2332]">Huvudåtgärder i {treatmentLabel}</h2>
              <p className="text-sm text-[#8494AA]">
                Funktionerna är samlade i tre arbetsgrupper så att liknande uppgifter ligger tillsammans.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {treatmentActionGroups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4"
                >
                  <group.icon size={22} color="#185FA5" aria-hidden="true" />
                  <div className="mt-3 text-sm font-bold text-[#1A2332]">{group.title}</div>
                  <p className="mt-1 text-xs leading-5 text-[#64748B]">{group.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => routeNavigate(action.route)}
                        className="rounded-lg border border-[#C9D6E6] bg-white px-3 py-2 text-xs font-semibold text-[#185FA5] transition-colors hover:border-[#1A4F8A] hover:bg-[#EFF6FF]"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <PatientActionPanel
            bookings={visibleBookings}
            patientMap={patientMap}
            treatmentLabel={treatmentLabel}
            pausedBookingIds={pausedBookingIds}
            presetSearch={patientActionSearch}
            onPause={(bookingId) => setPausedBookingIds((current) => new Set(current).add(bookingId))}
            onCancel={(booking) => handleStatusChange(booking, 'Cancelled', booking.priority)}
          />
        </>
      )}

      {backendUnavailable && (
        <div className="mb-5">
          <BackendErrorState
            error={bookingsQuery.error ?? patientsQuery.error}
            onRetry={() => { void bookingsQuery.refetch(); void patientsQuery.refetch(); }}
          />
        </div>
      )}

      {isLoading && !backendUnavailable && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#8494AA]">
          <Spinner size={20} />
          {t('loadingSchedule')}
        </div>
      )}

      {!backendUnavailable && !isLoading && portalMode === 'department' && treatmentLabel && (
        <DepartmentReferralList
          bookings={visibleBookings}
          patientMap={patientMap}
          referralMetaByBookingId={referralMetaByBookingId}
          treatmentLabel={treatmentLabel}
        />
      )}

      {!backendUnavailable && !isLoading && portalMode === 'admin' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_210px]">
          <div>
            {(moduleView === 'all' || moduleView === 'ect') && (
              <SlotTable
                title={t('morningBlock')}
                slots={buildSlots(ECT_TIMES, 'ECT')}
                onStatusChange={handleStatusChange}
                referralMetaByBookingId={referralMetaByBookingId}
              />
            )}
            {(moduleView === 'all' || moduleView === 'rtms') && (
              <SlotTable
                title={t('afternoonBlock')}
                slots={buildSlots(RTMS_TIMES, 'rTMS')}
                onStatusChange={handleStatusChange}
                referralMetaByBookingId={referralMetaByBookingId}
              />
            )}
          </div>
          <div className="space-y-4">
            <StandbyList bookings={visibleBookings} patientMap={patientMap} />
          </div>
        </div>
      )}
    </div>
  );
}
