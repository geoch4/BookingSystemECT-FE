import client from './client';
import type {
  AssessmentStatus,
  BookingDto,
  BookingPriority,
  BookingStatus,
  CreateBookingDto,
} from '../types';

export interface AuditRequestOptions {
  auditReason?: string;
}

// ─── Booking API ──────────────────────────────────────────────────────────────
// This file collects all API requests related to bookings.
// All functions use the same axios client from client.ts.

// C# enum values: Green=0,Yellow=1,Red=2 / Pending=0,Confirmed=1,Cancelled=2
// AssessmentStatus in backend: NotStarted=0,InProgress=1,Approved=2,Rejected=3.
const PRIORITY_MAP: Record<string, number> = { Green: 0, Yellow: 1, Red: 2 };
const STATUS_MAP: Record<string, number> = { Pending: 0, Confirmed: 1, Cancelled: 2 };
const ASSESSMENT_MAP: Record<string, number> = {
  NotStarted: 0,
  Incomplete: 1,
  Complete: 2,
  NotRequired: 2,
};

const PRIORITY_FROM_INT: Record<number, BookingPriority> = { 0: 'Green', 1: 'Yellow', 2: 'Red' };
const STATUS_FROM_INT: Record<number, BookingStatus> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled' };
const ASSESSMENT_FROM_INT: Record<number, AssessmentStatus> = {
  0: 'NotStarted',
  1: 'Incomplete',
  2: 'Complete',
  3: 'Incomplete',
};

function toBackendDto(dto: CreateBookingDto) {
  const { treatmentTypeId, ...rest } = dto;
  return {
    ...rest,
    treatmentType: treatmentTypeId,
    priority: PRIORITY_MAP[dto.priority as string] ?? 0,
    status: STATUS_MAP[dto.status as string] ?? 0,
    healthDeclarationStatus: ASSESSMENT_MAP[dto.healthDeclarationStatus ?? 'NotStarted'] ?? 0,
    anesthesiaAssessmentStatus: ASSESSMENT_MAP[dto.anesthesiaAssessmentStatus ?? 'NotStarted'] ?? 0,
    sourceSystem: dto.sourceSystem ?? 'Manual',
    integrationStatus: dto.integrationStatus ?? 'Manual',
  };
}

function auditConfig(options?: AuditRequestOptions) {
  const reason = options?.auditReason?.trim();
  return reason
    ? { headers: { 'X-Audit-Reason': reason } }
    : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBooking(b: any): BookingDto {
  return {
    ...b,
    treatmentTypeId: b.treatmentTypeId
      ?? (typeof b.treatmentType === 'number' ? b.treatmentType : 1),
    priority: typeof b.priority === 'number' ? (PRIORITY_FROM_INT[b.priority] ?? 'Green') : b.priority,
    status: typeof b.status === 'number' ? (STATUS_FROM_INT[b.status] ?? 'Pending') : b.status,
    healthDeclarationStatus: typeof b.healthDeclarationStatus === 'number'
      ? (ASSESSMENT_FROM_INT[b.healthDeclarationStatus] ?? 'NotStarted')
      : b.healthDeclarationStatus,
    anesthesiaAssessmentStatus: typeof b.anesthesiaAssessmentStatus === 'number'
      ? (ASSESSMENT_FROM_INT[b.anesthesiaAssessmentStatus] ?? 'NotStarted')
      : b.anesthesiaAssessmentStatus,
    sourceSystem: b.sourceSystem ?? 'Manual',
    integrationStatus: b.integrationStatus ?? 'Manual',
  };
}

// Fetches all bookings from the backend.
// GET /api/booking
export const getBookings = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.get<any[]>('/booking').then((r) => r.data.map(normalizeBooking));

// Fetches a specific booking by bookingId.
// GET /api/booking/{id}
export const getBookingById = (id: number) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.get<any>(`/booking/${id}`).then((r) => normalizeBooking(r.data));

// Creates a new booking.
// dto contains date, patientId, treatment type, priority, and status.
// POST /api/booking
export const createBooking = (dto: CreateBookingDto, options?: AuditRequestOptions) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.post<any>('/booking', toBackendDto(dto), auditConfig(options)).then((r) => normalizeBooking(r.data));

// Updates an existing booking.
// id identifies which booking to change.
// dto sends the new values to the backend.
// PUT /api/booking/{id}
export const updateBooking = (id: number, dto: CreateBookingDto, options?: AuditRequestOptions) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client.put<any>(`/booking/${id}`, toBackendDto(dto), auditConfig(options)).then((r) => r.data ? normalizeBooking(r.data) : undefined);

// Deletes a booking.
// DELETE /api/booking/{id}
export const deleteBooking = (id: number, options?: AuditRequestOptions) =>
  client.delete(`/booking/${id}`, auditConfig(options));
