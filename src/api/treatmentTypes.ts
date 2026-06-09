// TreatmentType är nu en enum i backend (värden 1–7).
// Det finns inget /api/treatmenttype-endpoint längre.
// Alla värden och hjälpfunktioner re-exporteras från types/index.ts.
export { TREATMENT_TYPE_LABELS, TREATMENT_TYPE_OPTIONS, isEctType, isRtmsType } from '../types';
export type { TreatmentType } from '../types';
