import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto, PatientDto } from '../types';
import { TREATMENT_TYPE_LABELS, isEctType, isRtmsType } from '../types';
import { getAllBookingReferralMeta } from '../utils/bookingMeta';
import { getDemoBookings, updateDemoBooking } from '../utils/demoBookings';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import DashboardTessaBar from '../components/dashboard/DashboardTessaBar';
import SlotTable from '../components/dashboard/SlotTable';
import StandbyList from '../components/dashboard/StandbyList';
import { useQuickUpdate } from '../hooks/useQuickUpdate';
import { useLanguage } from '../context/LanguageContext';
import { DEMO_MODE } from '../config/demo';
import type { Slot } from '../components/dashboard/SlotRow';

// ─── Constants ────────────────────────────────────────────────────────────────

const ECT_TIMES = ['08:00','08:15','08:30','08:45','09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45'];
const RTMS_TIMES = ['13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30'];
const BREAK_OPTIONS = ['12:15–12:45', '12:30–13:00'];

type ModuleView = 'all' | 'ect' | 'rtms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatFullDate(ymd: string, locale: string) {
  return new Date(ymd + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getModuleView(pathname: string, search: string): ModuleView {
  const moduleParam = new URLSearchParams(search).get('module');
  if (pathname === '/rtms' || moduleParam === 'rtms') return 'rtms';
  if (moduleParam === 'ect') return 'ect';
  return 'all';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [breakTime, setBreakTime] = useState(BREAK_OPTIONS[0]);
  const moduleView = getModuleView(location.pathname, location.search);
  const referralMetaByBookingId = getAllBookingReferralMeta();

  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const apiBookings = bookingsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const [demoBookings, setDemoBookings] = useState<BookingDto[]>(getDemoBookings);
  const bookings = DEMO_MODE ? [...apiBookings, ...demoBookings] : apiBookings;
  const isLoading = bookingsQuery.isLoading || patientsQuery.isLoading;
  const backendUnavailable = bookingsQuery.isError || patientsQuery.isError;

  const quickUpdate = useQuickUpdate();
  const patientMap: Record<number, PatientDto> = Object.fromEntries(patients.map((p) => [p.patientId, p]));
  const todayBookings = bookings.filter((b) => b.date.slice(0, 10) === selectedDate);

  function buildSlots(times: string[], typeHint: 'ECT' | 'rTMS'): Slot[] {
    const filterFn = typeHint === 'ECT' ? isEctType : isRtmsType;
    return times.map((time) => {
      const booking = todayBookings
        .filter((b) => filterFn(b.treatmentTypeId))
        .find((b) => b.date.slice(11, 16) === time);
      return {
        time, type: typeHint, booking,
        patient: booking ? patientMap[booking.patientId] : undefined,
        treatmentTypeName: booking ? (TREATMENT_TYPE_LABELS[booking.treatmentTypeId] ?? `Typ ${booking.treatmentTypeId}`) : undefined,
      };
    });
  }

  function handleStatusChange(b: BookingDto, status: BookingStatus, priority: BookingPriority) {
    const dto: CreateBookingDto = {
      date: b.date, patientId: b.patientId, treatmentTypeId: b.treatmentTypeId,
      createdById: b.createdById, createdAt: b.createdAt, priority, status,
      referralDepartment: b.referralDepartment,
      referralContactName: b.referralContactName,
      referralContactPhone: b.referralContactPhone,
    };
    if (b.bookingId < 0) {
      const updated = { ...b, status, priority };
      updateDemoBooking(updated);
      setDemoBookings((prev) => prev.map((bk) => bk.bookingId === b.bookingId ? updated : bk));
      return;
    }
    quickUpdate.mutate({ id: b.bookingId, dto });
  }

  function navigate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toYMD(d));
  }

  const visibleBookings = todayBookings.filter((b) => {
    if (moduleView === 'all') return true;
    return moduleView === 'ect' ? isEctType(b.treatmentTypeId) : isRtmsType(b.treatmentTypeId);
  });
  const redToday = visibleBookings.filter((b) => b.priority === 'Red' && b.status !== 'Cancelled').length;
  const dashboardTitle =
    moduleView === 'ect' ? t('ectDashboard') :
    moduleView === 'rtms' ? t('rtmsDashboard') :
    t('coordinatorDashboard');

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
            <div className="flex h-8 items-center gap-2 rounded-lg border border-[#C42B2B] bg-[#FDEAEA] px-3 text-xs">
              <span className="h-2 w-2 rounded-full bg-[#C42B2B]" />
              <span className="font-semibold text-[#C42B2B]">{redToday} akut</span>
            </div>
          )}
          <button onClick={() => navigate(-1)} aria-label={t('previousDay')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] text-[#4B5770] transition-colors">
            <span aria-hidden="true">‹</span>
          </button>
          <button onClick={() => setSelectedDate(toYMD(new Date()))}
            className="px-3 py-1.5 text-xs font-medium border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] rounded-lg text-[#4B5770] transition-colors">
            {t('today')}
          </button>
          <button onClick={() => navigate(1)} aria-label={t('nextDay')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#DDE3EC] bg-white hover:bg-[#F0F4F8] text-[#4B5770] transition-colors">
            <span aria-hidden="true">›</span>
          </button>
          <label className="ml-2 text-xs text-[#64748B]" htmlFor="dashboard-break">{t('break')}</label>
          <select id="dashboard-break" value={breakTime} onChange={(e) => setBreakTime(e.target.value)}
            className="h-8 rounded-lg border border-[#DDE3EC] bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1A4F8A]">
            {BREAK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <DashboardTessaBar />

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

      {!backendUnavailable && !isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_210px] gap-4">
          <div>
            {(moduleView === 'all' || moduleView === 'ect') && (
              <SlotTable
                title={t('morningBlock')}
                slots={buildSlots(ECT_TIMES, 'ECT')}
                onStatusChange={handleStatusChange}
                referralMetaByBookingId={referralMetaByBookingId}
              />
            )}
            <SlotTable
              title={t('afternoonBlock')}
              slots={buildSlots(RTMS_TIMES, 'rTMS')}
              onStatusChange={handleStatusChange}
              referralMetaByBookingId={referralMetaByBookingId}
            />
          </div>
          <div className="space-y-4">
            <StandbyList />
          </div>
        </div>
      )}
    </div>
  );
}
