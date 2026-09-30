import { isRtmsType, type BookingDto } from '../types';

export type RtmsSessionPlan = 'single' | 'double';

export function getRtmsSessionPlan(booking: BookingDto): RtmsSessionPlan | null {
  if (!isRtmsType(booking.treatmentTypeId)) return null;

  // Demo rule until the backend stores this explicitly:
  // type 7 and some selected demo rows represent double-session rTMS.
  if (booking.treatmentTypeId === 7) return 'double';
  if (Math.abs(booking.bookingId) % 3 === 0) return 'double';

  return 'single';
}

export function rtmsSessionPlanLabel(plan: RtmsSessionPlan | null) {
  if (plan === 'double') return 'Dubbelbehandling';
  if (plan === 'single') return 'Singelbehandling';
  return '';
}

export function rtmsSessionPlanShortLabel(plan: RtmsSessionPlan | null) {
  if (plan === 'double') return 'Dubbel';
  if (plan === 'single') return 'Singel';
  return '';
}
