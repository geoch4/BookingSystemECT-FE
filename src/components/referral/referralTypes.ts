import type { BookingPriority, PatientDto, TreatmentType } from '../../types';
import type { RtmsSessionPlan } from '../../utils/rtmsTreatmentPlan';

export interface HealthDeclaration {
  fastaOk: boolean | null;
  blodtryck: string;
  viktKg: string;
  allergi: string;
  lakemedel: string;
  extraInfo: string;
}

export interface EctReferralDetails {
  indication: string;
  anesthesiaInfo: string;
  somaticRisk: string;
  documents: {
    healthDeclaration: boolean;
    anesthesiaAssessment: boolean;
    medicationReview: boolean;
    somaticAssessment: boolean;
  };
}

export interface RtmsReferralDetails {
  sessionPlan: RtmsSessionPlan | null;
  indication: string;
  previousTreatments: string;
  contraindicationChecklistComplete: boolean | null;
  metalImplantsOrDevices: boolean | null;
  seizureHistory: boolean | null;
  treatmentGoal: string;
  documents: {
    contraindicationChecklist: boolean;
    implantCheck: boolean;
    treatmentHistory: boolean;
    patientInformation: boolean;
  };
}

export interface FormState {
  // Step 1
  patient: PatientDto | null;
  newPatientName: string;
  newPatientPnr: string;
  externalPatientId: string;
  // Step 2
  treatmentType: TreatmentType | null;
  priority: BookingPriority;
  preferredDate: string;
  preferredTime: string;
  // These fields let the coordinator see which department sent the referral.
  department: string;
  treatmentUnitId: string;
  contactName: string;
  contactPhone: string;
  // Step 3
  health: HealthDeclaration;
  ect: EctReferralDetails;
  rtms: RtmsReferralDetails;
}

export const EMPTY_FORM: FormState = {
  patient: null,
  newPatientName: '',
  newPatientPnr: '',
  externalPatientId: '',
  treatmentType: null,
  priority: 'Green',
  preferredDate: '',
  preferredTime: '',
  department: '',
  treatmentUnitId: '',
  contactName: '',
  contactPhone: '',
  health: {
    fastaOk: null,
    blodtryck: '',
    viktKg: '',
    allergi: '',
    lakemedel: '',
    extraInfo: '',
  },
  ect: {
    indication: '',
    anesthesiaInfo: '',
    somaticRisk: '',
    documents: {
      healthDeclaration: false,
      anesthesiaAssessment: false,
      medicationReview: false,
      somaticAssessment: false,
    },
  },
  rtms: {
    sessionPlan: null,
    indication: '',
    previousTreatments: '',
    contraindicationChecklistComplete: null,
    metalImplantsOrDevices: null,
    seizureHistory: null,
    treatmentGoal: '',
    documents: {
      contraindicationChecklist: false,
      implantCheck: false,
      treatmentHistory: false,
      patientInformation: false,
    },
  },
};

export const PRIORITY_OPTIONS: Array<{
  value: BookingPriority;
  label: string;
  desc: string;
  bg: string;
  border: string;
  text: string;
}> = [
  { value: 'Green',  label: 'Grön – Elektiv',  desc: 'Stabil, ingen akut suicidrisk. Behandling inom planerat schema.',      bg: 'bg-[#E8F7F1]', border: 'border-[#1A9E5F]', text: 'text-[#1A9E5F]' },
  { value: 'Yellow', label: 'Gul – Halvakut',  desc: 'Tydlig försämring, ej fullgod respons på läkemedel. Prioriteras upp.', bg: 'bg-[#FEF3DC]', border: 'border-[#D4860A]', text: 'text-[#D4860A]' },
  { value: 'Red',    label: 'Röd – Akut',      desc: 'Vitalindikation. Suicidrisk, katatoni eller livshotande tillstånd.',   bg: 'bg-[#FDEAEA]', border: 'border-[#C42B2B]', text: 'text-[#C42B2B]' },
];
