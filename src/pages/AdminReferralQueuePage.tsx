import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ClipboardCheck, FileWarning, MapPin, ShieldAlert } from 'lucide-react';
import { getBookings, updateBooking } from '../api/bookings';
import { getPatients } from '../api/patients';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import ReferralTimeline from '../components/referral/ReferralTimeline';
import { DEMO_MODE } from '../config/demo';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings, updateDemoBooking } from '../utils/demoBookings';
import type { ReferralCase } from '../utils/referralCases';
import {
  type ReferralActionNote,
  type ReferralActionType,
} from '../utils/referralActions';
import {
  getReferralActionEventSnapshot,
  getReferralActionSnapshotsFromApi,
  getReferralActionSnapshot,
  persistReferralAction,
  recordReferralAction,
} from '../repositories/referralActionRepository';
import { getReferralQueueSnapshot } from '../repositories/referralRepository';
import { isEctType, type BookingPriority, type CreateBookingDto, type PatientDto } from '../types';
import { rtmsSessionPlanLabel } from '../utils/rtmsTreatmentPlan';
import { useAuth } from '../context/useAuth';

type QueueFilter = 'all' | 'acute' | 'needs-completion' | 'anesthesia' | 'ready';
type QueueActionType = Extract<ReferralActionType, 'completion' | 'prioritize'>;

function priorityBadge(priority: BookingPriority) {
  if (priority === 'Red') return 'border-[#E5A3A6] bg-white text-[#9F1D1D]';
  return 'border-[#E3D8CB] bg-white text-[#4B5770]';
}

function priorityLabel(priority: BookingPriority) {
  if (priority === 'Red') return 'Akut';
  if (priority === 'Yellow') return 'Halvakut';
  return 'Elektiv';
}

