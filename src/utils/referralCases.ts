import {
  TREATMENT_TYPE_LABELS,
  isEctType,
  isRtmsType,
  type BookingDto,
  type BookingPriority,
  type PatientDto,
} from '../types';
import type { BookingReferralMeta } from './bookingMeta';
import { getReferralMetaForBooking } from './bookingMeta';
import { getReferralLogistics, type ReferralLogistics } from './careLogistics';
import { getDepartmentPriorityForBooking } from './departmentPriority';
import { getRtmsSessionPlan, type RtmsSessionPlan } from './rtmsTreatmentPlan';

export type ReferralCaseStatus =
  | 'draft'
  | 'submitted'
  | 'needs-completion'
  | 'ready-for-review'
  | 'scheduled'
  | 'paused'
  | 'cancelled'
  | 'completed';

export interface ReferralCaseDocument {
  label: string;
  required: boolean;
  complete: boolean;
}

export interface ReferralRiskFlag {
  label: string;
  severity: 'info' | 'warning' | 'critical';
  target: 'treatment-unit' | 'anesthesia';
}

export interface ReferralCase {
  id: string;
  booking: BookingDto;
  patient: PatientDto;
  treatmentTrack: 'ECT' | 'rTMS';
  treatmentLabel: string;
  rtmsSessionPlan?: RtmsSessionPlan;
  department: string;
  contactName: string;
  contactPhone: string;
  priority: BookingPriority;
  departmentPriority?: number;
  status: ReferralCaseStatus;
  statusLabel: string;
  submittedAt: string;
  requestedStartDate: string;
  documents: ReferralCaseDocument[];
  riskFlags: ReferralRiskFlag[];
  missingDocuments: ReferralCaseDocument[];
  anesthesiaAttention: boolean;
  logistics: ReferralLogistics;
  nextStep: string;
}

export function fallbackPatient(patientId: number): PatientDto {
  const names = [
    'Anna Lindgren', 'Karim Hassan', 'Maja Berg', 'Leo Sand',
    'Britta Andersson', 'Göran Lindqvist', 'Klara Svensson', 'Erik Lund',
    'Sara Holm', 'Johan Berg', 'Elin Nord', 'Oskar Lind',
    'Fatima Ali', 'Nils Ekström', 'Maria Ek', 'Hanna Dahl',
    'Jonas Wik', 'Lina Fors', 'Peter Nyberg', 'Amina Said',
    'Malin Roos', 'Daniel Bergström', 'Sofia Nordin', 'Ahmed Rahman',
    'Eva Karlsson', 'Mikael Sandell', 'Ida Blom', 'Thomas Wallin',
  ];
  return {
    patientId,
    fullName: names[Math.abs(patientId) % names.length] ?? `Patient #${patientId}`,
    socialSecurityNumber: `${String(1970 + (patientId % 30)).padStart(4, '0')}${String((patientId % 12) + 1).padStart(2, '0')}${String((patientId % 27) + 1).padStart(2, '0')}-${String(1000 + patientId).slice(-4)}`,
  };
}

function buildDocuments(booking: BookingDto): ReferralCaseDocument[] {
  if (isEctType(booking.treatmentTypeId)) {
    return [
      { label: 'Hälsodeklaration', required: true, complete: booking.priority !== 'Yellow' },
      { label: 'Läkemedelslista', required: true, complete: booking.priority !== 'Red' },
      { label: 'Anestesiunderlag', required: true, complete: booking.status === 'Confirmed' },
      { label: 'Somatisk bedömning', required: booking.priority !== 'Green', complete: booking.priority === 'Green' || booking.status === 'Confirmed' },
    ];
  }

  return [
    { label: 'Kontraindikationschecklista', required: true, complete: booking.priority !== 'Yellow' },
    { label: 'Implantatkontroll', required: true, complete: booking.status === 'Confirmed' },
    { label: 'Tidigare behandlingar', required: true, complete: booking.priority !== 'Red' },
    { label: 'Patientinformation', required: true, complete: true },
  ];
}

