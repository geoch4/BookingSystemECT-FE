// TreatmentType is now an enum in the backend (values 1–7).
// There is no /api/treatmenttype endpoint anymore.
// All values and helper functions are re-exported from types/index.ts.
export { TREATMENT_TYPE_LABELS, TREATMENT_TYPE_OPTIONS, isEctType, isRtmsType } from '../types';
export type { TreatmentType } from '../types';
