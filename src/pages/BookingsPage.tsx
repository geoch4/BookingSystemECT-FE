import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, createBooking, updateBooking, deleteBooking } from '../api/bookings';
import { getPatients } from '../api/patients';
import { useAuth } from '../context/useAuth';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto, TreatmentType } from '../types';
import { TREATMENT_TYPE_OPTIONS, TREATMENT_TYPE_LABELS, isEctType } from '../types';
// Används för att visa backend-metadata med lokal fallback för äldre bokningar.
import { deleteBookingReferralMeta, getAllBookingReferralMeta, getReferralMetaForBooking } from '../utils/bookingMeta';
import { addDemoBooking, getDemoBookings } from '../utils/demoBookings';
import BackendErrorState from '../components/common/BackendErrorState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Spinner from '../components/common/Spinner';
import { addHistoryEntry, getAllBookingHistory, type BookingHistoryEntry } from '../utils/bookingHistory';
import { DEMO_MODE } from '../config/demo';

const STATUS_LABELS: Record<BookingStatus, string> = {
  Pending: 'Väntande',
  Confirmed: 'Bekräftad',
  Cancelled: 'Avbokad',
};

const PRIORITY_LABELS: Record<BookingPriority, string> = {
  Green: 'Grön',
  Yellow: 'Gul',
  Red: 'Röd',
};

const PRIORITY_STYLES: Record<BookingPriority, string> = {
  Green: 'bg-[#E8F7F1] text-[#1A9E5F]',
  Yellow: 'bg-[#FEF3DC] text-[#D4860A]',
  Red: 'bg-[#FDEAEA] text-[#C42B2B]',
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: 'bg-[#FEF3DC] text-[#D4860A]',
  Confirmed: 'bg-[#E8F7F1] text-[#1A9E5F]',
  Cancelled: 'bg-[#F3F4F6] text-[#6B7280]',
};

const MOCK_BOOKINGS: BookingDto[] = [
  { bookingId: -1, date: '2026-06-09T09:00:00', patientId: 1, treatmentTypeId: 4, createdById: 1, createdAt: '2026-06-08T08:10:00', priority: 'Red', status: 'Confirmed', referralDepartment: 'Avdelning 361', referralContactName: 'Anna Sjöberg', referralContactPhone: '031-342 10 61' },
  { bookingId: -2, date: '2026-06-09T09:15:00', patientId: 2, treatmentTypeId: 2, createdById: 1, createdAt: '2026-06-08T08:24:00', priority: 'Yellow', status: 'Confirmed', referralDepartment: 'Avdelning 362', referralContactName: 'Erik Lund', referralContactPhone: '031-342 10 62' },
  { bookingId: -3, date: '2026-06-09T09:30:00', patientId: 3, treatmentTypeId: 3, createdById: 1, createdAt: '2026-06-08T09:05:00', priority: 'Green', status: 'Pending', referralDepartment: 'Öppenvård affektiva', referralContactName: 'Sara Holm', referralContactPhone: '031-342 10 40' },
  { bookingId: -4, date: '2026-06-09T10:00:00', patientId: 4, treatmentTypeId: 2, createdById: 1, createdAt: '2026-06-08T09:42:00', priority: 'Green', status: 'Confirmed', referralDepartment: 'Avdelning 360', referralContactName: 'Maria Ek', referralContactPhone: '031-342 10 60' },
  { bookingId: -5, date: '2026-06-09T13:00:00', patientId: 5, treatmentTypeId: 5, createdById: 1, createdAt: '2026-06-08T10:15:00', priority: 'Green', status: 'Confirmed', referralDepartment: 'Affektiv mottagning', referralContactName: 'Johan Berg', referralContactPhone: '031-342 11 20' },
  { bookingId: -6, date: '2026-06-09T13:30:00', patientId: 6, treatmentTypeId: 6, createdById: 1, createdAt: '2026-06-08T10:38:00', priority: 'Yellow', status: 'Pending', referralDepartment: 'OCD-mottagningen', referralContactName: 'Elin Nord', referralContactPhone: '031-342 11 30' },
  { bookingId: -7, date: '2026-06-10T09:00:00', patientId: 7, treatmentTypeId: 1, createdById: 1, createdAt: '2026-06-09T07:50:00', priority: 'Red', status: 'Pending', referralDepartment: 'Psykiatrisk akutmottagning', referralContactName: 'Oskar Lind', referralContactPhone: '031-342 10 00' },
  { bookingId: -8, date: '2026-06-10T14:00:00', patientId: 8, treatmentTypeId: 7, createdById: 1, createdAt: '2026-06-09T08:12:00', priority: 'Green', status: 'Cancelled', referralDepartment: 'Affektiv mottagning', referralContactName: 'Johan Berg', referralContactPhone: '031-342 11 20' },
];

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDatetimeValue(isoStr: string) {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function createBookingSlots(startHour: number, startMinute: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const startMinutes = startHour * 60 + startMinute + index * 15;
  const endMinutes = startMinutes + 15;
  const formatMinutes = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

    return {
      value: formatMinutes(startMinutes),
      label: `${formatMinutes(startMinutes)}–${formatMinutes(endMinutes)}`,
    };
  });
}

