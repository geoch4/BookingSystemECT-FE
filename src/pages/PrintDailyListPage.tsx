import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import { DEMO_MODE } from '../config/demo';
import { getDemoBookings } from '../utils/demoBookings';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getReferralLogistics } from '../utils/careLogistics';
import {
  TREATMENT_TYPE_LABELS,
  isEctType,
  isRtmsType,
  type BookingDto,
  type BookingPriority,
  type BookingStatus,
  type PatientDto,
} from '../types';
import { getRtmsSessionPlan, rtmsSessionPlanShortLabel } from '../utils/rtmsTreatmentPlan';

function printRoute(date: string, module: string | null) {
  const params = new URLSearchParams({ date });
  if (module === 'ect' || module === 'rtms') params.set('module', module);
  return `/print/daily-list?${params.toString()}`;
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: string) {
  return date.slice(11, 16);
}

function priorityLabel(priority: BookingPriority) {
  if (priority === 'Red') return 'Röd - akut';
  if (priority === 'Yellow') return 'Gul - halvakut';
  return 'Grön - elektiv';
}

function statusLabel(status: BookingStatus) {
  if (status === 'Confirmed') return 'Bekräftad';
  if (status === 'Cancelled') return 'Avbokad';
  return 'Väntar';
}

function preparationLabel(booking: BookingDto) {
  if (isEctType(booking.treatmentTypeId)) return 'Fasta / anestesi / läkemedel';
  return 'Kontraindikationer / implantat';
}

function moduleLabel(module: string | null) {
  if (module === 'ect') return 'ECT';
  if (module === 'rtms') return 'rTMS';
  return 'ECT och rTMS';
}

function demoPatient(patientId: number): PatientDto {
  const names = [
    'Maryjane Mayert',
    'Solon Hilpert',
    'Anna Lindgren',
    'Karim Hassan',
    'Maja Berg',
    'Leo Sand',
    'Sara Holm',
    'Johan Berg',
    'Nadia Osman',
    'Erik Lund',
  ];
  return {
    patientId,
    fullName: names[Math.abs(patientId) % names.length] ?? `Patient #${patientId}`,
    socialSecurityNumber: `${String(1960 + (patientId % 35)).padStart(4, '0')}${String((patientId % 12) + 1).padStart(2, '0')}${String((patientId % 27) + 1).padStart(2, '0')}-${String(1000 + patientId).slice(-4)}`,
  };
}

function groupBookings(bookings: BookingDto[]) {
  return {
    ect: bookings.filter((booking) => isEctType(booking.treatmentTypeId)),
    rtms: bookings.filter((booking) => isRtmsType(booking.treatmentTypeId)),
  };
}

