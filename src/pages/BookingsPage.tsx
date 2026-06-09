import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings, createBooking, updateBooking, deleteBooking } from '../api/bookings';
import { getPatients } from '../api/patients';
import { useAuth } from '../context/useAuth';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto, TreatmentType } from '../types';
import { TREATMENT_TYPE_OPTIONS, TREATMENT_TYPE_LABELS } from '../types';
// Används för att visa backend-metadata med lokal fallback för äldre bokningar.
import { deleteBookingReferralMeta, getAllBookingReferralMeta, getReferralMetaForBooking } from '../utils/bookingMeta';

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
  { bookingId: -1, date: '2026-06-09T09:00:00', patientId: 1, treatmentType: 4, createdById: 1, createdAt: '2026-06-08T08:10:00', priority: 'Red', status: 'Confirmed', referralDepartment: 'Avdelning 361', referralContactName: 'Anna Sjöberg', referralContactPhone: '031-342 10 61' },
  { bookingId: -2, date: '2026-06-09T09:15:00', patientId: 2, treatmentType: 2, createdById: 1, createdAt: '2026-06-08T08:24:00', priority: 'Yellow', status: 'Confirmed', referralDepartment: 'Avdelning 362', referralContactName: 'Erik Lund', referralContactPhone: '031-342 10 62' },
  { bookingId: -3, date: '2026-06-09T09:30:00', patientId: 3, treatmentType: 3, createdById: 1, createdAt: '2026-06-08T09:05:00', priority: 'Green', status: 'Pending', referralDepartment: 'Öppenvård affektiva', referralContactName: 'Sara Holm', referralContactPhone: '031-342 10 40' },
  { bookingId: -4, date: '2026-06-09T10:00:00', patientId: 4, treatmentType: 2, createdById: 1, createdAt: '2026-06-08T09:42:00', priority: 'Green', status: 'Confirmed', referralDepartment: 'Avdelning 360', referralContactName: 'Maria Ek', referralContactPhone: '031-342 10 60' },
  { bookingId: -5, date: '2026-06-09T13:00:00', patientId: 5, treatmentType: 5, createdById: 1, createdAt: '2026-06-08T10:15:00', priority: 'Green', status: 'Confirmed', referralDepartment: 'Affektiv mottagning', referralContactName: 'Johan Berg', referralContactPhone: '031-342 11 20' },
  { bookingId: -6, date: '2026-06-09T13:30:00', patientId: 6, treatmentType: 6, createdById: 1, createdAt: '2026-06-08T10:38:00', priority: 'Yellow', status: 'Pending', referralDepartment: 'OCD-mottagningen', referralContactName: 'Elin Nord', referralContactPhone: '031-342 11 30' },
  { bookingId: -7, date: '2026-06-10T09:00:00', patientId: 7, treatmentType: 1, createdById: 1, createdAt: '2026-06-09T07:50:00', priority: 'Red', status: 'Pending', referralDepartment: 'Psykiatrisk akutmottagning', referralContactName: 'Oskar Lind', referralContactPhone: '031-342 10 00' },
  { bookingId: -8, date: '2026-06-10T14:00:00', patientId: 8, treatmentType: 7, createdById: 1, createdAt: '2026-06-09T08:12:00', priority: 'Green', status: 'Cancelled', referralDepartment: 'Affektiv mottagning', referralContactName: 'Johan Berg', referralContactPhone: '031-342 11 20' },
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

interface BookingModalProps {
  existing?: BookingDto;
  onClose: () => void;
}

