import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CalendarCheck, ClipboardCheck, MapPin, PauseCircle, ShieldAlert, XCircle } from 'lucide-react';
import { getBookings, updateBooking, getTreatmentUnits, assignTreatmentUnit } from '../api/bookings';
import { getPatients } from '../api/patients';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import ReferralTimeline from '../components/referral/ReferralTimeline';
import { DEMO_MODE } from '../config/demo';
import { getAllowedPortalMode } from '../config/portal';
import { useAuth } from '../context/useAuth';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings, updateDemoBooking } from '../utils/demoBookings';
import { buildReferralCases, type ReferralCase } from '../utils/referralCases';
import type { BookingPriority, CreateBookingDto } from '../types';
import {
  getReferralActionSnapshot,
  getReferralActionEventSnapshot,
  getReferralActionSnapshotsFromApi,
  persistReferralAction,
  persistReferralCompletionResponse,
  recordReferralAction,
  recordReferralCompletionResponse,
} from '../repositories/referralActionRepository';
import type { ReferralActionNote, ReferralActionType } from '../utils/referralActions';
import { maskPersonnummer } from '../utils/personnummer';

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function priorityLabel(referral: ReferralCase) {
  if (referral.priority === 'Red') return 'Röd - akut';
  if (referral.priority === 'Yellow') return 'Gul - halvakut/bevakning';
  return 'Grön - elektiv';
}

function priorityClass(referral: ReferralCase) {
  if (referral.priority === 'Red') return 'border-[#E5A3A6] bg-[#FDEAEA] text-[#9F1D1D]';
  if (referral.priority === 'Yellow') return 'border-[#E6C77A] bg-[#FFF0CC] text-[#875100]';
  return 'border-[#A9D8BE] bg-[#E8F7F1] text-[#0F6840]';
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#1A2332]">{value}</div>
    </div>
  );
}

type DetailActionType = ReferralActionType | 'completion-response';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function defaultBookingTime(referral: ReferralCase) {
  return referral.treatmentTrack === 'ECT' ? '09:00' : '13:00';
}

