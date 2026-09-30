import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import BackendErrorState from '../components/common/BackendErrorState';
import ReferralTimeline from '../components/referral/ReferralTimeline';
import Spinner from '../components/common/Spinner';
import { DEMO_MODE } from '../config/demo';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings } from '../utils/demoBookings';
import { getAllDepartmentPriorities, saveDepartmentPriority } from '../utils/departmentPriority';
import {
  getReferralActionSnapshotsFromApi,
  getReferralActionSnapshot,
  persistReferralCompletionResponse,
  recordReferralCompletionResponse,
} from '../repositories/referralActionRepository';
import { getDepartmentReferralSnapshot } from '../repositories/referralRepository';
import { isEctType } from '../types';
import { rtmsSessionPlanLabel } from '../utils/rtmsTreatmentPlan';
import { useAuth } from '../context/useAuth';

function statusBadge(status: string, priority: string) {
  if (status === 'Cancelled') return 'border-[#E5A3A6] bg-[#FDEAEA] text-[#9F1D1D]';
  if (priority === 'Red') return 'border-[#E5A3A6] bg-[#FDEAEA] text-[#9F1D1D]';
  if (priority === 'Yellow') return 'border-[#E6C77A] bg-[#FFF0CC] text-[#875100]';
  return 'border-[#93C5FD] bg-[#EFF6FF] text-[#185FA5]';
}

function statusLabel(status: string, priority: string) {
  if (status === 'Cancelled') return 'Avbokad';
  if (priority === 'Red') return 'Akut - väntar prioritering';
  if (priority === 'Yellow') return 'Väntar bedömning';
  return 'Väntar på bekräftelse';
}

