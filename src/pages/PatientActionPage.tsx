import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getBookings } from '../api/bookings';
import { getPatients } from '../api/patients';
import BackendErrorState from '../components/common/BackendErrorState';
import Spinner from '../components/common/Spinner';
import { DEMO_MODE } from '../config/demo';
import { useQuickUpdate } from '../hooks/useQuickUpdate';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto, PatientDto } from '../types';
import { isEctType, isRtmsType } from '../types';
import { getDemoBookings, updateDemoBooking } from '../utils/demoBookings';
import { PatientActionPanel } from './DashboardPage';

type PatientActionType = 'pause' | 'cancel' | 'end';

function moduleLabel(module: string | null) {
  if (module === 'rtms') return 'rTMS';
  return 'ECT';
}

function actionParamToType(value: string | null): PatientActionType | null {
  if (value === 'pause' || value === 'cancel' || value === 'end') return value;
  return null;
}

export default function PatientActionPage() {
  const [searchParams] = useSearchParams();
  const module = searchParams.get('module') === 'rtms' ? 'rtms' : 'ect';
  const presetSearch = searchParams.get('pnr') ?? '';
  const presetAction = actionParamToType(searchParams.get('action'));
  const treatmentLabel = moduleLabel(module);
  const [pausedBookingIds, setPausedBookingIds] = useState<Set<number>>(() => new Set());
  const [demoBookings, setDemoBookings] = useState<BookingDto[]>(getDemoBookings);
  const quickUpdate = useQuickUpdate();

  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const apiBookings = bookingsQuery.data ?? [];
  const bookings = DEMO_MODE ? [...apiBookings, ...demoBookings] : apiBookings;
  const patientMap: Record<number, PatientDto> = useMemo(
    () => Object.fromEntries((patientsQuery.data ?? []).map((patient) => [patient.patientId, patient])),
    [patientsQuery.data],
  );
  const visibleBookings = bookings.filter((booking) => (
    module === 'rtms' ? isRtmsType(booking.treatmentTypeId) : isEctType(booking.treatmentTypeId)
  ));
  const backendUnavailable = !DEMO_MODE && (bookingsQuery.isError || patientsQuery.isError);
  const isLoading = !DEMO_MODE && (bookingsQuery.isLoading || patientsQuery.isLoading);

  function handleStatusChange(b: BookingDto, status: BookingStatus, priority: BookingPriority, cancellationReason?: string) {
    const dto: CreateBookingDto = {
      date: b.date,
      patientId: b.patientId,
      treatmentTypeId: b.treatmentTypeId,
      createdById: b.createdById,
      createdAt: b.createdAt,
      priority,
      status,
      referralDepartment: b.referralDepartment,
      referralContactName: b.referralContactName,
      referralContactPhone: b.referralContactPhone,
      cancellationReason: status === 'Cancelled' ? cancellationReason : undefined,
    };

    if (b.bookingId < 0) {
      const updated = { ...b, status, priority, cancellationReason: status === 'Cancelled' ? cancellationReason : undefined };
      updateDemoBooking(updated);
      setDemoBookings((prev) => prev.map((booking) => booking.bookingId === b.bookingId ? updated : booking));
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

  return (
    <main className="min-h-screen bg-[#F3F6FA] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">Patientåtgärd</h1>
        <p className="mt-1 text-sm text-[#8494AA]">
          Sök fram patienten och välj pausa, avboka eller avsluta för en pågående {treatmentLabel}-process.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          ['1', 'Sök patient', 'Skriv personnummer eller namn.'],
          ['2', 'Välj åtgärd', 'Pausa, avboka tid eller avsluta behandling.'],
          ['3', 'Ange orsak', 'Kommentar skickas till behandlingsenheten.'],
        ].map(([step, title, text]) => (
          <div key={step} className="rounded-xl border border-[#DDE3EC] bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-black text-[#185FA5]">
                {step}
              </span>
              <div className="text-sm font-bold text-[#1A2332]">{title}</div>
            </div>
            <p className="mt-2 text-xs text-[#64748B]">{text}</p>
          </div>
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
          Laddar patientåtgärd...
        </div>
      )}

      {!backendUnavailable && !isLoading && visibleBookings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#C3CEDA] bg-white px-4 py-10 text-center">
          <div className="text-sm font-bold text-[#1A2332]">Inga aktiva {treatmentLabel}-behandlingar hittades</div>
          <p className="mt-1 text-sm text-[#8494AA]">
            När patienter har aktiva bokningar eller remisser kan du pausa, avboka eller avsluta dem här.
          </p>
        </div>
      )}

      {!backendUnavailable && !isLoading && visibleBookings.length > 0 && (
        <PatientActionPanel
          bookings={visibleBookings}
          patientMap={patientMap}
          treatmentLabel={treatmentLabel}
          pausedBookingIds={pausedBookingIds}
          presetSearch={presetSearch}
          presetAction={presetAction}
          onPause={(bookingId) => setPausedBookingIds((current) => new Set(current).add(bookingId))}
          onCancel={(booking) => handleStatusChange(booking, 'Cancelled', booking.priority)}
        />
      )}
    </main>
  );
}
