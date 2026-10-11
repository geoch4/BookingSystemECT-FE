import type { BookingDto } from '../types';
import type { RtmsSessionPlan } from './rtmsTreatmentPlan';

// Legacy demo fallback for referral metadata. Real environments should use the
// metadata returned on BookingDto from the backend.
export interface BookingReferralMeta {
  department: string;
  contactName: string;
  contactPhone: string;
  rtmsSessionPlan?: RtmsSessionPlan;
}

const STORAGE_KEY = 'bookingReferralMeta';

type BookingMetaMap = Record<number, BookingReferralMeta>;

function readMetaMap(): BookingMetaMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMetaMap(map: BookingMetaMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getBookingReferralMeta(bookingId: number, enabled = true): BookingReferralMeta | undefined {
  if (!enabled) return undefined;
  return readMetaMap()[bookingId];
}

export function getAllBookingReferralMeta(enabled = true): BookingMetaMap {
  if (!enabled) return {};
  return readMetaMap();
}

export function getReferralMetaForBooking(
  booking: BookingDto,
  legacyMeta?: BookingReferralMeta
): BookingReferralMeta | undefined {
  const department = booking.referralDepartment ?? legacyMeta?.department;
  const contactName = booking.referralContactName ?? legacyMeta?.contactName ?? '';
  const contactPhone = booking.referralContactPhone ?? legacyMeta?.contactPhone ?? '';

  if (!department && !contactName && !contactPhone) return undefined;

  return {
    department: department ?? '',
    contactName,
    contactPhone,
    rtmsSessionPlan: legacyMeta?.rtmsSessionPlan,
  };
}

export function saveBookingReferralMeta(bookingId: number, meta: BookingReferralMeta) {
  const map = readMetaMap();
  map[bookingId] = meta;
  writeMetaMap(map);
}

export function deleteBookingReferralMeta(bookingId: number) {
  const map = readMetaMap();
  delete map[bookingId];
  writeMetaMap(map);
}
