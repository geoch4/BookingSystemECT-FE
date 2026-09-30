import { isEctType, isRtmsType, type TreatmentType } from '../types';

export type HospitalSite = 'Sahlgrenska' | 'Östra' | 'Mölndal' | 'Öppenvård' | 'Okänd';
export type PatientFlowType = 'Slutenvård' | 'Öppenvård' | 'Akut' | 'Poliklinisk';
export type TreatmentUnitId = 'sahlgrenska-ect-rtms' | 'ostra-ect' | 'molndal-psykos-ect';

export interface TreatmentUnit {
  id: TreatmentUnitId;
  name: string;
  site: HospitalSite;
  description: string;
  ectSchedule?: string;
  rtmsSchedule?: string;
  ectCapacityNote?: string;
  rtmsCapacityNote?: string;
}

export interface DepartmentProfile {
  name: string;
  site: HospitalSite;
  patientFlow: PatientFlowType;
  defaultEctUnitId: TreatmentUnitId;
  defaultRtmsUnitId: TreatmentUnitId;
  transportToSahlgrenska: boolean;
  note: string;
}

export interface ReferralLogistics {
  sourceSite: HospitalSite;
  patientFlow: PatientFlowType;
  recommendedUnit: TreatmentUnit;
  requiresTransport: boolean;
  transportLabel?: string;
  logisticsNote: string;
  capacityNote?: string;
  overflowOption?: string;
}

export const treatmentUnits: Record<TreatmentUnitId, TreatmentUnit> = {
  'sahlgrenska-ect-rtms': {
    id: 'sahlgrenska-ect-rtms',
    name: 'Sahlgrenska ECT/rTMS',
    site: 'Sahlgrenska',
    description: 'Huvudenhet för ECT och rTMS inom psykiatrin.',
    ectSchedule: 'ECT mån/ons/fre kl. 09:00-12:00. Akut ECT kan behöva hanteras mellan ordinarie dagar.',
    rtmsSchedule: 'rTMS vardagar kl. 13:00-16:00.',
    ectCapacityNote: 'Poliklinisk ECT bör reservera cirka 3 platser per behandlingstillfälle.',
    rtmsCapacityNote: 'rTMS planeras som eftermiddagsflöde varje vardag.',
  },
  'ostra-ect': {
    id: 'ostra-ect',
    name: 'Östra ECT',
    site: 'Östra',
    description: 'Mindre ECT-enhet i psykiatrihuset på Östra.',
    ectSchedule: 'Begränsad lokal kapacitet.',
    ectCapacityNote: 'Cirka 6 patienter. Används försiktigt tills flödet är stabilt.',
  },
  'molndal-psykos-ect': {
    id: 'molndal-psykos-ect',
    name: 'Mölndal/Psykos ECT',
    site: 'Mölndal',
    description: 'ECT-enhet kopplad till psykosverksamheten.',
    ectSchedule: 'Primärt för psykosavdelningar.',
    ectCapacityNote: 'Kan i undantagsfall avlasta Sahlgrenska om det är kliniskt lämpligt.',
  },
};

