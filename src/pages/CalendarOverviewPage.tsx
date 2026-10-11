import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, Brain, Building2, Bus, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import type { BookingDto } from '../types';
import { isEctType, isRtmsType } from '../types';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import { DEMO_MODE } from '../config/demo';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings } from '../utils/demoBookings';
import { treatmentUnits, type TreatmentUnitId } from '../utils/careLogistics';
import { buildReferralCases, type ReferralCase } from '../utils/referralCases';
import { maskPersonnummer } from '../utils/personnummer';

const ECT_CAPACITY = 15;
const RTMS_CAPACITY = 15;

type DayLoad = {
  date: string;
  ectBooked: number;
  rtmsBooked: number;
};

type LoadTone = ReturnType<typeof getLoadTone>;

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(date);
}

function buildMonthDays(month: Date) {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function isEctTreatmentDay(day: Date) {
  const weekday = day.getDay();
  return weekday === 1 || weekday === 3 || weekday === 5;
}

function isWeekday(day: Date) {
  const weekday = day.getDay();
  return weekday >= 1 && weekday <= 5;
}

function getLoadTone(booked: number, capacity: number) {
  if (booked > capacity) return 'over';
  if (booked === capacity) return 'full';
  if (booked >= Math.ceil(capacity * 0.8)) return 'busy';
  if (booked === 0) return 'empty';
  return 'ok';
}

function toneClass(tone: ReturnType<typeof getLoadTone>) {
  if (tone === 'over') return 'border-[#C42B2B] bg-[#FDEAEA] text-[#9F1D1D]';
  if (tone === 'full') return 'border-[#D4860A] bg-[#FEF3DC] text-[#875100]';
  if (tone === 'busy') return 'border-[#F4C86A] bg-[#FFF8E6] text-[#875100]';
  if (tone === 'empty') return 'border-[#C3CEDA] bg-[#F8FAFC] text-[#64748B]';
  return 'border-[#A9D8BE] bg-[#E8F7F1] text-[#0F6840]';
}

function toneLabel(tone: ReturnType<typeof getLoadTone>) {
  if (tone === 'over') return 'Överbelastat';
  if (tone === 'full') return 'Fullt';
  if (tone === 'busy') return 'Nästan fullt';
  if (tone === 'empty') return 'Tomt';
  return 'Ledigt';
}

function summarizeBookings(bookings: BookingDto[]) {
  return bookings.reduce<Record<string, DayLoad>>((acc, booking) => {
    if (booking.status === 'Cancelled') return acc;

    const date = booking.date.slice(0, 10);
    acc[date] ??= { date, ectBooked: 0, rtmsBooked: 0 };

    if (isEctType(booking.treatmentTypeId)) acc[date].ectBooked += 1;
    if (isRtmsType(booking.treatmentTypeId)) acc[date].rtmsBooked += 1;

    return acc;
  }, {});
}

function unitMonthCapacity(unitId: TreatmentUnitId, days: Date[]) {
  const ectTreatmentDays = days.filter(isEctTreatmentDay).length;
  const rtmsTreatmentDays = days.filter(isWeekday).length;

  if (unitId === 'sahlgrenska-ect-rtms') {
    return {
      ect: ectTreatmentDays * ECT_CAPACITY,
      rtms: rtmsTreatmentDays * RTMS_CAPACITY,
    };
  }

  if (unitId === 'ostra-ect' || unitId === 'molndal-psykos-ect') {
    return {
      ect: ectTreatmentDays * 6,
      rtms: 0,
    };
  }

  return { ect: 0, rtms: 0 };
}

function currentMonthDays(month: Date) {
  const first = startOfMonth(month);
  const next = addMonths(month, 1);
  const days: Date[] = [];
  const current = new Date(first);

  while (current < next) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function summarizeUnitCapacity(referrals: ReferralCase[], month: Date) {
  const monthPrefix = toYMD(month).slice(0, 7);
  const monthDays = currentMonthDays(month);

  return Object.values(treatmentUnits).map((unit) => {
    const unitReferrals = referrals.filter((referral) => (
      referral.logistics.recommendedUnit.id === unit.id
      && referral.booking.status !== 'Cancelled'
      && referral.booking.date.startsWith(monthPrefix)
    ));
    const ectBooked = unitReferrals.filter((referral) => isEctType(referral.booking.treatmentTypeId)).length;
    const rtmsBooked = unitReferrals.filter((referral) => isRtmsType(referral.booking.treatmentTypeId)).length;
    const transportCases = unitReferrals.filter((referral) => referral.logistics.requiresTransport).length;
    const polyclinicCases = unitReferrals.filter((referral) => referral.logistics.patientFlow === 'Poliklinisk').length;
    const capacity = unitMonthCapacity(unit.id, monthDays);

    return {
      unit,
      ectBooked,
      rtmsBooked,
      ectCapacity: capacity.ect,
      rtmsCapacity: capacity.rtms,
      transportCases,
      polyclinicCases,
      loadPercent: capacity.ect + capacity.rtms > 0
        ? Math.round(((ectBooked + rtmsBooked) / (capacity.ect + capacity.rtms)) * 100)
        : 0,
    };
  });
}

function dailyUnitCapacity(unitId: TreatmentUnitId, day: Date) {
  if (unitId === 'sahlgrenska-ect-rtms') {
    return {
      ect: isEctTreatmentDay(day) ? ECT_CAPACITY : 0,
      rtms: isWeekday(day) ? RTMS_CAPACITY : 0,
    };
  }

  if (unitId === 'ostra-ect' || unitId === 'molndal-psykos-ect') {
    return {
      ect: isEctTreatmentDay(day) ? 6 : 0,
      rtms: 0,
    };
  }

  return { ect: 0, rtms: 0 };
}

function summarizeSelectedUnitDays(referrals: ReferralCase[], month: Date, unitId: TreatmentUnitId) {
  return currentMonthDays(month).map((day) => {
    const date = toYMD(day);
    const dayReferrals = referrals.filter((referral) => (
      referral.logistics.recommendedUnit.id === unitId
      && referral.booking.status !== 'Cancelled'
      && referral.booking.date.startsWith(date)
    ));
    const capacity = dailyUnitCapacity(unitId, day);
    const ectBooked = dayReferrals.filter((referral) => isEctType(referral.booking.treatmentTypeId)).length;
    const rtmsBooked = dayReferrals.filter((referral) => isRtmsType(referral.booking.treatmentTypeId)).length;
    const totalBooked = ectBooked + rtmsBooked;
    const totalCapacity = capacity.ect + capacity.rtms;

    return {
      date,
      day,
      referrals: dayReferrals,
      ectBooked,
      rtmsBooked,
      ectCapacity: capacity.ect,
      rtmsCapacity: capacity.rtms,
      transportCases: dayReferrals.filter((referral) => referral.logistics.requiresTransport).length,
      acuteCases: dayReferrals.filter((referral) => referral.priority === 'Red').length,
      tone: (totalCapacity === 0 ? 'empty' : getLoadTone(totalBooked, totalCapacity)) as LoadTone,
    };
  });
}

function buildOverflowSuggestions(referrals: ReferralCase[], month: Date) {
  const sahlgrenskaDays = summarizeSelectedUnitDays(referrals, month, 'sahlgrenska-ect-rtms');
  const molndalDays = summarizeSelectedUnitDays(referrals, month, 'molndal-psykos-ect');
  const ostraDays = summarizeSelectedUnitDays(referrals, month, 'ostra-ect');

  return sahlgrenskaDays.flatMap((sahlgrenskaDay) => {
    const sahlgrenskaEctAvailable = Math.max(sahlgrenskaDay.ectCapacity - sahlgrenskaDay.ectBooked, 0);
    const isLoaded = sahlgrenskaDay.ectCapacity > 0 && sahlgrenskaDay.ectBooked >= Math.ceil(sahlgrenskaDay.ectCapacity * 0.8);
    if (!isLoaded) return [];

    const molndalDay = molndalDays.find((day) => day.date === sahlgrenskaDay.date);
    const ostraDay = ostraDays.find((day) => day.date === sahlgrenskaDay.date);
    const alternatives = [molndalDay, ostraDay]
      .filter((day): day is NonNullable<typeof day> => Boolean(day))
      .map((day) => ({
        date: day.date,
        label: day === molndalDay ? treatmentUnits['molndal-psykos-ect'].name : treatmentUnits['ostra-ect'].name,
        available: Math.max(day.ectCapacity - day.ectBooked, 0),
      }))
      .filter((alternative) => alternative.available > 0);

    if (alternatives.length === 0) return [];

    const acuteCases = sahlgrenskaDay.referrals.filter((referral) => referral.priority === 'Red').length;
    const transportCases = sahlgrenskaDay.referrals.filter((referral) => referral.logistics.requiresTransport).length;

    return [{
      date: sahlgrenskaDay.date,
      booked: sahlgrenskaDay.ectBooked,
      capacity: sahlgrenskaDay.ectCapacity,
      available: sahlgrenskaEctAvailable,
      alternatives,
      acuteCases,
      transportCases,
    }];
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('sv-SE', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function referralStatusClass(referral: ReferralCase) {
  if (referral.booking.status === 'Confirmed') return 'border-[#A9D8BE] bg-[#E8F7F1] text-[#0F6840]';
  if (referral.priority === 'Red') return 'border-[#E5A3A6] bg-[#FDEAEA] text-[#9F1D1D]';
  if (referral.priority === 'Yellow') return 'border-[#E6C77A] bg-[#FFF0CC] text-[#875100]';
  return 'border-[#93C5FD] bg-[#EFF6FF] text-[#185FA5]';
}

function referralStatusLabel(referral: ReferralCase) {
  if (referral.booking.status === 'Confirmed') return 'Bekräftad tid';
  if (referral.priority === 'Red') return 'Akut - väntar';
  if (referral.priority === 'Yellow') return 'Behöver bevakas';
  return 'Väntar prioritering';
}

function CapacityPill({
  label,
  booked,
  capacity,
  icon,
}: {
  label: string;
  booked: number;
  capacity: number;
  icon: ReactNode;
}) {
  const tone = getLoadTone(booked, capacity);

  return (
    <div className={`rounded-lg border px-2 py-1 ${toneClass(tone)}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-xs font-bold">
        {booked}/{capacity}
        <span className="ml-1 font-semibold opacity-80">{toneLabel(tone)}</span>
      </div>
    </div>
  );
}

export default function CalendarOverviewPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedUnitId, setSelectedUnitId] = useState<TreatmentUnitId>('sahlgrenska-ect-rtms');
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const bookings = useMemo(
    () => DEMO_MODE ? [...(bookingsQuery.data ?? []), ...getDemoBookings()] : bookingsQuery.data ?? [],
    [bookingsQuery.data],
  );
  const patientMap = useMemo(
    () => Object.fromEntries((patientsQuery.data ?? []).map((patient) => [patient.patientId, patient])),
    [patientsQuery.data],
  );
  const referralMetaByBookingId = useMemo(() => getAllBookingReferralMeta(DEMO_MODE), []);
  const days = useMemo(() => buildMonthDays(month), [month]);
  const byDate = useMemo(() => summarizeBookings(bookings), [bookings]);
  const referrals = useMemo(
    () => buildReferralCases(bookings, patientMap, referralMetaByBookingId),
    [bookings, patientMap, referralMetaByBookingId],
  );
  const unitCapacity = useMemo(() => summarizeUnitCapacity(referrals, month), [referrals, month]);
  const selectedUnit = treatmentUnits[selectedUnitId];
  const selectedUnitReferrals = referrals
    .filter((referral) => (
      referral.logistics.recommendedUnit.id === selectedUnitId
      && referral.booking.status !== 'Cancelled'
      && referral.booking.date.startsWith(toYMD(month).slice(0, 7))
    ))
    .sort((a, b) => a.booking.date.localeCompare(b.booking.date));
  const selectedConfirmed = selectedUnitReferrals.filter((referral) => referral.booking.status === 'Confirmed').length;
  const selectedWaiting = selectedUnitReferrals.filter((referral) => referral.booking.status !== 'Confirmed').length;
  const selectedTransport = selectedUnitReferrals.filter((referral) => referral.logistics.requiresTransport).length;
  const selectedPolyclinic = selectedUnitReferrals.filter((referral) => referral.logistics.patientFlow === 'Poliklinisk').length;
  const selectedUnitDays = useMemo(
    () => summarizeSelectedUnitDays(referrals, month, selectedUnitId),
    [referrals, month, selectedUnitId],
  );
  const overflowSuggestions = useMemo(
    () => buildOverflowSuggestions(referrals, month),
    [referrals, month],
  );
  const transportReferrals = referrals
    .filter((referral) => (
      referral.logistics.requiresTransport
      && referral.booking.status !== 'Cancelled'
      && referral.booking.date.startsWith(toYMD(month).slice(0, 7))
    ))
    .sort((a, b) => a.booking.date.localeCompare(b.booking.date));

  const monthLoads = Object.values(byDate).filter((day) => day.date.startsWith(toYMD(month).slice(0, 7)));
  const overloadedDays = monthLoads.filter(
    (day) => day.ectBooked > ECT_CAPACITY || day.rtmsBooked > RTMS_CAPACITY,
  ).length;
  const emptyEctDays = days.filter((day) => day.getMonth() === month.getMonth() && (byDate[toYMD(day)]?.ectBooked ?? 0) === 0).length;
  const emptyRtmsDays = days.filter((day) => day.getMonth() === month.getMonth() && (byDate[toYMD(day)]?.rtmsBooked ?? 0) === 0).length;

  return (
    <main className="w-full p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Kalenderöversikt</h1>
          <p className="mt-1 text-sm text-[#8494AA]">
            Se beläggning, överbelastning och tomma platser för ECT och rTMS över månaden.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE3EC] bg-white text-[#4B5770] hover:bg-[#F0F4F8]"
            aria-label="Föregående månad"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-44 rounded-lg border border-[#DDE3EC] bg-white px-4 py-2 text-center text-sm font-bold capitalize text-[#1A2332]">
            {monthLabel(month)}
          </div>
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE3EC] bg-white text-[#4B5770] hover:bg-[#F0F4F8]"
            aria-label="Nästa månad"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Risk</div>
          <div className="mt-1 text-2xl font-bold text-[#1A2332]">{overloadedDays}</div>
          <p className="text-sm text-[#64748B]">dagar med överbelastning</p>
        </div>
        <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">ECT</div>
          <div className="mt-1 text-2xl font-bold text-[#1A2332]">{emptyEctDays}</div>
          <p className="text-sm text-[#64748B]">dagar utan ECT-bokningar</p>
        </div>
        <div className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">rTMS</div>
          <div className="mt-1 text-2xl font-bold text-[#1A2332]">{emptyRtmsDays}</div>
          <p className="text-sm text-[#64748B]">dagar utan rTMS-bokningar</p>
        </div>
      </section>

      {!DEMO_MODE && (bookingsQuery.isError || patientsQuery.isError) && (
        <BackendErrorState
          error={bookingsQuery.error ?? patientsQuery.error}
          onRetry={() => { void bookingsQuery.refetch(); void patientsQuery.refetch(); }}
        />
      )}

      {!DEMO_MODE && (bookingsQuery.isLoading || patientsQuery.isLoading) && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#8494AA]">
          <Spinner size={20} />
          Laddar kalender...
        </div>
      )}

      {(DEMO_MODE || (!bookingsQuery.isError && !patientsQuery.isError && !bookingsQuery.isLoading && !patientsQuery.isLoading)) && (
        <>
          <section className="mb-5 rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1A2332]">Kapacitet per behandlingsenhet</h2>
                <p className="mt-1 text-sm text-[#8494AA]">
                  Visar hur månadens bokningar fördelas mellan Sahlgrenska, Östra och Mölndal/Psykos.
                </p>
              </div>
              <div className="rounded-full border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#64748B]">
                {monthLabel(month)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {unitCapacity.map((summary) => {
                const totalBooked = summary.ectBooked + summary.rtmsBooked;
                const totalCapacity = summary.ectCapacity + summary.rtmsCapacity;
                const remaining = Math.max(totalCapacity - totalBooked, 0);
                const isBusy = summary.loadPercent >= 80;

                return (
                  <button
                    key={summary.unit.id}
                    type="button"
                    onClick={() => setSelectedUnitId(summary.unit.id)}
                    className={`rounded-2xl border p-4 ${
                      selectedUnitId === summary.unit.id
                        ? 'border-[#185FA5] bg-[#EFF6FF] text-left ring-2 ring-[#185FA5]/20'
                        : isBusy
                          ? 'border-[#E6C77A] bg-[#FFF8E6] text-left hover:shadow-md'
                          : 'border-[#DDE3EC] bg-[#F8FAFC] text-left hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-base font-bold text-[#1A2332]">
                          <Building2 size={18} aria-hidden="true" />
                          {summary.unit.name}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#64748B]">{summary.unit.description}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        selectedUnitId === summary.unit.id
                          ? 'border-[#93C5FD] bg-white text-[#185FA5]'
                          : isBusy
                          ? 'border-[#E6C77A] bg-[#FFF0CC] text-[#875100]'
                          : 'border-[#A9D8BE] bg-[#E8F7F1] text-[#0F6840]'
                      }`}>
                        {summary.loadPercent}% belastning
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#DDE3EC] bg-white p-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">ECT</div>
                        <div className="mt-1 text-lg font-black text-[#1A2332]">{summary.ectBooked}/{summary.ectCapacity}</div>
                      </div>
                      <div className="rounded-xl border border-[#DDE3EC] bg-white p-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">rTMS</div>
                        <div className="mt-1 text-lg font-black text-[#1A2332]">{summary.rtmsBooked}/{summary.rtmsCapacity}</div>
                      </div>
                      <div className="rounded-xl border border-[#DDE3EC] bg-white p-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Ledigt</div>
                        <div className="mt-1 text-lg font-black text-[#1A2332]">{remaining}</div>
                      </div>
                      <div className="rounded-xl border border-[#DDE3EC] bg-white p-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Transport</div>
                        <div className="mt-1 text-lg font-black text-[#1A2332]">{summary.transportCases}</div>
                      </div>
                    </div>

                    {summary.polyclinicCases > 0 && (
                      <div className="mt-3 rounded-lg border border-[#93C5FD] bg-[#EFF6FF] px-3 py-2 text-xs font-semibold text-[#185FA5]">
                        {summary.polyclinicCases} polikliniska patienter påverkar kapaciteten.
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {overflowSuggestions.length > 0 && (
            <section className="mb-5 rounded-2xl border border-[#E6C77A] bg-[#FFF8E6] p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-2">
                <Lightbulb size={21} className="mt-0.5 text-[#875100]" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-[#1A2332]">Förslag vid hög belastning</h2>
                  <p className="mt-1 text-sm text-[#875100]">
                    Systemet visar dagar där Sahlgrenska ECT är hårt belastat och annan ECT-enhet kan vara värd att överväga.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {overflowSuggestions.map((suggestion) => (
                  <article key={suggestion.date} className="rounded-xl border border-[#E6C77A] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-bold text-[#1A2332]">
                          {new Date(`${suggestion.date}T12:00:00`).toLocaleDateString('sv-SE', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                          })}
                        </div>
                        <div className="mt-1 text-sm text-[#64748B]">
                          Sahlgrenska ECT: {suggestion.booked}/{suggestion.capacity} bokade.
                        </div>
                      </div>
                      <span className="rounded-full border border-[#E6C77A] bg-[#FFF0CC] px-3 py-1 text-xs font-bold text-[#875100]">
                        {suggestion.available} lediga kvar
                      </span>
                    </div>

                    <div className="mt-3 rounded-lg border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-2 text-sm">
                      <div className="font-bold text-[#1A2332]">Möjlig avlastning</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {suggestion.alternatives.map((alternative) => (
                          <span
                            key={`${suggestion.date}-${alternative.label}`}
                            className="rounded-full border border-[#A9D8BE] bg-[#E8F7F1] px-3 py-1 text-xs font-bold text-[#0F6840]"
                          >
                            {alternative.label}: {alternative.available} lediga ECT-platser
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      {suggestion.acuteCases > 0 && (
                        <span className="rounded-full border border-[#E5A3A6] bg-[#FDEAEA] px-3 py-1 text-[#9F1D1D]">
                          {suggestion.acuteCases} akut
                        </span>
                      )}
                      {suggestion.transportCases > 0 && (
                        <span className="rounded-full border border-[#E6C77A] bg-[#FFF0CC] px-3 py-1 text-[#875100]">
                          {suggestion.transportCases} transportfall
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard?date=${suggestion.date}&module=ect`)}
                        className="rounded-lg bg-[#185FA5] px-3 py-2 text-xs font-bold text-white hover:bg-[#124F8A]"
                      >
                        Öppna dagen
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUnitId('molndal-psykos-ect')}
                        className="rounded-lg border border-[#C9D6E6] bg-white px-3 py-2 text-xs font-bold text-[#185FA5] hover:bg-[#EFF6FF]"
                      >
                        Visa Mölndal/Psykos
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="mb-5 rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Vald behandlingsenhet</div>
                <h2 className="mt-1 text-lg font-bold text-[#1A2332]">{selectedUnit.name}</h2>
                <p className="mt-1 text-sm text-[#64748B]">{selectedUnit.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
                <div className="rounded-xl border border-[#A9D8BE] bg-[#E8F7F1] px-3 py-2">
                  <div className="text-lg font-black text-[#0F6840]">{selectedConfirmed}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#0F6840]">Bekräftade</div>
                </div>
                <div className="rounded-xl border border-[#93C5FD] bg-[#EFF6FF] px-3 py-2">
                  <div className="text-lg font-black text-[#185FA5]">{selectedWaiting}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#185FA5]">Väntar</div>
                </div>
                <div className="rounded-xl border border-[#E6C77A] bg-[#FFF0CC] px-3 py-2">
                  <div className="text-lg font-black text-[#875100]">{selectedTransport}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#875100]">Transport</div>
                </div>
                <div className="rounded-xl border border-[#C3CEDA] bg-[#F8FAFC] px-3 py-2">
                  <div className="text-lg font-black text-[#1A2332]">{selectedPolyclinic}</div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Polikliniska</div>
                </div>
              </div>
            </div>

            {selectedUnitReferrals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#C3CEDA] bg-[#F8FAFC] px-4 py-10 text-center text-sm text-[#8494AA]">
                Inga patienter är kopplade till den här behandlingsenheten under vald månad.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {selectedUnitReferrals.map((referral) => (
                  <button
                    key={referral.id}
                    type="button"
                    onClick={() => navigate(`/referrals/${referral.id}`)}
                    className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4 text-left transition-colors hover:border-[#93C5FD] hover:bg-[#EFF6FF]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#1A2332]">{referral.patient.fullName}</div>
                        <div className="font-mono text-xs text-[#64748B]">{maskPersonnummer(referral.patient.socialSecurityNumber)}</div>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${referralStatusClass(referral)}`}>
                        {referralStatusLabel(referral)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Tid/önskad start</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{formatDateTime(referral.booking.date)}</div>
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
                        <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Flöde</div>
                        <div className="mt-1 text-sm font-semibold text-[#1A2332]">{referral.logistics.patientFlow}</div>
                      </div>
                    </div>

                    {referral.logistics.requiresTransport && (
                      <div className="mt-3 rounded-lg border border-[#E6C77A] bg-[#FFF0CC] px-3 py-2 text-xs font-bold text-[#875100]">
                        Transport: {referral.logistics.transportLabel}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mb-5 rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1A2332]">Daglig kapacitet för {selectedUnit.name}</h2>
                <p className="mt-1 text-sm text-[#8494AA]">
                  Klicka på en dag för att öppna den i dashboarden. Färgerna visar om dagen är ledig, nästan full, full eller överbelastad.
                </p>
              </div>
              <div className="rounded-full border border-[#DDE3EC] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#64748B]">
                {selectedUnitDays.filter((day) => day.tone === 'over' || day.tone === 'full' || day.tone === 'busy').length} belastade dagar
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-7">
              {selectedUnitDays.map((day) => {
                const isClickable = day.ectCapacity + day.rtmsCapacity > 0 || day.referrals.length > 0;
                const module = day.rtmsCapacity > 0 && day.rtmsBooked > day.ectBooked ? 'rtms' : 'ect';

                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => navigate(`/dashboard?date=${day.date}&module=${module}`)}
                    className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${toneClass(day.tone)} hover:shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-[#1A2332]">
                          {day.day.toLocaleDateString('sv-SE', { weekday: 'short', day: '2-digit' })}
                        </div>
                        <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide opacity-80">
                          {toneLabel(day.tone)}
                        </div>
                      </div>
                      {day.acuteCases > 0 && (
                        <span className="rounded-full border border-[#E5A3A6] bg-[#FDEAEA] px-2 py-0.5 text-[10px] font-black text-[#9F1D1D]">
                          {day.acuteCases} akut
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-xs font-bold">
                      {day.ectCapacity > 0 && (
                        <div className="flex justify-between gap-2">
                          <span>ECT</span>
                          <span>{day.ectBooked}/{day.ectCapacity}</span>
                        </div>
                      )}
                      {day.rtmsCapacity > 0 && (
                        <div className="flex justify-between gap-2">
                          <span>rTMS</span>
                          <span>{day.rtmsBooked}/{day.rtmsCapacity}</span>
                        </div>
                      )}
                      {day.ectCapacity + day.rtmsCapacity === 0 && (
                        <div>Ingen ordinarie kapacitet</div>
                      )}
                    </div>

                    {day.transportCases > 0 && (
                      <div className="mt-2 rounded-lg bg-white/70 px-2 py-1 text-[11px] font-bold text-[#875100]">
                        {day.transportCases} transport
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {transportReferrals.length > 0 && (
            <section className="mb-5 rounded-2xl border border-[#E6C77A] bg-[#FFF8E6] p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Bus size={20} className="text-[#875100]" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-[#1A2332]">Transport behöver planeras</h2>
                  <p className="text-sm text-[#875100]">
                    Patienter där avdelningen och behandlingsenheten ligger på olika plats.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {transportReferrals.slice(0, 6).map((referral) => (
                  <button
                    key={referral.id}
                    type="button"
                    onClick={() => navigate(`/referrals/${referral.id}`)}
                    className="rounded-xl border border-[#E6C77A] bg-white p-3 text-left hover:bg-[#FFF0CC]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#1A2332]">{referral.patient.fullName}</div>
                        <div className="font-mono text-xs text-[#64748B]">{maskPersonnummer(referral.patient.socialSecurityNumber)}</div>
                      </div>
                      <div className="text-right text-xs font-bold text-[#875100]">
                        {referral.booking.date.slice(0, 10)} kl. {referral.booking.date.slice(11, 16)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-[#4B5770]">{referral.logistics.transportLabel}</div>
                    <div className="mt-1 text-xs font-semibold text-[#64748B]">
                      {referral.department} {'->'} {referral.logistics.recommendedUnit.name}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-[#DDE3EC] bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-[#8494AA]">
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((weekday) => (
                <div key={weekday} className="px-3 py-3">{weekday}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const date = toYMD(day);
                const load = byDate[date] ?? { date, ectBooked: 0, rtmsBooked: 0 };
                const isCurrentMonth = day.getMonth() === month.getMonth();

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => navigate(`/dashboard?date=${date}`)}
                    className={`min-h-36 border-b border-r border-[#E5EAF1] p-3 text-left transition-colors hover:bg-[#EFF6FF] ${
                      isCurrentMonth ? 'bg-white' : 'bg-[#F8FAFC] opacity-55'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1A2332]">{day.getDate()}</span>
                      {date === toYMD(new Date()) && (
                        <span className="rounded-full bg-[#1A4F8A] px-2 py-0.5 text-[10px] font-bold text-white">Idag</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <CapacityPill
                        label="ECT"
                        booked={load.ectBooked}
                        capacity={ECT_CAPACITY}
                        icon={<Brain size={13} aria-hidden="true" />}
                      />
                      <CapacityPill
                        label="rTMS"
                        booked={load.rtmsBooked}
                        capacity={RTMS_CAPACITY}
                        icon={<Activity size={13} aria-hidden="true" />}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#A9D8BE] bg-[#E8F7F1] px-2 py-1 text-[#0F6840]">Ledigt</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#F4C86A] bg-[#FFF8E6] px-2 py-1 text-[#875100]">Nästan fullt</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#D4860A] bg-[#FEF3DC] px-2 py-1 text-[#875100]">Fullt</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#C42B2B] bg-[#FDEAEA] px-2 py-1 text-[#9F1D1D]">Överbelastat</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#C3CEDA] bg-[#F8FAFC] px-2 py-1">Tomt</span>
      </div>
    </main>
  );
}