function statusBadge(referral: ReferralCase) {
  if (referral.anesthesiaAttention) return 'border-[#E5A3A6] bg-white text-[#9F1D1D]';
  return 'border-[#E3D8CB] bg-white text-[#4B5770]';
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function defaultBookingTime(referral: ReferralCase) {
  return isEctType(referral.booking.treatmentTypeId) ? '09:00' : '13:00';
}

function QueueCard({
  referral,
  note,
  events,
  isOpen,
  onToggle,
  onRequestCompletion,
  onPrioritize,
  canRequestCompletion,
  canPrioritize,
}: {
  referral: ReferralCase;
  note?: ReferralActionNote;
  events?: Parameters<typeof ReferralTimeline>[0]['events'];
  isOpen: boolean;
  onToggle: () => void;
  onRequestCompletion: (referral: ReferralCase) => void;
  onPrioritize: (referral: ReferralCase) => void;
  canRequestCompletion: boolean;
  canPrioritize: boolean;
}) {
  const missingCount = referral.missingDocuments.length;
  const warningCount = referral.riskFlags.length;

  return (
    <article className={`group relative overflow-hidden rounded-2xl border bg-[#FFFCF7] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBBBA8] hover:shadow-md ${
      isOpen ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/10' : 'border-[#E3D8CB]'
    }`}>
      <div
        className={`absolute inset-y-0 left-0 w-1 transition-colors duration-200 ${
          isOpen
            ? 'bg-[#4F46E5]'
            : referral.priority === 'Red'
              ? 'bg-[#C42B2B]'
              : 'bg-transparent group-hover:bg-[#CBBBA8]'
        }`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center justify-between gap-4 p-4 pl-5 text-left transition-colors duration-200 group-hover:bg-[#FBF7F0]"
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/referrals/${referral.id}`}
              onClick={(event) => event.stopPropagation()}
              className="text-lg font-bold text-[#1A2332] hover:text-[#4F46E5] hover:underline"
            >
              {referral.patient.fullName}
            </Link>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityBadge(referral.priority)}`}>
              {priorityLabel(referral.priority)}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(referral)}`}>
              {referral.statusLabel}
            </span>
            {referral.departmentPriority && (
              <span className="rounded-full border border-[#C4B5FD] bg-[#F7F4FF] px-2.5 py-1 text-xs font-bold text-[#4F46E5]">
                Avd prio {referral.departmentPriority}
              </span>
            )}
            {referral.rtmsSessionPlan && (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                referral.rtmsSessionPlan === 'double'
                  ? 'border-[#C4B5FD] bg-[#F7F4FF] text-[#4F46E5]'
                  : 'border-[#A7D8CE] bg-[#F2FAF8] text-[#0F766E]'
              }`}>
                rTMS {rtmsSessionPlanLabel(referral.rtmsSessionPlan)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
            <span className="font-mono">{referral.patient.socialSecurityNumber}</span>
            <span>{referral.treatmentLabel}</span>
            {referral.rtmsSessionPlan && <span className="font-semibold text-[#0F766E]">{rtmsSessionPlanLabel(referral.rtmsSessionPlan)}</span>}
            <span>{referral.department}</span>
            {referral.departmentPriority && <span className="font-semibold text-[#4F46E5]">Avdelningens prio {referral.departmentPriority}</span>}
            {referral.logistics.requiresTransport && <span className="font-semibold text-[#4B5770]">Transport</span>}
            {missingCount > 0 && <span className="font-semibold text-[#4B5770]">{missingCount} saknas</span>}
            {warningCount > 0 && <span className="font-bold text-[#9F1D1D]">{warningCount} varning</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 text-right text-xs text-[#64748B]">
          <div>
            <div className="font-bold text-[#1A2332]">{referral.treatmentTrack}</div>
            <div>Skickad {formatDateTime(referral.submittedAt)}</div>
          </div>
          <ChevronDown
            size={20}
            className={`text-[#8494AA] transition-all duration-200 group-hover:text-[#4F46E5] ${isOpen ? 'rotate-180 text-[#4F46E5]' : ''}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && <div className="border-t border-[#E5EAF1] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-[#FBF7F0] p-3 transition-colors hover:bg-[#F7F4FF]">
            <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
            <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.treatmentLabel}</div>
            {referral.rtmsSessionPlan && (
              <div className="mt-1 text-xs font-bold text-[#0F766E]">
                {rtmsSessionPlanLabel(referral.rtmsSessionPlan)}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-[#FBF7F0] p-3 transition-colors hover:bg-[#F7F4FF]">
            <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Önskad start</div>
            <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.requestedStartDate}</div>
          </div>
          <div className="rounded-xl bg-[#FBF7F0] p-3 transition-colors hover:bg-[#F7F4FF]">
            <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning</div>
            <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.department}</div>
          </div>
          <div className="rounded-xl bg-[#FBF7F0] p-3 transition-colors hover:bg-[#F7F4FF]">
            <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Kontakt</div>
            <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.contactName}</div>
            {referral.contactPhone && <div className="text-xs text-[#64748B]">{referral.contactPhone}</div>}
          </div>
        </div>

        {referral.departmentPriority && (
          <div className="mt-3 rounded-xl border border-[#C4B5FD] bg-[#F7F4FF] px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-[#4F46E5]">Avdelningens interna rangordning</div>
            <div className="mt-1 text-sm font-semibold text-[#1A2332]">
              Prioritet {referral.departmentPriority} från {referral.department}. Använd som stöd när flera patienter från samma avdelning konkurrerar om tillgängliga ECT-platser.
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <section className="rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] p-3 transition-colors duration-200 hover:border-[#CBBBA8] hover:bg-[#FBF7F0]">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A2332]">
              <ClipboardCheck size={16} aria-hidden="true" />
              Dokument
            </div>
            <div className="space-y-2">
              {referral.documents.map((document) => (
                <div key={document.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#4B5770]">{document.label}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${
                    document.complete
                      ? 'border-[#E3D8CB] bg-white text-[#4B5770]'
                      : 'border-[#D9CBBB] bg-[#FBF7F0] text-[#1A2332]'
                  }`}>
                    {document.complete ? 'Klar' : 'Saknas'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] p-3 transition-colors duration-200 hover:border-[#CBBBA8] hover:bg-[#FBF7F0]">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A2332]">
              <MapPin size={16} aria-hidden="true" />
              Logistik
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#64748B]">Enhet</span>
                <span className="text-right font-semibold text-[#1A2332]">{referral.logistics.recommendedUnit.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#64748B]">Flöde</span>
                <span className="font-semibold text-[#1A2332]">{referral.logistics.patientFlow}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#64748B]">Vårdplats</span>
                <span className="font-semibold text-[#1A2332]">{referral.logistics.sourceSite}</span>
              </div>
            </div>
            {referral.logistics.transportLabel && (
              <div className="mt-3 rounded-lg border border-[#E3D8CB] bg-[#FBF7F0] px-3 py-2 text-sm font-semibold text-[#4B5770]">
                Transport behöver planeras
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] p-3 transition-colors duration-200 hover:border-[#CBBBA8] hover:bg-[#FBF7F0]">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A2332]">
              <ShieldAlert size={16} aria-hidden="true" />
              Risker
            </div>
            {referral.riskFlags.length === 0 ? (
              <div className="rounded-lg border border-[#E3D8CB] bg-[#FBF7F0] px-3 py-2 text-sm font-semibold text-[#4B5770]">
                Inga särskilda riskflaggor
              </div>
            ) : (
              <div className="space-y-2">
                {referral.riskFlags.map((flag) => (
                  <div key={flag.label} className="rounded-lg border border-[#E5A3A6] bg-[#FFF7F7] px-3 py-2 text-sm font-semibold text-[#9F1D1D]">
                    {flag.target === 'anesthesia' ? 'Anestesi: ' : ''}
                    {flag.label}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {(referral.logistics.transportLabel || referral.logistics.overflowOption) && (
          <div className="mt-3 rounded-xl border border-[#E3D8CB] bg-[#FBF7F0] p-3 text-sm text-[#4B5770]">
            {referral.logistics.transportLabel && (
              <div><span className="font-bold text-[#1A2332]">Transport:</span> {referral.logistics.transportLabel}</div>
            )}
            {referral.logistics.overflowOption && (
              <div className="mt-1">{referral.logistics.overflowOption}</div>
            )}
          </div>
        )}

      {note && (
        <div className="mt-3 rounded-xl border border-[#E3D8CB] bg-[#FBF7F0] p-3">
          <div className="text-sm font-bold text-[#1A2332]">{note.title}</div>
          <div className="mt-1 text-sm text-[#1A2332]">{note.comment}</div>
          <div className="mt-1 text-xs text-[#64748B]">
            {formatDateTime(note.createdAt)}
            {note.priority ? ` · Prioritet: ${priorityLabel(note.priority)}` : ''}
          </div>
          {note.responseComment && (
            <div className="mt-3 rounded-lg border border-[#E3D8CB] bg-white px-3 py-2">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Svar från avdelningen</div>
              <div className="mt-1 text-sm text-[#1A2332]">{note.responseComment}</div>
              {note.respondedAt && (
                <div className="mt-1 text-xs text-[#64748B]">{formatDateTime(note.respondedAt)}</div>
              )}
            </div>
          )}
        </div>
      )}

      <ReferralTimeline booking={referral.booking} note={note} events={events} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FBF7F0] px-3 py-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Nästa steg</div>
          <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.nextStep}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRequestCompletion && (
            <button
              type="button"
              onClick={() => onRequestCompletion(referral)}
              className="rounded-lg border border-[#D9CBBB] px-3 py-2 text-xs font-bold text-[#4F46E5] hover:bg-[#F7F4FF]"
            >
              Begär komplettering
            </button>
          )}
          {canPrioritize && (
            <button
              type="button"
              onClick={() => onPrioritize(referral)}
              className="rounded-lg bg-[#4F46E5] px-3 py-2 text-xs font-bold text-white hover:bg-[#4338CA]"
            >
              Prioritera / boka
            </button>
          )}
        </div>
      </div>
      </div>}
    </article>
  );
}

export default function AdminReferralQueuePage() {
  const qc = useQueryClient();
  const { hasAnyPermission, hasPermission } = useAuth();
  const canRequestCompletion = hasPermission('requestCompletion');
  const canPrioritize = hasAnyPermission(['prioritizeReferral', 'confirmElvisBooking', 'manageClinicalDecision']);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [openReferralId, setOpenReferralId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{ type: QueueActionType; referral: ReferralCase } | null>(null);
  const [comment, setComment] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<BookingPriority>('Green');
  const [bookingDate, setBookingDate] = useState(todayYmd());
  const [bookingTime, setBookingTime] = useState('09:00');
  const [localActionNotes, setLocalActionNotes] = useState(getReferralActionSnapshot);
  const [localActionEvents, setLocalActionEvents] = useState(getReferralActionEventSnapshot);
  const [demoBookings, setDemoBookings] = useState(getDemoBookings);
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const bookings = useMemo(
    () => {
      const apiBookings = bookingsQuery.data ?? [];
      return DEMO_MODE ? [...apiBookings, ...demoBookings] : apiBookings;
    },
    [bookingsQuery.data, demoBookings],
  );
  const patientMap: Record<number, PatientDto> = useMemo(
    () => Object.fromEntries((patientsQuery.data ?? []).map((patient) => [patient.patientId, patient])),
    [patientsQuery.data],
  );
  const referralMetaByBookingId = useMemo(() => getAllBookingReferralMeta(), []);
  const backendUnavailable = !DEMO_MODE && (bookingsQuery.isError || patientsQuery.isError);
  const isLoading = !DEMO_MODE && (bookingsQuery.isLoading || patientsQuery.isLoading);
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, dto, auditReason }: { id: number; dto: CreateBookingDto; auditReason?: string }) =>
      updateBooking(id, dto, { auditReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const referrals = useMemo(() => {
    return getReferralQueueSnapshot({ bookings, patientMap, referralMetaByBookingId });
  }, [bookings, patientMap, referralMetaByBookingId]);
  const referralIds = useMemo(() => referrals.map((referral) => referral.id), [referrals]);
  const actionSnapshotsQuery = useQuery({
    queryKey: ['referral-actions', referralIds],
    queryFn: () => getReferralActionSnapshotsFromApi(referralIds),
    enabled: !DEMO_MODE && referralIds.length > 0,
  });
  const actionNotes = DEMO_MODE ? localActionNotes : actionSnapshotsQuery.data?.noteMap ?? {};
  const actionEvents = DEMO_MODE ? localActionEvents : actionSnapshotsQuery.data?.eventMap ?? {};

  const filtered = referrals.filter((referral) => {
    if (filter === 'acute') return referral.priority === 'Red';
    if (filter === 'needs-completion') return referral.missingDocuments.length > 0;
    if (filter === 'anesthesia') return referral.anesthesiaAttention;
    if (filter === 'ready') return referral.missingDocuments.length === 0 && !referral.anesthesiaAttention;
    return true;
  });

  const counts = {
    all: referrals.length,
    acute: referrals.filter((referral) => referral.priority === 'Red').length,
    needsCompletion: referrals.filter((referral) => referral.missingDocuments.length > 0).length,
    anesthesia: referrals.filter((referral) => referral.anesthesiaAttention).length,
    ready: referrals.filter((referral) => referral.missingDocuments.length === 0 && !referral.anesthesiaAttention).length,
  };

  function openAction(type: QueueActionType, referral: ReferralCase) {
    setActiveAction({ type, referral });
    setComment('');
    setSelectedPriority(referral.priority);
    setBookingDate(referral.requestedStartDate || todayYmd());
    setBookingTime(defaultBookingTime(referral));
  }

  function closeAction() {
    setActiveAction(null);
    setComment('');
  }

  function confirmReferralBooking(referral: ReferralCase) {
    const confirmedDateTime = `${bookingDate}T${bookingTime}:00`;
    const updatedBooking = {
      ...referral.booking,
      date: confirmedDateTime,
      priority: selectedPriority,
      status: 'Confirmed' as const,
    };

    if (referral.booking.bookingId < 0) {
      updateDemoBooking(updatedBooking);
      setDemoBookings((current) => current.map((booking) => (
        booking.bookingId === referral.booking.bookingId ? updatedBooking : booking
      )));
      return;
    }

    updateBookingMutation.mutate({
      id: referral.booking.bookingId,
      auditReason: `Tid bekräftad. Prioritet ${selectedPriority}.`,
      dto: {
        date: confirmedDateTime,
        patientId: referral.booking.patientId,
        treatmentTypeId: referral.booking.treatmentTypeId,
        createdById: referral.booking.createdById,
        createdAt: referral.booking.createdAt,
        priority: selectedPriority,
        status: 'Confirmed',
        referralDepartment: referral.booking.referralDepartment,
        referralContactName: referral.booking.referralContactName,
        referralContactPhone: referral.booking.referralContactPhone,
      },
    });
  }

  function submitAction() {
    if (!activeAction || !comment.trim()) return;
    const confirmedDateTime = activeAction.type === 'prioritize' ? `${bookingDate}T${bookingTime}:00` : undefined;

    const note: ReferralActionNote = {
      type: activeAction.type,
      title: activeAction.type === 'completion'
        ? 'Komplettering begärd från avdelningen'
        : 'Tid bekräftad av behandlingsenheten',
      comment: comment.trim(),
      priority: activeAction.type === 'prioritize' ? selectedPriority : undefined,
      confirmedDateTime,
      createdAt: new Date().toISOString(),
    };

    if (activeAction.type === 'prioritize') {
      confirmReferralBooking(activeAction.referral);
    }

    void persistReferralAction(activeAction.referral.id, note)
      .then(() => qc.invalidateQueries({ queryKey: ['referral-actions'] }))
      .catch(() => {
        if (DEMO_MODE) {
          setLocalActionNotes(recordReferralAction(activeAction.referral.id, note));
          setLocalActionEvents(getReferralActionEventSnapshot());
        }
      });
    closeAction();
  }

  return (
    <main className="min-h-screen bg-[#F4F0EA] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Remisskö</h1>
        <p className="mt-1 text-sm text-[#8494AA]">
          Gemensam kö för behandlingsenheten: prioritering, dokumentkrav och anestesivarningar visas på samma ärende.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {[
          { key: 'all' as const, label: 'Alla', count: counts.all, icon: ClipboardCheck },
          { key: 'acute' as const, label: 'Akuta', count: counts.acute, icon: AlertTriangle },
          { key: 'needs-completion' as const, label: 'Komplettering', count: counts.needsCompletion, icon: FileWarning },
          { key: 'anesthesia' as const, label: 'Anestesi', count: counts.anesthesia, icon: ShieldAlert },
          { key: 'ready' as const, label: 'Klara för beslut', count: counts.ready, icon: ClipboardCheck },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`group relative overflow-hidden rounded-2xl border bg-[#FFFCF7] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBBBA8] hover:shadow-md ${
              filter === item.key ? 'border-[#4F46E5] shadow-sm ring-2 ring-[#4F46E5]/10' : 'border-[#E3D8CB]'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 transition-colors duration-200 ${
                filter === item.key ? 'bg-[#4F46E5]' : 'bg-transparent group-hover:bg-[#CBBBA8]'
              }`}
              aria-hidden="true"
            />
            <item.icon
              size={20}
              className={`transition-colors duration-200 ${
                filter === item.key ? 'text-[#4F46E5]' : 'text-[#8494AA] group-hover:text-[#4F46E5]'
              }`}
              aria-hidden="true"
            />
            <div className="mt-3 text-2xl font-black text-[#1A2332]">{item.count}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{item.label}</div>
          </button>
        ))}
      </div>

      {backendUnavailable && (
        <BackendErrorState
          error={bookingsQuery.error ?? patientsQuery.error}
          onRetry={() => { void bookingsQuery.refetch(); void patientsQuery.refetch(); }}
        />
      )}

      {isLoading && !backendUnavailable && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#8494AA]">
          <Spinner size={20} />
          Laddar remisskö...
        </div>
      )}

      {!backendUnavailable && !isLoading && (
        <section className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C3CEDA] bg-white px-4 py-12 text-center text-sm text-[#8494AA]">
              Inga remisser matchar filtret.
            </div>
          ) : (
            filtered.map((referral) => (
              <QueueCard
                key={referral.id}
                referral={referral}
                note={actionNotes[referral.id]}
                events={actionEvents[referral.id]}
                isOpen={openReferralId === referral.id}
                onToggle={() => setOpenReferralId((current) => current === referral.id ? null : referral.id)}
                onRequestCompletion={(item) => openAction('completion', item)}
                onPrioritize={(item) => openAction('prioritize', item)}
                canRequestCompletion={canRequestCompletion}
                canPrioritize={canPrioritize}
              />
            ))
          )}
        </section>
      )}

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#E3D8CB] bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Remissåtgärd</div>
              <h2 className="mt-1 text-xl font-bold text-[#1A2332]">
                {activeAction.type === 'completion' ? 'Begär komplettering' : 'Prioritera / boka'}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {activeAction.type === 'completion'
                  ? 'Skriv vad avdelningen behöver komplettera innan behandlingsenheten kan gå vidare.'
                  : 'Dokumentera behandlingsenhetens prioritering och nästa beslut för ärendet.'}
              </p>
            </div>

            <div className="rounded-xl border border-[#E3D8CB] bg-[#FBF7F0] p-4 text-sm">
              <div className="font-bold text-[#1A2332]">{activeAction.referral.patient.fullName}</div>
              <div className="font-mono text-xs text-[#64748B]">{activeAction.referral.patient.socialSecurityNumber}</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                  <div className="font-semibold text-[#1A2332]">{activeAction.referral.treatmentLabel}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning</div>
                  <div className="font-semibold text-[#1A2332]">{activeAction.referral.department}</div>
                </div>
              </div>
            </div>

            {activeAction.type === 'prioritize' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1A2332]">Prioritet</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['Green', 'Yellow', 'Red'] as const).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setSelectedPriority(priority)}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                          selectedPriority === priority
                            ? priorityBadge(priority)
                            : 'border-[#E3D8CB] bg-white text-[#4B5770] hover:bg-[#FBF7F0]'
                        }`}
                      >
                        {priorityLabel(priority)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-[#1A2332]" htmlFor="confirmed-date">
                      Bekräftat datum
                    </label>
                    <input
                      id="confirmed-date"
                      type="date"
                      value={bookingDate}
                      onChange={(event) => setBookingDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#E3D8CB] px-3 py-2 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1A2332]" htmlFor="confirmed-time">
                      Bekräftad tid
                    </label>
                    <select
                      id="confirmed-time"
                      value={bookingTime}
                      onChange={(event) => setBookingTime(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#E3D8CB] px-3 py-2 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
                    >
                      {(isEctType(activeAction.referral.booking.treatmentTypeId)
                        ? ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45']
                        : ['13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30']
                      ).map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <label className="mt-4 block text-sm font-bold text-[#1A2332]" htmlFor="queue-action-comment">
              Kommentar *
            </label>
            <textarea
              id="queue-action-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder={activeAction.type === 'completion'
                ? 'Exempel: Hälsodeklaration och läkemedelslista behöver kompletteras innan prioritering.'
                : 'Exempel: Prioriteras som akut. Anestesi ska kontaktas före behandling.'}
              className="mt-2 w-full rounded-xl border border-[#E3D8CB] p-3 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
            />
            {!comment.trim() && (
              <p className="mt-2 text-xs font-semibold text-[#C42B2B]">
                Kommentar krävs innan åtgärden kan sparas.
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeAction}
                className="rounded-lg border border-[#E3D8CB] px-4 py-2 text-sm font-semibold text-[#4B5770] hover:bg-[#F0F4F8]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={!comment.trim() || (activeAction.type === 'prioritize' && (!bookingDate || !bookingTime))}
                className="rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {activeAction.type === 'completion' ? 'Skicka till avdelningen' : 'Bekräfta tid till avdelningen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