const ECT_BOOKING_SLOTS = createBookingSlots(8, 0, 16);
const RTMS_BOOKING_SLOTS = createBookingSlots(13, 0, 11);

interface BookingModalProps {
  existing?: BookingDto;
  bookings: BookingDto[];
  onClose: () => void;
  onPreviewCreate?: (dto: CreateBookingDto) => void;
}

function isSlotOccupied(bookings: BookingDto[], date: string, excludeBookingId?: number) {
  return bookings.some((booking) =>
    booking.status !== 'Cancelled'
    && booking.bookingId !== excludeBookingId
    && booking.date.slice(0, 16) === date.slice(0, 16)
  );
}

function BookingModal({ existing, bookings, onClose, onPreviewCreate }: BookingModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEdit = !!existing;

  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: getPatients });

  const [form, setForm] = useState<CreateBookingDto>({
    date: existing ? toLocalDatetimeValue(existing.date) : toLocalDatetimeValue(new Date().toISOString()),
    patientId: existing?.patientId ?? 0,
    treatmentTypeId: (existing?.treatmentTypeId ?? 1) as TreatmentType,
    createdById: existing?.createdById ?? Number(user?.id ?? 0),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    priority: existing?.priority ?? 'Green',
    status: existing?.status ?? 'Pending',
    referralDepartment: existing?.referralDepartment,
    referralContactName: existing?.referralContactName,
    referralContactPhone: existing?.referralContactPhone,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState(
    isEdit ? '' : '',
  );
  const bookingSlots = isEctType(form.treatmentTypeId) ? ECT_BOOKING_SLOTS : RTMS_BOOKING_SLOTS;
  const bookingWindowLabel = isEctType(form.treatmentTypeId)
    ? 'ECT: 08:00–12:00'
    : 'rTMS: 13:00–15:30';
  const selectedDate = form.date.slice(0, 10);
  const occupiedBookings = bookings.filter((booking) =>
    booking.status !== 'Cancelled'
    && booking.bookingId !== existing?.bookingId
    && booking.date.slice(0, 10) === selectedDate
  );
  const occupiedByTime = new Map(
    occupiedBookings.map((booking) => [
      booking.date.slice(11, 16),
      patients.find((patient) => patient.patientId === booking.patientId)?.fullName ?? 'Upptagen',
    ]),
  );
  const requestedTime = form.date.slice(11, 16);
  const selectedTime = bookingSlots.some((slot) => slot.value === requestedTime && !occupiedByTime.has(slot.value))
    ? requestedTime
    : bookingSlots.find((slot) => !occupiedByTime.has(slot.value))?.value ?? '';

  function updateDate(date: string) {
    const occupiedTimes = new Set(
      bookings
        .filter((booking) =>
          booking.status !== 'Cancelled'
          && booking.bookingId !== existing?.bookingId
          && booking.date.slice(0, 10) === date
        )
        .map((booking) => booking.date.slice(11, 16)),
    );
    const nextTime = selectedTime && !occupiedTimes.has(selectedTime)
      ? selectedTime
      : bookingSlots.find((slot) => !occupiedTimes.has(slot.value))?.value ?? '';
    setForm((current) => ({ ...current, date: `${date}T${nextTime}` }));
  }

  function updateTime(time: string) {
    setForm((current) => ({ ...current, date: `${selectedDate}T${time}` }));
  }

  function updateTreatmentType(treatmentTypeId: TreatmentType) {
    const slots = isEctType(treatmentTypeId) ? ECT_BOOKING_SLOTS : RTMS_BOOKING_SLOTS;
    const nextTime = slots.find((slot) => !occupiedByTime.has(slot.value))?.value ?? '';
    setForm((current) => ({
      ...current,
      treatmentTypeId,
      date: `${selectedDate}T${nextTime}`,
    }));
  }

  const createMutation = useMutation({
    mutationFn: async (dto: CreateBookingDto) => {
      const latestBookings = await getBookings();
      if (isSlotOccupied(latestBookings, dto.date)) throw new Error('SLOT_OCCUPIED');
      return createBooking(dto);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); onClose(); },
    onError: (error) => setSubmitError(
      error.message === 'SLOT_OCCUPIED'
        ? 'Tiden hann bokas av någon annan. Välj en annan ledig slot.'
        : 'Kunde inte spara bokning. Kontrollera att alla fält är ifyllda.',
    ),
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: CreateBookingDto) => {
      const latestBookings = await getBookings();
      if (isSlotOccupied(latestBookings, dto.date, existing!.bookingId)) throw new Error('SLOT_OCCUPIED');
      return updateBooking(existing!.bookingId, dto);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); onClose(); },
    onError: (error) => setSubmitError(
      error.message === 'SLOT_OCCUPIED'
        ? 'Tiden hann bokas av någon annan. Välj en annan ledig slot.'
        : 'Kunde inte spara bokning. Kontrollera att alla fält är ifyllda.',
    ),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedTime) {
      setSubmitError('Det finns inga lediga tider kvar på valt datum.');
      return;
    }
    const dto = { ...form, date: `${selectedDate}T${selectedTime}:00` };
    if (isSlotOccupied(bookings, dto.date, existing?.bookingId)) {
      setSubmitError('Den valda tiden är redan bokad. Välj en annan ledig slot.');
      return;
    }
    if (isEdit) {
      if (existing && (existing.status !== dto.status || existing.priority !== dto.priority)) {
        addHistoryEntry(existing.bookingId, {
          timestamp: new Date().toISOString(),
          fromStatus: existing.status,
          toStatus: dto.status,
          fromPriority: existing.priority,
          toPriority: dto.priority,
          cancellationReason: dto.status === 'Cancelled' ? cancellationReason || undefined : undefined,
        });
      }
      updateMutation.mutate(dto);
    } else if (onPreviewCreate) {
      onPreviewCreate(dto);
      onClose();
    } else {
      createMutation.mutate(dto);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#172033]/45 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#D8E0EA] w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A2332]">
            {isEdit ? 'Redigera bokning' : 'Ny bokning'}
          </h2>
          <button onClick={onClose} aria-label="Stäng dialog" className="text-[#8494AA] hover:text-[#1A2332] text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Behandlingstyp</label>
            <select
              required
              value={form.treatmentTypeId}
              onChange={(e) => updateTreatmentType(Number(e.target.value) as TreatmentType)}
              className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A]"
            >
              {TREATMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Datum & behandlingsslot</label>
            <div className="grid grid-cols-[1fr_1.15fr] gap-3">
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => updateDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A]"
              />
              <select
                required
                aria-label="Behandlingsslot"
                value={selectedTime}
                onChange={(e) => updateTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A]"
              >
                {!selectedTime && <option value="">Inga lediga tider</option>}
                <optgroup label="ECT — förmiddag 08:00–12:00">
                  {ECT_BOOKING_SLOTS.map((slot) => {
                    const wrongTreatment = !isEctType(form.treatmentTypeId);
                    const occupied = occupiedByTime.has(slot.value);
                    return (
                      <option key={`ect-${slot.value}`} value={slot.value} disabled={wrongTreatment || occupied}>
                        {slot.label}
                        {wrongTreatment ? ' — välj en ECT-behandling' : occupied ? ` — Upptagen (${occupiedByTime.get(slot.value)})` : ''}
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="rTMS — eftermiddag 13:00–15:30">
                  {RTMS_BOOKING_SLOTS.map((slot) => {
                    const wrongTreatment = isEctType(form.treatmentTypeId);
                    const occupied = occupiedByTime.has(slot.value);
                    return (
                      <option key={`rtms-${slot.value}`} value={slot.value} disabled={wrongTreatment || occupied}>
                        {slot.label}
                        {wrongTreatment ? ' — välj en rTMS-behandling' : occupied ? ` — Upptagen (${occupiedByTime.get(slot.value)})` : ''}
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>
            <p className="mt-1.5 text-xs text-[#7A8797]">
              Vald behandling: {bookingWindowLabel}. Upptagna slotar är låsta.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Patient</label>
            <select
              required
              value={form.patientId || ''}
              onChange={(e) => setForm((f) => ({ ...f, patientId: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A]"
            >
              <option value="">Välj patient...</option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Prioritet</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as BookingPriority }))}
                className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A]"
              >
                <option value="Green">Grön</option>
                <option value="Yellow">Gul</option>
                <option value="Red">Röd</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookingStatus }))}
                className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A]"
              >
                <option value="Pending">Väntande</option>
                <option value="Confirmed">Bekräftad</option>
                <option value="Cancelled">Avbokad</option>
              </select>
            </div>
          </div>

          {isEdit && form.status === 'Cancelled' && (
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">
                Avbokningsorsak <span className="font-normal text-[#8494AA]">(valfritt)</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
                placeholder="T.ex. Patienten avböjde, felbokning, sjukdom..."
                className="w-full px-3 py-2.5 bg-[#F9FBFD] border border-[#D8E0EA] rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]/30 focus:border-[#1A4F8A] resize-none"
              />
            </div>
          )}

          {submitError && (
            <div className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#D8E0EA] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedTime}
              className="flex-1 px-4 py-2.5 bg-[#185FA5] text-white rounded-lg text-sm font-semibold shadow-md shadow-[#185FA5]/20 hover:bg-[#124F8A] hover:shadow-lg transition-all disabled:opacity-60"
            >
              {isPending ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Skapa bokning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; booking?: BookingDto }>({ open: false });
  const [confirmDialog, setConfirmDialog] = useState<{ bookingId: number } | null>(null);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [previewBookings, setPreviewBookings] = useState<BookingDto[]>(getDemoBookings);
  const [createdMessage, setCreatedMessage] = useState('');

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: getBookings,
    refetchInterval: 5_000,
  });
  const patientsQuery = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const apiBookings = bookingsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const isLoading = bookingsQuery.isLoading;
  const usingMockData = DEMO_MODE && !bookingsQuery.isError && !isLoading && apiBookings.length === 0;
  const bookings = usingMockData ? [...previewBookings, ...MOCK_BOOKINGS] : apiBookings;
  const backendUnavailable = bookingsQuery.isError || patientsQuery.isError;

  function addPreviewBooking(dto: CreateBookingDto) {
    const booking = addDemoBooking(dto);
    setPreviewBookings((current) => [booking, ...current]);
    setCreatedMessage('Bokningen skapades och har lagts till i listan.');
    setFilter('all');
  }

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const patientMap = Object.fromEntries(patients.map((p) => [p.patientId, p]));
  // Hämtar metadata så varje bokningsrad kan visa avdelning/kontakt.
  const referralMetaByBookingId = getAllBookingReferralMeta();
  const historyByBookingId = getAllBookingHistory();

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 min-h-screen bg-[#F3F6FA]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Bokningar</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-[#8494AA]">{bookings.length} totalt</p>
            {usingMockData && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#EAF4FC] text-[#185FA5]">
                Exempeldata
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          disabled={backendUnavailable && !usingMockData}
          className="bg-[#185FA5] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-[0_5px_14px_rgba(24,95,165,0.24)] hover:bg-[#124F8A] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(24,95,165,0.30)] active:translate-y-0 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          + Ny bokning
        </button>
      </div>

      {createdMessage && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-[#9CD5B8] bg-[#E8F6EE] text-[#147A4B] text-sm font-medium shadow-[0_4px_12px_rgba(20,122,75,0.10)]">
          {createdMessage}
        </div>
      )}

      {backendUnavailable && !usingMockData && (
        <div className="mb-4">
          <BackendErrorState
            error={bookingsQuery.error ?? patientsQuery.error}
            onRetry={() => {
              void bookingsQuery.refetch();
              void patientsQuery.refetch();
            }}
          />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', 'Pending', 'Confirmed', 'Cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              filter === s
                ? 'bg-[#185FA5] text-white shadow-[0_3px_9px_rgba(24,95,165,0.22)]'
                : 'bg-white border border-[#D8E0EA] text-[#4B5770] shadow-[0_2px_6px_rgba(23,32,51,0.05)] hover:-translate-y-px hover:border-[#8FA9C5] hover:bg-[#F5F9FD] hover:text-[#185FA5]'
            }`}
          >
            {s === 'all' ? 'Alla' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[#D3DCE7] shadow-[0_8px_24px_rgba(23,32,51,0.09)] overflow-hidden">
        {backendUnavailable && !usingMockData ? (
          <div className="p-8 text-center text-sm font-medium text-[#854D0E]">Data visas igen när anslutningen fungerar.</div>
        ) : isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-sm text-[#8494AA]">
            <Spinner size={18} />
            Laddar bokningar...
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8494AA]">Inga bokningar hittades.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#D8E0EA] bg-[#F7F9FC]">
                  <th scope="col" className="px-4 py-3 w-36">Datum & tid</th>
                  <th scope="col" className="px-4 py-3">Patient</th>
                  <th scope="col" className="px-4 py-3">Behandling</th>
                  <th scope="col" className="px-4 py-3">Prioritet / Status</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Åtgärder</span></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b) => {
                  const patient = patientMap[b.patientId];
                  const typeName = TREATMENT_TYPE_LABELS[b.treatmentTypeId] ?? `Typ ${b.treatmentTypeId}`;
                  const referralMeta = getReferralMetaForBooking(b, referralMetaByBookingId[b.bookingId]);
                  const history: BookingHistoryEntry[] = historyByBookingId[b.bookingId] ?? [];
                  const cancellationReason = b.status === 'Cancelled'
                    ? history.find((e) => e.cancellationReason)?.cancellationReason
                    : undefined;
                  const isExpanded = expandedHistoryId === b.bookingId;

                  return (
                    <Fragment key={b.bookingId}>
                      <tr
                        className={`group border-b border-[#E1E7EF] transition-all duration-150 ${
                          b.bookingId < -1000
                            ? 'bg-[#EAF4FC] shadow-[inset_4px_0_0_#185FA5] hover:bg-[#E1F0FB]'
                            : 'bg-white hover:bg-[#F5F9FD] hover:shadow-[inset_4px_0_0_#8FA9C5]'
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-[#4B5770] whitespace-nowrap group-hover:text-[#185FA5] transition-colors">{formatDateTime(b.date)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-[#1A2332] group-hover:text-[#124F8A] transition-colors">{patient?.fullName ?? `#${b.patientId}`}</div>
                          <div className="text-xs text-[#8494AA] font-mono">{patient?.socialSecurityNumber ?? '–'}</div>
                          {referralMeta?.department && (
                            <div className="text-xs text-[#8494AA] mt-0.5">{referralMeta.department}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4B5770]">{typeName}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ring-1 ring-inset ring-black/5 ${PRIORITY_STYLES[b.priority]}`}>
                              {PRIORITY_LABELS[b.priority]}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ring-1 ring-inset ring-black/5 ${STATUS_STYLES[b.status]}`}>
                              {STATUS_LABELS[b.status]}
                            </span>
                            {cancellationReason && (
                              <span className="text-xs text-[#8494AA] italic mt-0.5 max-w-[160px]" title={cancellationReason}>
                                {cancellationReason.length > 40 ? cancellationReason.slice(0, 40) + '…' : cancellationReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {history.length > 0 && (
                              <button
                                onClick={() => setExpandedHistoryId(isExpanded ? null : b.bookingId)}
                                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                                  isExpanded
                                    ? 'bg-[#E9EFF5] text-[#526174] ring-1 ring-[#B8C4D3]'
                                    : 'bg-[#F3F6FA] text-[#526174] hover:bg-[#E9EFF5] hover:-translate-y-px'
                                }`}
                              >
                                Historik ({history.length})
                              </button>
                            )}
                            {b.bookingId > 0 ? (
                              <>
                                <button
                                  onClick={() => setModal({ open: true, booking: b })}
                                  className="rounded-md bg-[#EAF4FC] px-2.5 py-1.5 text-xs font-semibold text-[#185FA5] hover:bg-[#D7EAF9] hover:-translate-y-px transition-all whitespace-nowrap"
                                >
                                  Redigera
                                </button>
                                <button
                                  onClick={() => setConfirmDialog({ bookingId: b.bookingId })}
                                  className="rounded-md bg-[#FDEAEA] px-2.5 py-1.5 text-xs font-semibold text-[#C42B2B] hover:bg-[#F8D5D7] hover:-translate-y-px transition-all"
                                >
                                  Radera
                                </button>
                              </>
                            ) : (
                              <span className="rounded-md bg-[#F0F4F8] px-2.5 py-1.5 text-xs font-medium text-[#64748B]">Exempel</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b border-[#E1E7EF] bg-[#F7F9FC]">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="text-xs font-semibold text-[#526174] uppercase tracking-wider mb-2">
                              Statushistorik
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {history.map((entry, i) => (
                                <div key={i} className="flex flex-wrap items-start gap-x-3 gap-y-0.5 text-xs text-[#4B5770]">
                                  <span className="font-mono text-[#8494AA] whitespace-nowrap">
                                    {new Date(entry.timestamp).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                  <span>
                                    <span className={`font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLES[entry.fromStatus]}`}>{STATUS_LABELS[entry.fromStatus]}</span>
                                    <span className="mx-1 text-[#B8C4D3]">→</span>
                                    <span className={`font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLES[entry.toStatus]}`}>{STATUS_LABELS[entry.toStatus]}</span>
                                  </span>
                                  {(entry.fromPriority !== entry.toPriority) && (
                                    <span className="text-[#8494AA]">
                                      prioritet: {PRIORITY_LABELS[entry.fromPriority]} → {PRIORITY_LABELS[entry.toPriority]}
                                    </span>
                                  )}
                                  {entry.cancellationReason && (
                                    <span className="italic text-[#8494AA]">Orsak: {entry.cancellationReason}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <BookingModal
          existing={modal.booking}
          bookings={bookings}
          onClose={() => setModal({ open: false })}
          onPreviewCreate={usingMockData && !modal.booking ? addPreviewBooking : undefined}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title="Radera bokning"
          message="Bokningen tas bort permanent och kan inte återställas."
          confirmLabel="Radera"
          onConfirm={() => {
            deleteBookingReferralMeta(confirmDialog.bookingId);
            deleteMutation.mutate(confirmDialog.bookingId);
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
