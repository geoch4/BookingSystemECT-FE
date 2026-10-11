import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
import { maskPersonnummer } from '../utils/personnummer';
import { isEctType, isRtmsType } from '../types';

type ConfirmedFilter = 'all' | 'ect' | 'rtms' | 'transport';

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
  const [filter, setFilter] = useState<ConfirmedFilter>('all');
  const [openReferralId, setOpenReferralId] = useState<string | null>(null);
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const bookings = DEMO_MODE ? [...(bookingsQuery.data ?? []), ...getDemoBookings()] : bookingsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const patientMap = Object.fromEntries(patients.map((patient) => [patient.patientId, patient]));
  const referralMetaByBookingId = getAllBookingReferralMeta(DEMO_MODE);
  const actionNotesByReferralId = DEMO_MODE ? getReferralActionSnapshot() : {};
  const backendUnavailable = bookingsQuery.isError || patientsQuery.isError;
  const isLoading = bookingsQuery.isLoading || patientsQuery.isLoading;
  const confirmedReferrals = getConfirmedReferralSnapshot({ bookings, patientMap, referralMetaByBookingId });
  const filteredReferrals = confirmedReferrals.filter((referral) => {
    if (filter === 'ect') return isEctType(referral.booking.treatmentTypeId);
    if (filter === 'rtms') return isRtmsType(referral.booking.treatmentTypeId);
    if (filter === 'transport') return referral.logistics.requiresTransport;
    return true;
  });
  const filterCounts = {
    all: confirmedReferrals.length,
    ect: confirmedReferrals.filter((referral) => isEctType(referral.booking.treatmentTypeId)).length,
    rtms: confirmedReferrals.filter((referral) => isRtmsType(referral.booking.treatmentTypeId)).length,
    transport: confirmedReferrals.filter((referral) => referral.logistics.requiresTransport).length,
  };
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EAF1] pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Visning</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                Filtrera listan och öppna bara den patient du vill läsa mer om.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: 'Alla', count: filterCounts.all },
                { key: 'ect', label: 'ECT', count: filterCounts.ect },
                { key: 'rtms', label: 'rTMS', count: filterCounts.rtms },
                { key: 'transport', label: 'Transport', count: filterCounts.transport },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setFilter(item.key);
                    setOpenReferralId(null);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    filter === item.key
                      ? 'border-[#185FA5] bg-[#EFF6FF] text-[#185FA5]'
                      : 'border-[#DDE3EC] bg-white text-[#4B5770] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {item.label} <span className="ml-1 opacity-75">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {confirmedReferrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-10 text-center">
              <CalendarCheck className="mx-auto text-[#8494AA]" size={30} />
              <div className="mt-3 text-sm font-bold text-[#1A2332]">Inga bekräftade tider ännu</div>
              <p className="mt-1 text-sm text-[#8494AA]">När behandlingsenheten bekräftar en tid visas patienten här.</p>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-10 text-center">
              <CalendarCheck className="mx-auto text-[#8494AA]" size={30} />
              <div className="mt-3 text-sm font-bold text-[#1A2332]">Inga bekräftade tider i den här vyn</div>
              <p className="mt-1 text-sm text-[#8494AA]">Byt filter för att se andra bokade patienter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferrals.map((referral) => {
                const { booking, patient } = referral;
                const actionNote = effectiveActionNotesByReferralId[referral.id];
                const actionEvents = effectiveActionEventsByReferralId[referral.id] ?? [];
                const isOpen = openReferralId === referral.id;

                return (
                  <article key={booking.bookingId} className={`rounded-xl border bg-white shadow-sm transition-colors ${
                    isOpen ? 'border-[#185FA5] ring-2 ring-[#185FA5]/10' : 'border-[#DDE3EC]'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 p-4 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/referrals/${referral.id}`}
                            className="text-base font-bold text-[#1A2332] hover:text-[#185FA5] hover:underline"
                          >
                            {patient.fullName}
                          </Link>
                          {referral.logistics.requiresTransport && (
                            <span className="rounded-full border border-[#DDE3EC] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#4B5770]">
                              Transport
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
                          <span className="font-mono">{maskPersonnummer(patient.socialSecurityNumber)}</span>
                          <span>{referral.treatmentLabel}</span>
                          <span>{formatDateTime(booking.date)}</span>
                          <span>{referral.logistics.recommendedUnit.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-4 pb-3">
                        <span className="rounded-full border border-[#A9D8BE] bg-[#E8F7F1] px-3 py-1 text-xs font-bold text-[#0F6840]">
                          Tid bekräftad
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenReferralId((current) => current === referral.id ? null : referral.id)}
                          className="rounded-lg border border-[#C9D6E6] bg-white px-3 py-1.5 text-xs font-bold text-[#185FA5] hover:bg-[#EFF6FF]"
                        >
                          {isOpen ? 'Stäng' : 'Visa detaljer'}
                        </button>
                      </div>
                    </div>

                    {isOpen && <div className="border-t border-[#E5EAF1] bg-[#F8FAFC] p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Bekräftad tid</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{formatDateTime(booking.date)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.treatmentLabel}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.department}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Nästa steg</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">Förbered patienten inför bekräftad behandlingstid.</div>
                      </div>
                    </div>
                    <div className={`mt-4 rounded-lg border px-3 py-2 ${
                      referral.logistics.requiresTransport
                        ? 'border-[#E6C77A] bg-[#FFF0CC]'
                        : 'border-[#DDE3EC] bg-[#F8FAFC]'
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Logistik</div>
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
                      <div className="mt-4 rounded-lg border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#0F6840]">Kommentar från behandlingsenheten</div>
                        <div className="mt-1 text-sm text-[#1A2332]">{actionNote.comment}</div>
                      </div>
                    )}
                    <ReferralTimeline booking={booking} note={actionNote} events={actionEvents} />
                    </div>}
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
