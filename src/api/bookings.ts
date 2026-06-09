import client from './client';
import type { BookingDto, CreateBookingDto } from '../types';

// ─── Booking API ──────────────────────────────────────────────────────────────
// Den här filen samlar alla API-anrop som handlar om bokningar.
// Alla funktioner använder samma axios-klient från client.ts.

// Hämtar alla bokningar från backend.
// GET /api/booking
export const getBookings = () =>
  client.get<BookingDto[]>('/booking').then((r) => r.data);

// Hämtar en specifik bokning baserat på bookingId.
// GET /api/booking/{id}
export const getBookingById = (id: number) =>
  client.get<BookingDto>(`/booking/${id}`).then((r) => r.data);

// Skapar en ny bokning.
// dto innehåller datum, patientId, behandlingstyp, prioritet och status.
// POST /api/booking
export const createBooking = (dto: CreateBookingDto) =>
  client.post<BookingDto>('/booking', dto).then((r) => r.data);

// Uppdaterar en befintlig bokning.
// id säger vilken bokning som ska ändras.
// dto skickar de nya värdena till backend.
// PUT /api/booking/{id}
export const updateBooking = (id: number, dto: CreateBookingDto) =>
  client.put(`/booking/${id}`, dto);

// Raderar en bokning.
// DELETE /api/booking/{id}
export const deleteBooking = (id: number) =>
  client.delete(`/booking/${id}`);
