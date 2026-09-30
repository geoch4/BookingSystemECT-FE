import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import BackendErrorState from '../components/common/BackendErrorState';
import ReferralTimeline from '../components/referral/ReferralTimeline';
import Spinner from '../components/common/Spinner';
import { DEMO_MODE } from '../config/demo';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings } from '../utils/demoBookings';
import {
  getReferralActionSnapshotsFromApi,
  getReferralActionSnapshot,
} from '../repositories/referralActionRepository';
import { getConfirmedReferralSnapshot } from '../repositories/referralRepository';

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DepartmentConfirmedBookingsPage() {
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const bookings = DEMO_MODE ? [...(bookingsQuery.data ?? []), ...getDemoBookings()] : bookingsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const patientMap = Object.fromEntries(patients.map((patient) => [patient.patientId, patient]));
  const referralMetaByBookingId = getAllBookingReferralMeta();
  const actionNotesByReferralId = getReferralActionSnapshot();
  const backendUnavailable = bookingsQuery.isError || patientsQuery.isError;
  const isLoading = bookingsQuery.isLoading || patientsQuery.isLoading;
  const confirmedReferrals = getConfirmedReferralSnapshot({ bookings, patientMap, referralMetaByBookingId });
  const referralIds = confirmedReferrals.map((referral) => referral.id);
  const actionSnapshotsQuery = useQuery({
    queryKey: ['referral-actions', referralIds],
    queryFn: () => getReferralActionSnapshotsFromApi(referralIds),
    enabled: !DEMO_MODE && referralIds.length > 0,
  });
  const effectiveActionNotesByReferralId = DEMO_MODE ? actionNotesByReferralId : actionSnapshotsQuery.data?.noteMap ?? {};
  const effectiveActionEventsByReferralId = DEMO_MODE ? {} : actionSnapshotsQuery.data?.eventMap ?? {};

  return (
    <main className="min-h-screen bg-[#F3F6FA] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Bekräftade tider</h1>
        <p className="mt-1 text-sm text-[#8494AA]">
          Här visas bara patienter som ECT/rTMS-enheten har bokat och bekräftat.
        </p>
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
          Laddar bekräftade tider...
        </div>
      )}

      {!backendUnavailable && !isLoading && (
        <section className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          {confirmedReferrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-10 text-center">
              <CalendarCheck className="mx-auto text-[#8494AA]" size={30} />
              <div className="mt-3 text-sm font-bold text-[#1A2332]">Inga bekräftade tider ännu</div>
              <p className="mt-1 text-sm text-[#8494AA]">När behandlingsenheten bekräftar en tid visas patienten här.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmedReferrals.map((referral) => {
                const { booking, patient } = referral;
                const actionNote = effectiveActionNotesByReferralId[referral.id];
                const actionEvents = effectiveActionEventsByReferralId[referral.id] ?? [];

                return (
                  <article key={booking.bookingId} className="rounded-xl border border-[#A9D8BE] bg-[#E8F7F1] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/referrals/${referral.id}`}
                          className="text-base font-bold text-[#1A2332] hover:text-[#185FA5] hover:underline"
                        >
                          {patient.fullName}
                        </Link>
                        <div className="mt-0.5 text-xs font-mono text-[#4B7B66]">{patient.socialSecurityNumber}</div>
                      </div>
                      <span className="rounded-full border border-[#A9D8BE] bg-white px-3 py-1 text-xs font-bold text-[#0F6840]">
                        Tid bekräftad
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Bekräftad tid</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{formatDateTime(booking.date)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Behandling</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.treatmentLabel}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Avdelning</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.department}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Nästa steg</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">Förbered patienten inför bekräftad behandlingstid.</div>
                      </div>
                    </div>
                    <div className={`mt-4 rounded-lg border px-3 py-2 ${
                      referral.logistics.requiresTransport
                        ? 'border-[#E6C77A] bg-[#FFF0CC]'
                        : 'border-[#A9D8BE] bg-white'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wide text-[#4B7B66]">Logistik</div>
                      <div className="mt-1 text-sm font-bold text-[#1A2332]">{referral.logistics.recommendedUnit.name}</div>
                      {referral.logistics.transportLabel ? (
                        <div className="mt-1 text-sm font-bold text-[#875100]">
                          Transport behöver planeras: {referral.logistics.transportLabel}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-[#4B5770]">{referral.logistics.logisticsNote}</div>
                      )}
                    </div>
                    {actionNote?.comment && (
                      <div className="mt-4 rounded-lg border border-[#A9D8BE] bg-white px-3 py-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#0F6840]">Kommentar från behandlingsenheten</div>
                        <div className="mt-1 text-sm text-[#1A2332]">{actionNote.comment}</div>
                      </div>
                    )}
                    <ReferralTimeline booking={booking} note={actionNote} events={actionEvents} />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
