import type { BookingDto } from '../types';

// Metadata for the referral that the backend doesn't yet store in BookingDto.
// Used to show which department/unit booked the patient.
export interface BookingReferralMeta {
  department: string;
  contactName: string;
  contactPhone: string;
}

// The key under which metadata is stored in the browser's localStorage.
const STORAGE_KEY = 'bookingReferralMeta';

// Object where each bookingId points to its referral metadata.
type BookingMetaMap = Record<number, BookingReferralMeta>;

// Reads all metadata from localStorage.
// try/catch keeps the app from crashing if storage is empty or corrupted.
function readMetaMap(): BookingMetaMap {
  try {
    // Get the JSON string from localStorage.
    const raw = localStorage.getItem(STORAGE_KEY);

    // If data exists, parse it; otherwise return an empty object.
    return raw ? JSON.parse(raw) : {};
  } catch {
    // Fallback if the JSON can't be read.
    return {};
  }
}

// Writes the whole metadata object back to localStorage.
function writeMetaMap(map: BookingMetaMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// Fetches metadata for a specific booking.
export function getBookingReferralMeta(bookingId: number): BookingReferralMeta | undefined {
  return readMetaMap()[bookingId];
}

// Fetches all metadata so the dashboard and booking list can look up several bookings.
export function getAllBookingReferralMeta(): BookingMetaMap {
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
  };
}

// Saves or updates metadata for a booking.
export function saveBookingReferralMeta(bookingId: number, meta: BookingReferralMeta) {
  // Read the existing metadata first so we don't overwrite other bookings.
  const map = readMetaMap();

  // Attach the metadata to the right bookingId.
  map[bookingId] = meta;

  // Save the whole object back.
  writeMetaMap(map);
}

// Removes metadata when a booking is deleted.
export function deleteBookingReferralMeta(bookingId: number) {
  const map = readMetaMap();
  delete map[bookingId];
  writeMetaMap(map);
}
