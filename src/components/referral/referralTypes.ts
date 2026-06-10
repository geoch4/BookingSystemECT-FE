import type { BookingPriority, PatientDto, TreatmentType } from '../../types';

export interface HealthDeclaration {
  fastaOk: boolean | null;
  blodtryck: string;
  viktKg: string;
  allergi: string;
  lakemedel: string;
  extraInfo: string;
}

export interface FormState {
  // Step 1
  patient: PatientDto | null;
  newPatientName: string;
  newPatientPnr: string;
  // Step 2
  treatmentType: TreatmentType | null;
  priority: BookingPriority;
  preferredDate: string;
  preferredTime: string;
  // Dessa fält gör att koordinatorn kan se vilken avdelning som skickat remissen.
  department: string;
  contactName: string;
  contactPhone: string;
  // Step 3
  health: HealthDeclaration;
}

export const EMPTY_FORM: FormState = {
  patient: null,
  newPatientName: '',
  newPatientPnr: '',
  treatmentType: null,
  priority: 'Green',
  preferredDate: '',
  preferredTime: '',
  department: '',
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