function DailyTable({
  title,
  bookings,
  patientMap,
}: {
  title: string;
  bookings: BookingDto[];
  patientMap: Record<number, PatientDto>;
}) {
  return (
    <section className="mb-8 break-inside-avoid">
      <div className="mb-3 flex items-end justify-between border-b-2 border-[#1A2332] pb-2">
        <h2 className="text-xl font-bold text-[#1A2332]">{title}</h2>
        <span className="text-sm font-semibold text-[#4B5770]">{bookings.length} ärenden</span>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-[#DDE3EC] p-4 text-sm text-[#64748B]">
          Inga ärenden för denna behandling idag.
        </div>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#C9D6E6] bg-[#F0F4F8] text-xs uppercase tracking-wide text-[#4B5770]">
              <th className="p-2">Tid</th>
              <th className="p-2">Patient</th>
              <th className="p-2">Personnummer</th>
              <th className="p-2">Behandling</th>
              <th className="p-2">Upplägg</th>
              <th className="p-2">Prioritet</th>
              <th className="p-2">Status</th>
              <th className="p-2">Avdelning</th>
              <th className="p-2">Kontakt</th>
              <th className="p-2">Enhet / logistik</th>
              <th className="p-2">Förberedelse</th>
              <th className="p-2">Klart</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const patient = patientMap[booking.patientId] ?? demoPatient(booking.patientId);
              const rtmsPlan = getRtmsSessionPlan(booking);
              const logistics = getReferralLogistics(booking.referralDepartment || '', booking.treatmentTypeId);
              return (
                <tr key={booking.bookingId} className="border-b border-[#E2E8F0] align-top">
                  <td className="p-2 font-mono font-bold text-[#1A2332]">{formatTime(booking.date)}</td>
                  <td className="p-2 font-semibold text-[#1A2332]">{patient.fullName}</td>
                  <td className="p-2 font-mono text-[#4B5770]">{patient.socialSecurityNumber}</td>
                  <td className="p-2">{TREATMENT_TYPE_LABELS[booking.treatmentTypeId]}</td>
                  <td className="p-2">{rtmsPlan ? `rTMS ${rtmsSessionPlanShortLabel(rtmsPlan)}` : '–'}</td>
                  <td className="p-2">{priorityLabel(booking.priority)}</td>
                  <td className="p-2">{statusLabel(booking.status)}</td>
                  <td className="p-2">{booking.referralDepartment || 'Ej angivet'}</td>
                  <td className="p-2">
                    <div>{booking.referralContactName || 'Ej angivet'}</div>
                    <div className="text-xs text-[#64748B]">{booking.referralContactPhone || ''}</div>
                  </td>
                  <td className="p-2">
                    <div className="font-semibold">{logistics.recommendedUnit.name}</div>
                    {logistics.requiresTransport ? (
                      <div className="text-xs font-bold text-[#875100]">Transport planeras</div>
                    ) : (
                      <div className="text-xs text-[#64748B]">{logistics.sourceSite}</div>
                    )}
                  </td>
                  <td className="p-2 text-xs">
                    <div className="font-semibold text-[#1A2332]">{preparationLabel(booking)}</div>
                    {booking.priority === 'Red' && <div className="mt-1 font-bold text-[#9F1D1D]">Akut prioritet</div>}
                  </td>
                  <td className="p-2">
                    <div className="space-y-1 text-xs text-[#4B5770]">
                      <label className="flex items-center gap-1"><span className="inline-block h-3 w-3 border border-[#64748B]" /> Förberedd</label>
                      <label className="flex items-center gap-1"><span className="inline-block h-3 w-3 border border-[#64748B]" /> Transport</label>
                      <label className="flex items-center gap-1"><span className="inline-block h-3 w-3 border border-[#64748B]" /> Utförd</label>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function PrintDailyListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') ?? todayYmd();
  const module = searchParams.get('module');
  const selectedModule = module === 'ect' || module === 'rtms' ? module : null;
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const referralMetaByBookingId = getAllBookingReferralMeta(DEMO_MODE);

  const bookings = useMemo(() => {
    const apiBookings = bookingsQuery.data ?? [];
    const source = DEMO_MODE ? [...apiBookings, ...getDemoBookings()] : apiBookings;
    return source
      .filter((booking) => booking.date.slice(0, 10) === date)
      .filter((booking) => {
        if (module === 'ect') return isEctType(booking.treatmentTypeId);
        if (module === 'rtms') return isRtmsType(booking.treatmentTypeId);
        return true;
      })
      .map((booking) => {
        const fallback = referralMetaByBookingId[booking.bookingId];
        return {
          ...booking,
          referralDepartment: booking.referralDepartment || fallback?.department,
          referralContactName: booking.referralContactName || fallback?.contactName,
          referralContactPhone: booking.referralContactPhone || fallback?.contactPhone,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bookingsQuery.data, date, module, referralMetaByBookingId]);

  const patientMap: Record<number, PatientDto> = Object.fromEntries(
    (patientsQuery.data ?? []).map((patient) => [patient.patientId, patient]),
  );
  const grouped = groupBookings(bookings);
  const confirmed = bookings.filter((booking) => booking.status === 'Confirmed').length;
  const pending = bookings.filter((booking) => booking.status === 'Pending').length;
  const acute = bookings.filter((booking) => booking.priority === 'Red' && booking.status !== 'Cancelled').length;

  return (
    <main className="min-h-screen bg-white p-8 text-[#1A2332] print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            .no-print { display: none !important; }
            body { background: white !important; }
            main { font-size: 11px; }
            h1 { font-size: 22px !important; }
            h2 { font-size: 16px !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td { padding: 5px !important; }
          }
        `}
      </style>

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-[#C9D6E6] bg-white px-4 py-2 text-sm font-semibold text-[#4B5770] hover:bg-[#F0F4F8]"
        >
          Tillbaka
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href={printRoute(date, null)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              selectedModule === null
                ? 'border-[#1A4F8A] bg-[#EFF6FF] text-[#185FA5]'
                : 'border-[#C9D6E6] bg-white text-[#4B5770] hover:bg-[#F0F4F8]'
            }`}
          >
            Samlad lista
          </a>
          <a
            href={printRoute(date, 'ect')}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              selectedModule === 'ect'
                ? 'border-[#1A4F8A] bg-[#EFF6FF] text-[#185FA5]'
                : 'border-[#C9D6E6] bg-white text-[#4B5770] hover:bg-[#F0F4F8]'
            }`}
          >
            Bara ECT
          </a>
          <a
            href={printRoute(date, 'rtms')}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              selectedModule === 'rtms'
                ? 'border-[#1A4F8A] bg-[#EFF6FF] text-[#185FA5]'
                : 'border-[#C9D6E6] bg-white text-[#4B5770] hover:bg-[#F0F4F8]'
            }`}
          >
            Bara rTMS
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A4F8A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163F70]"
          >
            <Printer size={18} aria-hidden="true" />
            Skriv ut / spara som PDF
          </button>
        </div>
      </div>

      <header className="mb-6 border-b-4 border-[#1A2332] pb-5">
        <div className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#C42B2B]">
          Sekretess - innehåller patientuppgifter
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1A2332]">Dagens behandlingslista</h1>
            <p className="mt-1 text-lg text-[#4B5770] capitalize">{formatDate(date)}</p>
            <p className="mt-1 text-sm text-[#64748B]">Urval: {moduleLabel(module)}</p>
            <p className="mt-2 text-xs text-[#64748B]">
              Arbetslista för passet. Använd rutorna längst till höger för lokal avstämning under dagen.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-[#DDE3EC] p-3">
              <div className="text-2xl font-black">{bookings.length}</div>
              <div className="text-xs uppercase text-[#64748B]">Totalt</div>
            </div>
            <div className="rounded-lg border border-[#A9D8BE] bg-[#E8F7F1] p-3">
              <div className="text-2xl font-black">{confirmed}</div>
              <div className="text-xs uppercase text-[#0F6840]">Bekräftade</div>
            </div>
            <div className="rounded-lg border border-[#E5A3A6] bg-[#FDEAEA] p-3">
              <div className="text-2xl font-black">{acute}</div>
              <div className="text-xs uppercase text-[#9F1D1D]">Akuta</div>
            </div>
          </div>
        </div>
        {pending > 0 && (
          <p className="mt-4 rounded-lg border border-[#E6C77A] bg-[#FFF0CC] p-3 text-sm font-semibold text-[#875100]">
            {pending} ärenden väntar på bekräftelse/prioritering.
          </p>
        )}
      </header>

      {(module !== 'rtms') && (
        <DailyTable title="ECT - förmiddagsblock" bookings={grouped.ect} patientMap={patientMap} />
      )}
      {(module !== 'ect') && (
        <DailyTable title="rTMS - eftermiddagsblock" bookings={grouped.rtms} patientMap={patientMap} />
      )}

      <footer className="mt-10 border-t border-[#DDE3EC] pt-3 text-xs text-[#64748B]">
        Utskriven från ECT/rTMS bokningssystem. Hantera listan enligt gällande sekretessrutiner.
      </footer>
    </main>
  );
}