function BookingModal({ existing, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEdit = !!existing;

  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: getPatients });

  const [form, setForm] = useState<CreateBookingDto>({
    date: existing ? toLocalDatetimeValue(existing.date) : toLocalDatetimeValue(new Date().toISOString()),
    patientId: existing?.patientId ?? 0,
    treatmentType: (existing?.treatmentType ?? 1) as TreatmentType,
    createdById: existing?.createdById ?? Number(user?.id ?? 0),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    priority: existing?.priority ?? 'Green',
    status: existing?.status ?? 'Pending',
    referralDepartment: existing?.referralDepartment,
    referralContactName: existing?.referralContactName,
    referralContactPhone: existing?.referralContactPhone,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); onClose(); },
    onError: () => setSubmitError('Kunde inte spara bokning. Kontrollera att alla fält är ifyllda.'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: CreateBookingDto) => updateBooking(existing!.bookingId, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); onClose(); },
    onError: () => setSubmitError('Kunde inte spara bokning. Kontrollera att alla fält är ifyllda.'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setSubmitError(null);
    const dto = { ...form, date: form.date + ':00' };
    if (isEdit) updateMutation.mutate(dto);
    else createMutation.mutate(dto);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A2332]">
            {isEdit ? 'Redigera bokning' : 'Ny bokning'}
          </h2>
          <button onClick={onClose} className="text-[#8494AA] hover:text-[#1A2332] text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Datum &amp; tid</label>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Patient</label>
            <select
              required
              value={form.patientId || ''}
              onChange={(e) => setForm((f) => ({ ...f, patientId: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            >
              <option value="">Välj patient...</option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Behandlingstyp</label>
            <select
              required
              value={form.treatmentType}
              onChange={(e) => setForm((f) => ({ ...f, treatmentType: Number(e.target.value) as TreatmentType }))}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            >
              {TREATMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Prioritet</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as BookingPriority }))}
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
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
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
              >
                <option value="Pending">Väntande</option>
                <option value="Confirmed">Bekräftad</option>
                <option value="Cancelled">Avbokad</option>
              </select>
            </div>
          </div>

          {submitError && (
            <div className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-60"
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
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');

  const { data: apiBookings = [], isLoading } = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: getPatients });
  const usingMockData = !isLoading && apiBookings.length === 0;
  const bookings = usingMockData ? MOCK_BOOKINGS : apiBookings;

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const patientMap = Object.fromEntries(patients.map((p) => [p.patientId, p]));
  // Hämtar metadata så varje bokningsrad kan visa avdelning/kontakt.
  const referralMetaByBookingId = getAllBookingReferralMeta();

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
          className="bg-[#1A4F8A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors"
        >
          + Ny bokning
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'Pending', 'Confirmed', 'Cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-[#1A4F8A] text-white'
                : 'bg-white border border-[#DDE3EC] text-[#4B5770] hover:bg-[#F0F4F8]'
            }`}
          >
            {s === 'all' ? 'Alla' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#DDE3EC]">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#8494AA]">Laddar...</div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8494AA]">Inga bokningar hittades.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
                  <th className="px-4 py-3">Datum &amp; tid</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Personnummer</th>
                  <th className="px-4 py-3">Avdelning</th>
                  <th className="px-4 py-3">Behandling</th>
                  <th className="px-4 py-3">Prioritet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b) => {
                  const patient = patientMap[b.patientId];
                  const typeName = TREATMENT_TYPE_LABELS[b.treatmentType] ?? `Typ ${b.treatmentType}`;
                  // Slår upp avdelningsinfo från backend, med lokal fallback för äldre bokningar.
                  const referralMeta = getReferralMetaForBooking(b, referralMetaByBookingId[b.bookingId]);
                  return (
                    <tr key={b.bookingId} className="border-b border-[#DDE3EC] hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-[#4B5770]">{formatDateTime(b.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1A2332]">{patient?.fullName ?? `#${b.patientId}`}</td>
                      <td className="px-4 py-3 text-sm text-[#8494AA] font-mono">{patient?.socialSecurityNumber ?? '–'}</td>
                      {/* Avdelningskolumnen visar vem som har remitterat/bokat patienten. */}
                      <td className="px-4 py-3 text-sm text-[#4B5770]">
                        <div className="font-medium text-[#1A2332]">{referralMeta?.department ?? 'Ej angiven'}</div>
                        {(referralMeta?.contactName || referralMeta?.contactPhone) && (
                          <div className="text-xs text-[#8494AA]">
                            {referralMeta.contactName || 'Kontakt'}{referralMeta.contactPhone ? ` · ${referralMeta.contactPhone}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#4B5770]">{typeName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${PRIORITY_STYLES[b.priority]}`}>
                          {PRIORITY_LABELS[b.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {b.bookingId > 0 ? (
                            <>
                              <button
                                onClick={() => setModal({ open: true, booking: b })}
                                className="text-xs text-[#1A4F8A] hover:underline"
                              >
                                Redigera
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Radera denna bokning?')) {
                                    // Radera även lokal metadata så gammal avdelningsinfo inte ligger kvar.
                                    deleteBookingReferralMeta(b.bookingId);
                                    deleteMutation.mutate(b.bookingId);
                                  }
                                }}
                                className="text-xs text-[#C42B2B] hover:underline"
                              >
                                Radera
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-[#8494AA]">Exempel</span>
                          )}
                        </div>
                      </td>
                    </tr>
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
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
