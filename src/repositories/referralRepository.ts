import type { BookingDto, BookingPriority, PatientDto } from '../types';
import type { BookingReferralMeta } from '../utils/bookingMeta';
import { buildReferralCases, type ReferralCase } from '../utils/referralCases';

type ReferralSourceInput = {
  bookings: BookingDto[];
  patientMap: Record<number, PatientDto>;
  referralMetaByBookingId: Record<number, BookingReferralMeta>;
};

function priorityRank(priority: BookingPriority) {
  if (priority === 'Red') return 0;
  if (priority === 'Yellow') return 1;
  return 2;
}

function departmentPriorityRank(priority?: number) {
  return priority ?? 999;
}

function buildReferralSnapshot({
  bookings,
  patientMap,
  referralMetaByBookingId,
}: ReferralSourceInput): ReferralCase[] {
  return buildReferralCases(bookings, patientMap, referralMetaByBookingId);
}

export function getReferralQueueSnapshot(input: ReferralSourceInput): ReferralCase[] {
  return buildReferralSnapshot(input)
    .filter((referral) => referral.status !== 'scheduled' && referral.status !== 'cancelled')
    .sort((a, b) => (
      priorityRank(a.priority) - priorityRank(b.priority)
      || departmentPriorityRank(a.departmentPriority) - departmentPriorityRank(b.departmentPriority)
      || a.submittedAt.localeCompare(b.submittedAt)
    ));
}

export function getDepartmentReferralSnapshot(input: ReferralSourceInput): ReferralCase[] {
  return buildReferralSnapshot(input)
    .filter((referral) => referral.status !== 'scheduled')
    .sort((a, b) => (
      departmentPriorityRank(a.departmentPriority) - departmentPriorityRank(b.departmentPriority)
      || a.submittedAt.localeCompare(b.submittedAt)
    ));
}

export function getConfirmedReferralSnapshot(input: ReferralSourceInput): ReferralCase[] {
  return buildReferralSnapshot(input)
    .filter((referral) => referral.status === 'scheduled')
    .sort((a, b) => a.booking.date.localeCompare(b.booking.date));
}