export default function ReferralDetailPage() {
  const { referralId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAdmin, hasPermission, hasAnyPermission } = useAuth();
  const [receivingUnit, setReceivingUnit] = useState('');
  const treatmentUnits = useQuery({queryKey:['treatment-units'], queryFn:getTreatmentUnits, enabled:isAdmin});
  const assignment = useMutation({mutationFn: ({id, unit}: {id:number; unit:string}) => assignTreatmentUnit(id,unit), onSuccess:()=>qc.invalidateQueries({queryKey:['bookings']})});
  const portalMode = getAllowedPortalMode(user?.role);
  const canRequestCompletion = hasPermission('requestCompletion');
  const canPrioritize = hasAnyPermission(['prioritizeReferral', 'manageClinicalDecision']);
  const canConfirmTime = hasPermission('confirmElvisBooking');
  const canBookOrPrioritize = canPrioritize || canConfirmTime;
  const canRecordPatientAction = hasPermission('recordPatientAction');
  const [actionNotesByReferralId, setActionNotesByReferralId] = useState<ReturnType<typeof getReferralActionSnapshot>>(
    () => DEMO_MODE ? getReferralActionSnapshot() : {},
  );
  const [actionEventsByReferralId, setActionEventsByReferralId] = useState<ReturnType<typeof getReferralActionEventSnapshot>>(
    () => DEMO_MODE ? getReferralActionEventSnapshot() : {},
  );
  const [demoBookings, setDemoBookings] = useState(getDemoBookings);
  const [activeAction, setActiveAction] = useState<DetailActionType | null>(null);
  const [comment, setComment] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<BookingPriority>('Green');
  const [bookingDate, setBookingDate] = useState(todayYmd());
  const [bookingTime, setBookingTime] = useState('09:00');
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const bookings = useMemo(
    () => DEMO_MODE ? [...(bookingsQuery.data ?? []), ...demoBookings] : bookingsQuery.data ?? [],
    [bookingsQuery.data, demoBookings],
  );
  const patientMap = useMemo(
    () => Object.fromEntries((patientsQuery.data ?? []).map((patient) => [patient.patientId, patient])),
    [patientsQuery.data],
  );
  const referralMetaByBookingId = useMemo(() => getAllBookingReferralMeta(DEMO_MODE), []);
  const backendUnavailable = bookingsQuery.isError || patientsQuery.isError;
  const isLoading = bookingsQuery.isLoading || patientsQuery.isLoading;
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, dto, auditReason }: { id: number; dto: CreateBookingDto; auditReason?: string }) =>
      updateBooking(id, dto, { auditReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const referral = useMemo(() => {
    return buildReferralCases(bookings, patientMap, referralMetaByBookingId)
      .find((item) => item.id === referralId);
  }, [bookings, patientMap, referralMetaByBookingId, referralId]);

  const actionSnapshotsQuery = useQuery({
    queryKey: ['referral-actions', referral?.id],
    queryFn: () => getReferralActionSnapshotsFromApi(referral ? [referral.id] : []),
    enabled: !DEMO_MODE && !!referral,
  });
  const backendActionNotes = actionSnapshotsQuery.data?.noteMap;
  const backendActionEvents = actionSnapshotsQuery.data?.eventMap;
  const actionNote = referral
    ? (DEMO_MODE ? actionNotesByReferralId[referral.id] : backendActionNotes?.[referral.id])
    : undefined;
  const actionEvents = referral
    ? (DEMO_MODE ? actionEventsByReferralId[referral.id] ?? [] : backendActionEvents?.[referral.id] ?? [])
    : [];
  const latestActionEvent = actionEvents.length > 0
    ? [...actionEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : actionNote;

  function openAction(type: DetailActionType, currentReferral: ReferralCase) {
    setActiveAction(type);
    setComment('');
    setSelectedPriority(currentReferral.priority);
    setBookingDate(currentReferral.requestedStartDate || todayYmd());
    setBookingTime(defaultBookingTime(currentReferral));
  }

  function closeAction() {
    setActiveAction(null);
    setComment('');
  }

  function updateReferralBooking(currentReferral: ReferralCase, status = currentReferral.booking.status, auditReason?: string) {
    const confirmedDateTime = `${bookingDate}T${bookingTime}:00`;
    const updatedBooking = {
      ...currentReferral.booking,
      date: activeAction === 'prioritize' ? confirmedDateTime : currentReferral.booking.date,
      priority: activeAction === 'prioritize' ? selectedPriority : currentReferral.priority,
      status,
    };

    if (currentReferral.booking.bookingId < 0) {
      updateDemoBooking(updatedBooking);
      setDemoBookings((current) => current.map((booking) => (
        booking.bookingId === currentReferral.booking.bookingId ? updatedBooking : booking
      )));
      return;
    }

    updateBookingMutation.mutate({
      id: currentReferral.booking.bookingId,
      auditReason,
      dto: {
        date: updatedBooking.date,
        patientId: updatedBooking.patientId,
        treatmentTypeId: updatedBooking.treatmentTypeId,
        createdById: updatedBooking.createdById,
        createdAt: updatedBooking.createdAt,
        priority: updatedBooking.priority,
        status: updatedBooking.status,
        referralDepartment: updatedBooking.referralDepartment,
        referralContactName: updatedBooking.referralContactName,
        referralContactPhone: updatedBooking.referralContactPhone,
      },
    });
  }

  function actionTitle(type: DetailActionType) {
    if (type === 'completion') return 'Komplettering begärd från avdelningen';
    if (type === 'completion-response') return 'Komplettering skickad från avdelningen';
    if (type === 'prioritize') return 'Tid bekräftad av behandlingsenheten';
    if (type === 'pause') return 'Behandling pausad av avdelningen';
    if (type === 'cancel') return 'Tid avbokad av avdelningen';
    return 'Behandling avslutad av avdelningen';
  }

  function submitAction() {
    if (!referral || !activeAction || !comment.trim()) return;
    if (activeAction === 'completion' && !canRequestCompletion) return;
    if (activeAction === 'prioritize' && !canBookOrPrioritize) return;
    if (['completion-response', 'pause', 'cancel', 'end'].includes(activeAction) && !canRecordPatientAction) return;

    if (activeAction === 'completion-response') {
      void persistReferralCompletionResponse(referral.id, comment.trim())
        .then(() => qc.invalidateQueries({ queryKey: ['referral-actions'] }))
        .catch(() => {
          if (DEMO_MODE) {
            setActionNotesByReferralId(recordReferralCompletionResponse(referral.id, comment.trim()));
            setActionEventsByReferralId(getReferralActionEventSnapshot());
          }
        });
      closeAction();
      return;
    }

    if (DEMO_MODE && activeAction === 'prioritize') updateReferralBooking(referral, 'Confirmed', comment.trim());
    if (DEMO_MODE && activeAction === 'cancel') updateReferralBooking(referral, 'Cancelled', comment.trim());

    const note: ReferralActionNote = {
      type: activeAction,
      title: actionTitle(activeAction),
      comment: comment.trim(),
      priority: activeAction === 'prioritize' ? selectedPriority : undefined,
      confirmedDateTime: activeAction === 'prioritize' ? `${bookingDate}T${bookingTime}:00` : undefined,
      createdAt: new Date().toISOString(),
    };

    void persistReferralAction(referral.id, note)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ['referral-actions'] });
        void qc.invalidateQueries({ queryKey: ['bookings'] });
      })
      .catch(() => {
        if (DEMO_MODE) {
          setActionNotesByReferralId(recordReferralAction(referral.id, note));
          setActionEventsByReferralId(getReferralActionEventSnapshot());
        }
      });
    closeAction();
  }

  function actionHeading(type: DetailActionType) {
    if (type === 'completion') return 'Begär komplettering';
    if (type === 'completion-response') return 'Komplettera remiss';
    if (type === 'prioritize') return 'Prioritera och bekräfta tid';
    if (type === 'pause') return 'Pausa behandling';
    if (type === 'cancel') return 'Avboka tid';
    return 'Avsluta behandling';
  }

  return (
    <main className="min-h-screen bg-[#F3F6FA] p-6">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#DDE3EC] bg-white px-3 py-2 text-sm font-semibold text-[#4B5770] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Tillbaka
        </button>
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
          Laddar remiss...
        </div>
      )}

      {!backendUnavailable && !isLoading && !referral && (
        <section className="rounded-2xl border border-[#DDE3EC] bg-white p-10 text-center shadow-sm">
          <div className="text-lg font-bold text-[#1A2332]">Remissen hittades inte</div>
          <p className="mt-2 text-sm text-[#8494AA]">Ärendet kan ha tagits bort eller saknas i demo-data.</p>
          <Link to="/admin-referrals" className="mt-4 inline-flex rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-bold text-white">
            Öppna remisskö
          </Link>
        </section>
      )}

      {!backendUnavailable && !isLoading && referral && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Remissdetalj</div>
                <h1 className="mt-1 text-2xl font-bold text-[#1A2332]">{referral.patient.fullName}</h1>
                <div className="mt-1 font-mono text-sm text-[#64748B]">{maskPersonnummer(referral.patient.socialSecurityNumber)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClass(referral)}`}>
                  {priorityLabel(referral)}
                </span>
                <span className="rounded-full border border-[#93C5FD] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#185FA5]">
                  {referral.statusLabel}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <InfoBlock label="Behandling" value={referral.treatmentLabel} />
              <InfoBlock label="Önskad start/tid" value={formatDateTime(referral.booking.date)} />
              <InfoBlock label="Avdelning" value={referral.department} />
              <InfoBlock label="Tilldelad behandlingsenhet" value={referral.booking.treatmentUnitId ?? 'Ej tilldelad'} />
              {isAdmin && <div>
                <label htmlFor="assign-treatment-unit">Tilldela behandlingsenhet</label>
                <select id="assign-treatment-unit" value={receivingUnit} onChange={e=>setReceivingUnit(e.target.value)} className="block w-full rounded border p-2">
                  <option value="">Välj behandlingsenhet</option>
                  {(treatmentUnits.data ?? []).map(id=><option key={id} value={id}>{id}</option>)}
                </select>
                <button disabled={!receivingUnit || assignment.isPending} onClick={()=>assignment.mutate({id:referral.booking.bookingId,unit:receivingUnit})}>Spara tilldelning</button>
                {assignment.isError && <p role="alert">Tilldelningen kunde inte sparas.</p>}
              </div>}
              <InfoBlock label="Kontakt" value={`${referral.contactName}${referral.contactPhone ? `, ${referral.contactPhone}` : ''}`} />
            </div>

            <div className="mt-5 rounded-2xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
              <div className="mb-3">
                <div className="text-sm font-bold text-[#1A2332]">
                  {portalMode === 'admin' ? 'Åtgärder för behandlingsenheten' : 'Åtgärder för avdelningen'}
                </div>
                <p className="mt-1 text-sm text-[#64748B]">
                  {portalMode === 'admin'
                    ? 'Här kan behandlingsenheten begära komplettering eller bekräfta tid.'
                    : 'Här kan avdelningen komplettera, pausa, avboka eller avsluta med kommentar.'}
                </p>
              </div>

              {portalMode === 'admin' ? (
                <div className="flex flex-wrap gap-2">
                  {canRequestCompletion && (
                    <button
                      type="button"
                      onClick={() => openAction('completion', referral)}
                      className="rounded-lg border border-[#C9D6E6] bg-white px-3 py-2 text-sm font-bold text-[#185FA5] hover:bg-[#EFF6FF]"
                    >
                      Begär komplettering
                    </button>
                  )}
                  {canBookOrPrioritize && (
                    <button
                      type="button"
                      onClick={() => openAction('prioritize', referral)}
                      className="rounded-lg bg-[#185FA5] px-3 py-2 text-sm font-bold text-white hover:bg-[#124F8A]"
                    >
                      {canPrioritize ? 'Prioritera / bekräfta tid' : 'Bekräfta tid'}
                    </button>
                  )}
                  {!canRequestCompletion && !canBookOrPrioritize && (
                    <p className="text-sm font-semibold text-[#64748B]">
                      Din roll kan läsa ärendet, men har inga beslutsåtgärder här.
                    </p>
                  )}
                </div>
              ) : canRecordPatientAction ? (
                <div className="flex flex-wrap gap-2">
                  {actionNote?.type === 'completion' && !actionNote.responseComment && (
                    <button
                      type="button"
                      onClick={() => openAction('completion-response', referral)}
                      className="rounded-lg bg-[#185FA5] px-3 py-2 text-sm font-bold text-white hover:bg-[#124F8A]"
                    >
                      Komplettera remiss
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openAction('pause', referral)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E6C77A] bg-[#FFF0CC] px-3 py-2 text-sm font-bold text-[#875100] hover:bg-[#FFE8AD]"
                  >
                    <PauseCircle size={16} aria-hidden="true" />
                    Pausa
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction('cancel', referral)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E5A3A6] bg-[#FDEAEA] px-3 py-2 text-sm font-bold text-[#9F1D1D] hover:bg-[#FBDADA]"
                  >
                    <XCircle size={16} aria-hidden="true" />
                    Avboka tid
                  </button>
                  <button
                    type="button"
                    onClick={() => openAction('end', referral)}
                    className="rounded-lg border border-[#C9D6E6] bg-white px-3 py-2 text-sm font-bold text-[#4B5770] hover:bg-[#F0F4F8]"
                  >
                    Avsluta behandling
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[#64748B]">
                  Din roll kan läsa ärendet, men kan inte ändra patientens behandling.
                </p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1A2332]">
                <ClipboardCheck size={20} aria-hidden="true" />
                Dokument och underlag
              </div>
              <div className="space-y-2">
                {referral.documents.map((document) => (
                  <div
                    key={document.label}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                      document.complete
                        ? 'border-[#A9D8BE] bg-[#E8F7F1]'
                        : 'border-[#E6C77A] bg-[#FFF0CC]'
                    }`}
                  >
                    <span className="font-semibold text-[#1A2332]">{document.label}</span>
                    <span className={`text-xs font-bold ${document.complete ? 'text-[#0F6840]' : 'text-[#875100]'}`}>
                      {document.complete ? 'Klar' : 'Saknas'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1A2332]">
                <MapPin size={20} aria-hidden="true" />
                Enhet och logistik
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoBlock label="Föreslagen enhet" value={referral.logistics.recommendedUnit.name} />
                <InfoBlock label="Patientflöde" value={referral.logistics.patientFlow} />
                <InfoBlock label="Vårdplats" value={referral.logistics.sourceSite} />
                <InfoBlock label="Transport" value={referral.logistics.requiresTransport ? 'Behöver planeras' : 'Ingen transportflagga'} />
              </div>
              <p className="mt-4 rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-2 text-sm text-[#4B5770]">
                {referral.logistics.logisticsNote}
              </p>
              {referral.logistics.transportLabel && (
                <p className="mt-3 rounded-xl border border-[#E6C77A] bg-[#FFF0CC] px-3 py-2 text-sm font-bold text-[#875100]">
                  Transportflagga: {referral.logistics.transportLabel}
                </p>
              )}
            </div>
          </section>

          {referral.riskFlags.length > 0 && (
            <section className="rounded-2xl border border-[#E5A3A6] bg-[#FDEAEA] p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-lg font-bold text-[#9F1D1D]">
                <ShieldAlert size={20} aria-hidden="true" />
                Riskflaggor
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {referral.riskFlags.map((flag) => (
                  <div key={flag.label} className="rounded-xl border border-[#E5A3A6] bg-white px-3 py-2 text-sm font-semibold text-[#9F1D1D]">
                    {flag.target === 'anesthesia' ? 'Anestesi: ' : ''}
                    {flag.label}
                  </div>
                ))}
              </div>
            </section>
          )}

          {latestActionEvent && (
            <section className="rounded-2xl border border-[#93C5FD] bg-[#EFF6FF] p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-lg font-bold text-[#185FA5]">
                <AlertTriangle size={20} aria-hidden="true" />
                Senaste åtgärd
              </div>
              <div className="text-sm font-bold text-[#1A2332]">{latestActionEvent.title}</div>
              <p className="mt-1 text-sm text-[#4B5770]">{latestActionEvent.comment}</p>
              {actionNote?.responseComment && (
                <div className="mt-3 rounded-xl border border-[#A9D8BE] bg-[#E8F7F1] px-3 py-2">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#0F6840]">Svar från avdelningen</div>
                  <div className="mt-1 text-sm text-[#1A2332]">{actionNote.responseComment}</div>
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-lg font-bold text-[#1A2332]">
              <CalendarCheck size={20} aria-hidden="true" />
              Nästa steg
            </div>
            <p className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#1A2332]">
              {referral.nextStep}
            </p>
            <ReferralTimeline booking={referral.booking} note={actionNote} events={actionEvents} />
          </section>

          {activeAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
              <div className="w-full max-w-xl rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-2xl">
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Remissåtgärd</div>
                  <h2 className="mt-1 text-xl font-bold text-[#1A2332]">{actionHeading(activeAction)}</h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Kommentaren sparas i ärendet så nästa person ser varför åtgärden gjordes.
                  </p>
                </div>

                <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4 text-sm">
                  <div className="font-bold text-[#1A2332]">{referral.patient.fullName}</div>
                  <div className="font-mono text-xs text-[#64748B]">{maskPersonnummer(referral.patient.socialSecurityNumber)}</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoBlock label="Behandling" value={referral.treatmentLabel} />
                    <InfoBlock label="Enhet" value={referral.logistics.recommendedUnit.name} />
                  </div>
                </div>

                {activeAction === 'prioritize' && (
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
                                ? priorityClass({ ...referral, priority })
                                : 'border-[#DDE3EC] bg-white text-[#4B5770] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            {priority === 'Red' ? 'Akut' : priority === 'Yellow' ? 'Halvakut' : 'Elektiv'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-bold text-[#1A2332]" htmlFor="detail-confirmed-date">
                          Bekräftat datum
                        </label>
                        <input
                          id="detail-confirmed-date"
                          type="date"
                          value={bookingDate}
                          onChange={(event) => setBookingDate(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[#DDE3EC] px-3 py-2 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#1A2332]" htmlFor="detail-confirmed-time">
                          Bekräftad tid
                        </label>
                        <input
                          id="detail-confirmed-time"
                          type="time"
                          value={bookingTime}
                          onChange={(event) => setBookingTime(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-[#DDE3EC] px-3 py-2 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <label className="mt-4 block text-sm font-bold text-[#1A2332]" htmlFor="detail-action-comment">
                  Kommentar *
                </label>
                <textarea
                  id="detail-action-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="Skriv orsak, beslut eller vad som behöver kompletteras."
                  className="mt-2 w-full rounded-xl border border-[#DDE3EC] p-3 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
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
                    className="rounded-lg border border-[#DDE3EC] px-4 py-2 text-sm font-semibold text-[#4B5770] hover:bg-[#F0F4F8]"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={submitAction}
                    disabled={!comment.trim() || (activeAction === 'prioritize' && (!bookingDate || !bookingTime))}
                    className="rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124F8A] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Spara åtgärd
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
