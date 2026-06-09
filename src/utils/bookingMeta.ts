import type { BookingDto } from '../types';

// Metadata för remissen som backend ännu inte sparar i BookingDto.
// Den används för att visa vilken avdelning/enhet som har bokat patienten.
export interface BookingReferralMeta {
  department: string;
  contactName: string;
  contactPhone: string;
}

// Nyckeln där metadata sparas i webbläsarens localStorage.
const STORAGE_KEY = 'bookingReferralMeta';

// Objekt där varje bookingId pekar på sin remissmetadata.
type BookingMetaMap = Record<number, BookingReferralMeta>;

// Läser all metadata från localStorage.
// try/catch gör att appen inte kraschar om lagringen är tom eller trasig.
function readMetaMap(): BookingMetaMap {
  try {
    // Hämtar JSON-strängen från localStorage.
    const raw = localStorage.getItem(STORAGE_KEY);

    // Om det finns data parsas den, annars returneras ett tomt objekt.
    return raw ? JSON.parse(raw) : {};
  } catch {
    // Fallback om JSON inte går att läsa.
    return {};
  }
}

// Skriver hela metadata-objektet tillbaka till localStorage.
function writeMetaMap(map: BookingMetaMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// Hämtar metadata för en specifik bokning.
export function getBookingReferralMeta(bookingId: number): BookingReferralMeta | undefined {
  return readMetaMap()[bookingId];
}

// Hämtar all metadata så dashboard och bokningslista kan slå upp flera bokningar.
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

// Sparar eller uppdaterar metadata för en bokning.
export function saveBookingReferralMeta(bookingId: number, meta: BookingReferralMeta) {
  // Läs befintliga metadata först så vi inte skriver över andra bokningar.
  const map = readMetaMap();

  // Koppla metadata till rätt bookingId.
  map[bookingId] = meta;

  // Spara tillbaka hela objektet.
  writeMetaMap(map);
}

// Tar bort metadata när en bokning tas bort.
export function deleteBookingReferralMeta(bookingId: number) {
  const map = readMetaMap();
  delete map[bookingId];
  writeMetaMap(map);
}