const departmentProfiles: DepartmentProfile[] = [
  ...['360', '361', '362', '363', '365', '366', '367', '368'].map((number) => ({
    name: `Avdelning ${number}`,
    site: 'Östra' as const,
    patientFlow: 'Slutenvård' as const,
    defaultEctUnitId: 'sahlgrenska-ect-rtms' as const,
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms' as const,
    transportToSahlgrenska: true,
    note: 'Östra slutenvård går oftast till Sahlgrenska och behöver transportplanering.',
  })),
  {
    name: 'Psykiatrisk akutmottagning',
    site: 'Östra',
    patientFlow: 'Akut',
    defaultEctUnitId: 'sahlgrenska-ect-rtms',
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms',
    transportToSahlgrenska: true,
    note: 'Akuta ärenden från Östra behöver ofta extra bemanning och tydlig transportplan.',
  },
  ...['80', '81', '364'].map((number) => ({
    name: `Avdelning ${number}`,
    site: 'Sahlgrenska' as const,
    patientFlow: 'Slutenvård' as const,
    defaultEctUnitId: 'sahlgrenska-ect-rtms' as const,
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms' as const,
    transportToSahlgrenska: false,
    note: 'Sahlgrenska-avdelning med direkt närhet till huvudenheten.',
  })),
  ...['240', '241', '242'].map((number) => ({
    name: `Avdelning ${number}`,
    site: 'Mölndal' as const,
    patientFlow: 'Slutenvård' as const,
    defaultEctUnitId: 'molndal-psykos-ect' as const,
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms' as const,
    transportToSahlgrenska: false,
    note: 'Psykosavdelning som normalt går till Mölndal/Psykos ECT.',
  })),
  {
    name: 'Affektiv mottagning',
    site: 'Öppenvård',
    patientFlow: 'Poliklinisk',
    defaultEctUnitId: 'sahlgrenska-ect-rtms',
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms',
    transportToSahlgrenska: false,
    note: 'Polikliniskt flöde via Sahlgrenska.',
  },
  {
    name: 'OCD-mottagningen',
    site: 'Öppenvård',
    patientFlow: 'Öppenvård',
    defaultEctUnitId: 'sahlgrenska-ect-rtms',
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms',
    transportToSahlgrenska: false,
    note: 'Öppenvårdsflöde, framför allt aktuellt för rTMS.',
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getDepartmentProfile(department: string): DepartmentProfile {
  const normalizedDepartment = normalize(department);
  const exactMatch = departmentProfiles.find((profile) => normalize(profile.name) === normalizedDepartment);
  if (exactMatch) return exactMatch;

  const wardNumber = normalizedDepartment.match(/\b(80|81|240|241|242|360|361|362|363|364|365|366|367|368)\b/)?.[1];
  const wardMatch = wardNumber
    ? departmentProfiles.find((profile) => normalize(profile.name).includes(wardNumber))
    : undefined;
  if (wardMatch) return wardMatch;

  if (normalizedDepartment.includes('akut')) {
    return departmentProfiles.find((profile) => profile.name === 'Psykiatrisk akutmottagning')!;
  }

  if (normalizedDepartment.includes('affektiv')) {
    return departmentProfiles.find((profile) => profile.name === 'Affektiv mottagning')!;
  }

  if (normalizedDepartment.includes('ocd')) {
    return departmentProfiles.find((profile) => profile.name === 'OCD-mottagningen')!;
  }

  return {
    name: department || 'Ej angiven',
    site: 'Okänd',
    patientFlow: 'Slutenvård',
    defaultEctUnitId: 'sahlgrenska-ect-rtms',
    defaultRtmsUnitId: 'sahlgrenska-ect-rtms',
    transportToSahlgrenska: false,
    note: 'Avdelningen är inte klassad ännu. Behandlingsenheten behöver kontrollera vårdplats och logistik.',
  };
}

export function getReferralLogistics(department: string, treatmentTypeId: TreatmentType): ReferralLogistics {
  const profile = getDepartmentProfile(department);
  const unitId = isRtmsType(treatmentTypeId) ? profile.defaultRtmsUnitId : profile.defaultEctUnitId;
  const recommendedUnit = treatmentUnits[unitId];
  const requiresTransport = profile.transportToSahlgrenska && recommendedUnit.site === 'Sahlgrenska';

  const isEct = isEctType(treatmentTypeId);
  const capacityNote = isEct ? recommendedUnit.ectCapacityNote : recommendedUnit.rtmsCapacityNote;

  return {
    sourceSite: profile.site,
    patientFlow: profile.patientFlow,
    recommendedUnit,
    requiresTransport,
    transportLabel: requiresTransport
      ? `${profile.site} -> ${recommendedUnit.site}: transport och bemanning behöver planeras`
      : undefined,
    logisticsNote: profile.note,
    capacityNote,
    overflowOption: isEct && recommendedUnit.id === 'sahlgrenska-ect-rtms'
      ? 'Vid överbelastning kan Mölndal/Psykos ECT övervägas om det är kliniskt lämpligt.'
      : undefined,
  };
}