function buildRiskFlags(booking: BookingDto): ReferralRiskFlag[] {
  const flags: ReferralRiskFlag[] = [];

  if (booking.priority === 'Red') {
    flags.push({
      label: 'Akut prioritet - behöver hanteras skyndsamt',
      severity: 'critical',
      target: 'treatment-unit',
    });
  }

  if (isEctType(booking.treatmentTypeId) && booking.priority !== 'Green') {
    flags.push({
      label: 'Anestesi behöver uppmärksammas före bokning/behandling',
      severity: booking.priority === 'Red' ? 'critical' : 'warning',
      target: 'anesthesia',
    });
  }

  if (isRtmsType(booking.treatmentTypeId) && booking.priority === 'Yellow') {
    flags.push({
      label: 'Kontrollera kontraindikationer/implantat innan behandling planeras',
      severity: 'warning',
      target: 'treatment-unit',
    });
  }

  return flags;
}

function statusForCase(booking: BookingDto, missingDocuments: ReferralCaseDocument[], riskFlags: ReferralRiskFlag[]) {
  if (booking.status === 'Cancelled') {
    return {
      status: 'cancelled' as const,
      statusLabel: 'Avbokad',
      nextStep: 'Följ upp orsak och eventuell ny planering.',
    };
  }

  if (booking.status === 'Confirmed') {
    return {
      status: 'scheduled' as const,
      statusLabel: 'Tid bekräftad',
      nextStep: 'Avdelningen är informerad om bekräftad tid.',
    };
  }

  if (missingDocuments.length > 0) {
    return {
      status: 'needs-completion' as const,
      statusLabel: 'Komplettering behövs',
      nextStep: 'Begär komplettering från avdelningen innan ärendet kan prioriteras färdigt.',
    };
  }

  if (riskFlags.some((flag) => flag.target === 'anesthesia')) {
    return {
      status: 'ready-for-review' as const,
      statusLabel: 'Klar - anestesi ska uppmärksammas',
      nextStep: 'Granska riskflagga och ta ställning till kontakt med anestesiteamet.',
    };
  }

  return {
    status: 'submitted' as const,
    statusLabel: 'Skickad - väntar prioritering',
    nextStep: 'Prioritera ärendet och boka/be om tid när behandlingsplats finns.',
  };
}

export function buildReferralCases(
  bookings: BookingDto[],
  patientMap: Record<number, PatientDto>,
  referralMetaByBookingId: Record<number, BookingReferralMeta>,
): ReferralCase[] {
  return bookings.map((booking) => {
    const patient = patientMap[booking.patientId] ?? fallbackPatient(booking.patientId);
    const referralMeta = getReferralMetaForBooking(booking, referralMetaByBookingId[booking.bookingId]);
    const documents = buildDocuments(booking);
    const missingDocuments = documents.filter((document) => document.required && !document.complete);
    const riskFlags = buildRiskFlags(booking);
    const caseStatus = statusForCase(booking, missingDocuments, riskFlags);
    const department = referralMeta?.department || 'Ej angiven';
    const logistics = getReferralLogistics(department, booking.treatmentTypeId);
    const departmentPriority = getDepartmentPriorityForBooking(booking.bookingId);
    const rtmsSessionPlan = getRtmsSessionPlan(booking) ?? undefined;

    return {
      id: `referral-${booking.bookingId}`,
      booking,
      patient,
      treatmentTrack: isEctType(booking.treatmentTypeId) ? 'ECT' : 'rTMS',
      treatmentLabel: TREATMENT_TYPE_LABELS[booking.treatmentTypeId],
      rtmsSessionPlan,
      department,
      contactName: referralMeta?.contactName || 'Ej angiven',
      contactPhone: referralMeta?.contactPhone || '',
      priority: booking.priority,
      departmentPriority,
      submittedAt: booking.createdAt,
      requestedStartDate: booking.date.slice(0, 10),
      documents,
      riskFlags,
      missingDocuments,
      anesthesiaAttention: riskFlags.some((flag) => flag.target === 'anesthesia'),
      logistics,
      ...caseStatus,
    };
  });
}
