import client from './client';
import type { BookingDto, BookingPriority, BookingStatus, CreateBookingDto } from '../types';

// ─── Booking API ──────────────────────────────────────────────────────────────
// Den här filen samlar alla API-anrop som handlar om bokningar.
// Alla funktioner använder samma axios-klient från client.ts.

// C# enum-värden (default ordinal): Green=0,Yellow=1,Red=2 / Pending=0,Confirmed=1,Cancelled=2
const PRIORITY_MAP: Record<string, number> = { Green: 0, Yellow: 1, Red: 2 };
const STATUS_MAP: Record<string, number> = { Pending: 0, Confirmed: 1, Cancelled: 2 };

const PRIORITY_FROM_INT: Record<number, BookingPriority> = { 0: 'Green', 1: 'Yellow', 2: 'Red' };
const STATUS_FROM_INT: Record<number, BookingStatus> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled' };

function toBackendDto(dto: CreateBookingDto) {
  const { treatmentTypeId, ...rest } = dto;
  return {
    ...rest,
    // Backendens enum är nollbaserad medan frontend använder värdena 1–7.
    treatmentType: treatmentTypeId - 1,
    priority: PRIORITY_MAP[dto.priority as string] ?? 0,
    status: STATUS_MAP[dto.status as string] ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBooking(b: any): BookingDto {
  return {
    ...b,
    treatmentTypeId: b.treatmentTypeId
      ?? (typeof b.treatmentType === 'number' ? b.treatmentType + 1 : 1),
    priority: typeof b.priority === 'number' ? (PRIORITY_FROM_INT[b.priority] ?? 'Green') : b.priority,
    status: typeof b.status === 'number' ? (STATUS_FROM_INT[b.status] ?? 'Pending') : b.status,
  };
}

// Hämtar alla bokningar från backend.
// GET /api/booking
export const getBookings = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.get<any[]>('/booking').then((r) => r.data.map(normalizeBooking));

// Hämtar en specifik bokning baserat på bookingId.
// GET /api/booking/{id}
export const getBookingById = (id: number) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.get<any>(`/booking/${id}`).then((r) => normalizeBooking(r.data));

// Skapar en ny bokning.
// dto innehåller datum, patientId, behandlingstyp, prioritet och status.
// POST /api/booking
export const createBooking = (dto: CreateBookingDto) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.post<any>('/booking', toBackendDto(dto)).then((r) => normalizeBooking(r.data));

// Uppdaterar en befintlig bokning.
// id säger vilken bokning som ska ändras.
// dto skickar de nya värdena till backend.
// PUT /api/booking/{id}
export const updateBooking = (id: number, dto: CreateBookingDto) =>
  client.put(`/booking/${id}`, toBackendDto(dto));

// Raderar en bokning.
// DELETE /api/booking/{id}
export const deleteBooking = (id: number) =>
  client.delete(`/booking/${id}`);
