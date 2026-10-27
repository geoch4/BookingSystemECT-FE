import { isAxiosError } from 'axios';
import { isEctType, type ReferralClinicalDetails } from '../../types';
import type { FormState } from './referralTypes';

function text(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function checkedKeys(documents: Record<string, boolean>) {
  return Object.entries(documents)
    .filter(([, checked]) => checked)
    .map(([key]) => key);
}

// Builds the clinical basis that is sent with the referral. Only the fields that belong to
// the chosen treatment are included, so an ECT referral never carries stale rTMS answers.
export function buildClinicalDetails(form: FormState): ReferralClinicalDetails | undefined {
  if (form.treatmentType === null) return undefined;

  if (isEctType(form.treatmentType)) {
    return {
      indication: text(form.ect.indication),
      anesthesiaInfo: text(form.ect.anesthesiaInfo),
      somaticRisk: text(form.ect.somaticRisk),
      fastingConfirmed: form.health.fastaOk,
      bloodPressure: text(form.health.blodtryck),
      weightKg: text(form.health.viktKg),
      allergies: text(form.health.allergi),
      medications: text(form.health.lakemedel),
      additionalInfo: text(form.health.extraInfo),
      completedDocuments: checkedKeys(form.ect.documents),
    };
  }

  return {
    indication: text(form.rtms.indication),
    rtmsSessionPlan: form.rtms.sessionPlan,
    previousTreatments: text(form.rtms.previousTreatments),
    treatmentGoal: text(form.rtms.treatmentGoal),
    contraindicationChecklistComplete: form.rtms.contraindicationChecklistComplete,
    metalImplantsOrDevices: form.rtms.metalImplantsOrDevices,
    seizureHistory: form.rtms.seizureHistory,
    completedDocuments: checkedKeys(form.rtms.documents),
  };
}

// The backend answers validation and slot errors with { message }; show that text when present.
export function apiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
