import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ClipboardCheck, FileWarning, ShieldAlert } from 'lucide-react';
import { getBookings, updateBooking } from '../api/bookings';
import { getPatients } from '../api/patients';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import ReferralWorkspace from '../components/referral/ReferralWorkspace';
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
import { useAuth } from '../context/useAuth';
import { maskPersonnummer } from '../utils/personnummer';

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

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function defaultBookingTime(referral: ReferralCase) {
  return isEctType(referral.booking.treatmentTypeId) ? '09:00' : '13:00';
}

export default function AdminReferralQueuePage() {
  const qc = useQueryClient();
  const { hasAnyPermission, hasPermission } = useAuth();
  const canRequestCompletion = hasPermission('requestCompletion');
  const canPrioritize = hasAnyPermission(['prioritizeReferral', 'manageClinicalDecision']);
  const canConfirmTime = hasPermission('confirmElvisBooking');
  const canBookOrPrioritize = canPrioritize || canConfirmTime;
  const prioritizeLabel = canPrioritize ? 'Prioritera / boka' : 'Bekräfta tid';
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [activeAction, setActiveAction] = useState<{ type: QueueActionType; referral: ReferralCase } | null>(null);
  const [comment, setComment] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<BookingPriority>('Green');
  const [bookingDate, setBookingDate] = useState(todayYmd());
  const [bookingTime, setBookingTime] = useState('09:00');
  const [localActionNotes, setLocalActionNotes] = useState<ReturnType<typeof getReferralActionSnapshot>>(
    () => DEMO_MODE ? getReferralActionSnapshot() : {},
  );
  const [localActionEvents, setLocalActionEvents] = useState<ReturnType<typeof getReferralActionEventSnapshot>>(
    () => DEMO_MODE ? getReferralActionEventSnapshot() : {},
  );
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
  const referralMetaByBookingId = useMemo(() => getAllBookingReferralMeta(DEMO_MODE), []);
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
    if (activeAction.type === 'completion' && !canRequestCompletion) return;
    if (activeAction.type === 'prioritize' && !canBookOrPrioritize) return;

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
    <main className="min-h-screen bg-[#F3F6FA] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Remisskö</h1>
        <p className="mt-1 text-sm text-[#8494AA]">
          Välj en patient i listan. Granska underlag, logistik och historik utan att lämna remisskön.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
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
            onClick={() => {
              setFilter(item.key);
            }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition-colors ${
              filter === item.key ? 'border-[#1A4F8A] bg-[#EFF6FF] text-[#185FA5]' : 'border-[#DDE3EC] bg-white text-[#4B5770] hover:bg-[#F8FAFC]'
            }`}
          >
            <item.icon
              size={16}
              aria-hidden="true"
            />
            <span>{item.label}</span>
            <span className="rounded-full bg-[#F0F4F8] px-2 py-0.5 text-xs text-[#1A2332]">{item.count}</span>
          </button>
        ))}
        </div>
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
        <ReferralWorkspace
          referrals={filtered}
          notes={actionNotes}
          events={actionEvents}
          canRequestCompletion={canRequestCompletion}
          canBookOrPrioritize={canBookOrPrioritize}
          prioritizeLabel={prioritizeLabel}
          onRequestCompletion={item => openAction('completion', item)}
          onPrioritize={item => openAction('prioritize', item)}
        />
      )}

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#E3D8CB] bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Remissåtgärd</div>
              <h2 className="mt-1 text-xl font-bold text-[#1A2332]">
                {activeAction.type === 'completion' ? 'Begär komplettering' : prioritizeLabel}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {activeAction.type === 'completion'
                  ? 'Skriv vad avdelningen behöver komplettera innan behandlingsenheten kan gå vidare.'
                  : 'Dokumentera behandlingsenhetens prioritering och nästa beslut för ärendet.'}
              </p>
            </div>

            <div className="rounded-xl border border-[#E3D8CB] bg-[#FBF7F0] p-4 text-sm">
              <div className="font-bold text-[#1A2332]">{activeAction.referral.patient.fullName}</div>
              <div className="font-mono text-xs text-[#64748B]">{maskPersonnummer(activeAction.referral.patient.socialSecurityNumber)}</div>
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
                        disabled={!canPrioritize}
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

