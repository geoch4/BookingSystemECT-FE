import type { BookingDto, CreateBookingDto } from '../types';

const STORAGE_KEY = 'ect-demo-bookings';

function ymdWithTime(dayOffset: number, time: string) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return `${date.toISOString().slice(0, 10)}T${time}:00`;
}

function createSeedBooking(
  bookingId: number,
  dayOffset: number,
  time: string,
  patientId: number,
  treatmentTypeId: BookingDto['treatmentTypeId'],
  priority: BookingDto['priority'],
  status: BookingDto['status'],
  referralDepartment: string,
): BookingDto {
  return {
    bookingId,
    date: ymdWithTime(dayOffset, time),
    patientId,
    treatmentTypeId,
    createdById: 1,
    createdAt: new Date().toISOString(),
    priority,
    status,
    referralDepartment,
    referralContactName: 'Demo Kontakt',
    referralContactPhone: '031-000 00 00',
  };
}

function createSeedBookings(): BookingDto[] {
  return [
    createSeedBooking(-1020, 0, '08:00', 20, 1, 'Yellow', 'Pending', 'Avdelning 362'),
    createSeedBooking(-1021, 0, '08:15', 21, 2, 'Green', 'Confirmed', 'Avdelning 361'),
    createSeedBooking(-1022, 0, '08:30', 22, 3, 'Green', 'Confirmed', 'Avdelning 360'),
    createSeedBooking(-1023, 0, '08:45', 23, 4, 'Green', 'Confirmed', 'Avdelning 80'),
    createSeedBooking(-1001, 0, '09:00', 1, 2, 'Green', 'Confirmed', 'Avdelning 361'),
    createSeedBooking(-1002, 0, '09:15', 2, 1, 'Red', 'Pending', 'Psykiatrisk akutmottagning'),
    createSeedBooking(-1024, 0, '09:30', 24, 2, 'Green', 'Confirmed', 'Avdelning 362'),
    createSeedBooking(-1025, 0, '09:45', 25, 3, 'Yellow', 'Pending', 'Avdelning 361'),
    createSeedBooking(-1003, 0, '10:00', 3, 3, 'Yellow', 'Pending', 'Avdelning 362'),
    createSeedBooking(-1026, 0, '10:15', 26, 1, 'Green', 'Confirmed', 'Avdelning 360'),
    createSeedBooking(-1027, 0, '10:30', 27, 2, 'Green', 'Confirmed', 'Avdelning 361'),
    createSeedBooking(-1028, 0, '10:45', 28, 4, 'Green', 'Pending', 'Avdelning 80'),
    createSeedBooking(-1029, 0, '11:00', 29, 2, 'Green', 'Confirmed', 'Avdelning 362'),
    createSeedBooking(-1030, 0, '11:15', 30, 3, 'Yellow', 'Pending', 'Avdelning 361'),
    createSeedBooking(-1031, 0, '11:30', 31, 1, 'Green', 'Confirmed', 'Avdelning 360'),
    createSeedBooking(-1032, 0, '11:45', 32, 2, 'Red', 'Pending', 'Psykiatrisk akutmottagning'),
    createSeedBooking(-1004, 0, '13:00', 4, 5, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1033, 0, '13:15', 33, 6, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1005, 0, '13:30', 5, 6, 'Yellow', 'Pending', 'OCD-mottagningen'),
    createSeedBooking(-1034, 0, '13:45', 34, 7, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1035, 0, '14:00', 35, 5, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1036, 0, '14:15', 36, 6, 'Green', 'Pending', 'OCD-mottagningen'),
    createSeedBooking(-1037, 0, '14:30', 37, 5, 'Yellow', 'Pending', 'Affektiv mottagning'),
    createSeedBooking(-1038, 0, '14:45', 38, 7, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1039, 0, '15:00', 39, 5, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1040, 0, '15:15', 40, 6, 'Green', 'Confirmed', 'OCD-mottagningen'),
    createSeedBooking(-1041, 0, '15:30', 41, 7, 'Yellow', 'Pending', 'Affektiv mottagning'),
    createSeedBooking(-1006, 1, '09:00', 6, 2, 'Green', 'Confirmed', 'Avdelning 360'),
    createSeedBooking(-1007, 1, '09:15', 7, 4, 'Green', 'Confirmed', 'Avdelning 361'),
    createSeedBooking(-1011, 1, '10:15', 11, 2, 'Green', 'Pending', 'Avdelning 80'),
    createSeedBooking(-1012, 1, '10:30', 12, 1, 'Red', 'Pending', 'Avdelning 240'),
    createSeedBooking(-1008, 1, '13:00', 8, 5, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1009, 2, '10:00', 9, 2, 'Yellow', 'Pending', 'Avdelning 362'),
    createSeedBooking(-1010, 2, '14:00', 10, 7, 'Green', 'Confirmed', 'Affektiv mottagning'),
    createSeedBooking(-1013, 3, '08:30', 13, 2, 'Green', 'Pending', 'Avdelning 80'),
    createSeedBooking(-1014, 3, '13:30', 14, 6, 'Yellow', 'Pending', 'OCD-mottagningen'),
  ];
}

export const SEEDED_DEMO_BOOKINGS = createSeedBookings();

function isLegacyBulkSeed(bookingId: number) {
  return (
    (bookingId <= -1100 && bookingId >= -1114)
    || (bookingId <= -1200 && bookingId >= -1209)
    || (bookingId <= -1300 && bookingId >= -1320)
    || (bookingId <= -1400 && bookingId >= -1421)
  );
}

export function getDemoBookings(): BookingDto[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return SEEDED_DEMO_BOOKINGS;
    const parsed = (JSON.parse(stored) as BookingDto[]).filter((booking) => !isLegacyBulkSeed(booking.bookingId));
    if (parsed.length === 0) return SEEDED_DEMO_BOOKINGS;

    const existingIds = new Set(parsed.map((booking) => booking.bookingId));
    const missingSeedBookings = SEEDED_DEMO_BOOKINGS.filter((booking) => !existingIds.has(booking.bookingId));

    return [...parsed, ...missingSeedBookings];
  } catch {
    return SEEDED_DEMO_BOOKINGS;
  }
}

function saveDemoBookings(bookings: BookingDto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function addDemoBooking(dto: CreateBookingDto): BookingDto {
  const booking: BookingDto = {
    ...dto,
    bookingId: -Date.now(),
    createdAt: new Date().toISOString(),
  };

  saveDemoBookings([booking, ...getDemoBookings()]);
  return booking;
}

export function updateDemoBooking(updated: BookingDto) {
  saveDemoBookings(
    getDemoBookings().map((booking) => booking.bookingId === updated.bookingId ? updated : booking),
  );
}

export function deleteDemoBooking(bookingId: number) {
  saveDemoBookings(getDemoBookings().filter((booking) => booking.bookingId !== bookingId));
}