function formatSentAt(date: string) {
  return new Date(date).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionNoteBadge(type: string) {
  if (type === 'completion') return 'border-[#E6C77A] bg-[#FFF0CC] text-[#875100]';
  return 'border-[#93C5FD] bg-[#EFF6FF] text-[#185FA5]';
}

export default function DepartmentReferralsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canSetDepartmentPriority = hasPermission('setDepartmentPriority');
  const [actionNotesByReferralId, setActionNotesByReferralId] = useState(getReferralActionSnapshot);
  const [departmentPriorities, setDepartmentPriorities] = useState(getAllDepartmentPriorities);
  const [activeCompletion, setActiveCompletion] = useState<{ referralId: string; patientName: string } | null>(null);
  const [completionComment, setCompletionComment] = useState('');
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const bookings = DEMO_MODE ? [...(bookingsQuery.data ?? []), ...getDemoBookings()] : bookingsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const patientMap = Object.fromEntries(patients.map((patient) => [patient.patientId, patient]));
  const referralMetaByBookingId = getAllBookingReferralMeta();
  const backendUnavailable = !DEMO_MODE && (bookingsQuery.isError || patientsQuery.isError);
  const isLoading = !DEMO_MODE && (bookingsQuery.isLoading || patientsQuery.isLoading);
  const referrals = getDepartmentReferralSnapshot({ bookings, patientMap, referralMetaByBookingId });
  const referralIds = referrals.map((referral) => referral.id);
  const actionSnapshotsQuery = useQuery({
    queryKey: ['referral-actions', referralIds],
    queryFn: () => getReferralActionSnapshotsFromApi(referralIds),
    enabled: !DEMO_MODE && referralIds.length > 0,
  });
  const effectiveActionNotesByReferralId = DEMO_MODE ? actionNotesByReferralId : actionSnapshotsQuery.data?.noteMap ?? {};

  function updateDepartmentPriority(bookingId: number, priority?: number) {
    setDepartmentPriorities(saveDepartmentPriority(bookingId, priority));
  }

  function openCompletionResponse(referralId: string, patientName: string) {
    setActiveCompletion({ referralId, patientName });
    setCompletionComment('');
  }

  function closeCompletionResponse() {
    setActiveCompletion(null);
    setCompletionComment('');
  }

  function submitCompletionResponse() {
    if (!activeCompletion || !completionComment.trim()) return;
    void persistReferralCompletionResponse(activeCompletion.referralId, completionComment.trim())
      .then(() => void actionSnapshotsQuery.refetch())
      .catch(() => {
        if (DEMO_MODE) {
          setActionNotesByReferralId(recordReferralCompletionResponse(activeCompletion.referralId, completionComment.trim()));
        }
      });
    closeCompletionResponse();
  }

  return (
    <main className="min-h-screen bg-[#F3F6FA] p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Mina patienter</h1>
          <p className="mt-1 text-sm text-[#8494AA]">
            Här ser avdelningen aktuella ECT/rTMS-patienter, remisser, intern ECT-prioritet och bekräftade nästa steg.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/referral')}
          className="rounded-lg bg-[#185FA5] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#185FA5]/20 hover:bg-[#124F8A]"
        >
          + Förbered ny remiss
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
          Laddar remisser...
        </div>
      )}

      {!backendUnavailable && !isLoading && (
        <section className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          {referrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-10 text-center">
              <ClipboardList className="mx-auto text-[#8494AA]" size={30} />
              <div className="mt-3 text-sm font-bold text-[#1A2332]">Inga remisser väntar just nu</div>
              <p className="mt-1 text-sm text-[#8494AA]">Skapa en ny remiss när en patient behöver ECT eller rTMS.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => {
                const { booking, patient } = referral;
                const referralId = referral.id;
                const actionNote = effectiveActionNotesByReferralId[referralId];
                const patientName = patient.fullName;

                return (
                  <article key={booking.bookingId} className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/referrals/${referralId}`}
                          className="text-base font-bold text-[#1A2332] hover:text-[#185FA5] hover:underline"
                        >
                          {patientName}
                        </Link>
                        <div className="mt-0.5 text-xs font-mono text-[#8494AA]">{patient.socialSecurityNumber}</div>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadge(booking.status, booking.priority)}`}>
                        {statusLabel(booking.status, booking.priority)}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Skickad</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{formatSentAt(booking.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Önskad start</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{booking.date.slice(0, 10)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.treatmentLabel}</div>
                        {referral.rtmsSessionPlan && (
                          <div className="mt-1">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${
                              referral.rtmsSessionPlan === 'double'
                                ? 'border-[#C4B5FD] bg-[#F7F4FF] text-[#4F46E5]'
                                : 'border-[#A7D8CE] bg-[#F2FAF8] text-[#0F766E]'
                            }`}>
                              rTMS {rtmsSessionPlanLabel(referral.rtmsSessionPlan)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.department}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Nästa steg</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">ECT/rTMS-enheten prioriterar och bekräftar tid.</div>
                      </div>
                    </div>
                    {isEctType(booking.treatmentTypeId) && canSetDepartmentPriority && (
                      <div className="mt-4 rounded-xl border border-[#E3D8CB] bg-[#FFFCF7] px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">
                              Avdelningens interna ECT-prioritet
                            </div>
                            <div className="mt-1 text-sm text-[#4B5770]">
                              Används när avdelningen har flera aktuella ECT-kandidater. ECT-enheten ser ordningen, men bekräftar tid utifrån plats och medicinsk bedömning.
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3].map((priority) => {
                              const isSelected = departmentPriorities[booking.bookingId] === priority;
                              return (
                                <button
                                  key={priority}
                                  type="button"
                                  onClick={() => updateDepartmentPriority(booking.bookingId, priority)}
                                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'border-[#4F46E5] bg-[#F7F4FF] text-[#4F46E5] shadow-sm'
                                      : 'border-[#E3D8CB] bg-white text-[#4B5770] hover:border-[#CBBBA8] hover:bg-[#FBF7F0]'
                                  }`}
                                >
                                  Prio {priority}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => updateDepartmentPriority(booking.bookingId)}
                              className="rounded-lg border border-[#E3D8CB] bg-white px-3 py-2 text-xs font-bold text-[#64748B] hover:border-[#CBBBA8] hover:bg-[#FBF7F0]"
                            >
                              Ingen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={`mt-4 rounded-xl border px-4 py-3 ${
                      referral.logistics.requiresTransport
                        ? 'border-[#E6C77A] bg-[#FFF0CC]'
                        : 'border-[#DDE3EC] bg-white'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Planerad behandlingsenhet</div>
                      <div className="mt-1 text-sm font-bold text-[#1A2332]">{referral.logistics.recommendedUnit.name}</div>
                      <div className="mt-1 text-sm text-[#4B5770]">{referral.logistics.logisticsNote}</div>
                      {referral.logistics.transportLabel && (
                        <div className="mt-2 text-sm font-bold text-[#875100]">
                          Transport behöver planeras: {referral.logistics.transportLabel}
                        </div>
                      )}
                    </div>
                    {actionNote && (
                      <div className={`mt-4 rounded-xl border px-4 py-3 ${actionNoteBadge(actionNote.type)}`}>
                        <div className="text-sm font-bold">{actionNote.title}</div>
                        <div className="mt-1 text-sm text-[#1A2332]">{actionNote.comment}</div>
                        <div className="mt-1 text-xs opacity-80">
                          {formatSentAt(actionNote.createdAt)}
                          {actionNote.priority ? ` · Prioritet uppdaterad` : ''}
                        </div>
                        {actionNote.responseComment && (
                          <div className="mt-3 rounded-lg border border-[#A9D8BE] bg-[#E8F7F1] px-3 py-2">
                            <div className="text-xs font-bold uppercase tracking-wide text-[#0F6840]">Avdelningens svar</div>
                            <div className="mt-1 text-sm text-[#1A2332]">{actionNote.responseComment}</div>
                            {actionNote.respondedAt && (
                              <div className="mt-1 text-xs text-[#0F6840]">{formatSentAt(actionNote.respondedAt)}</div>
                            )}
                          </div>
                        )}
                        {actionNote.type === 'completion' && !actionNote.responseComment && (
                          <button
                            type="button"
                            onClick={() => openCompletionResponse(referralId, patientName)}
                            className="mt-3 rounded-lg bg-[#185FA5] px-3 py-2 text-xs font-bold text-white hover:bg-[#124F8A]"
                          >
                            Komplettera remiss
                          </button>
                        )}
                      </div>
                    )}
                    <ReferralTimeline booking={booking} note={actionNote} />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#DDE3EC] bg-white p-5 shadow-2xl">
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Svara på komplettering</div>
              <h2 className="mt-1 text-xl font-bold text-[#1A2332]">{activeCompletion.patientName}</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Skriv vad som har kompletterats. Svaret visas för behandlingsenheten i Remisskö.
              </p>
            </div>

            <label className="block text-sm font-bold text-[#1A2332]" htmlFor="completion-response">
              Svar till behandlingsenheten *
            </label>
            <textarea
              id="completion-response"
              value={completionComment}
              onChange={(event) => setCompletionComment(event.target.value)}
              rows={4}
              placeholder="Exempel: Hälsodeklaration och läkemedelslista är nu kompletterade."
              className="mt-2 w-full rounded-xl border border-[#DDE3EC] p-3 text-sm focus:border-[#1A4F8A] focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/20"
            />
            {!completionComment.trim() && (
              <p className="mt-2 text-xs font-semibold text-[#C42B2B]">
                Kommentar krävs innan svaret kan skickas.
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeCompletionResponse}
                className="rounded-lg border border-[#DDE3EC] px-4 py-2 text-sm font-semibold text-[#4B5770] hover:bg-[#F0F4F8]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={submitCompletionResponse}
                disabled={!completionComment.trim()}
                className="rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124F8A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Skicka komplettering
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
