import type { BookingDto, CreateBookingDto } from '../types';

const STORAGE_KEY = 'ect-demo-bookings';

export function getDemoBookings(): BookingDto[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as BookingDto[] : [];
  } catch {
    return [];
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
