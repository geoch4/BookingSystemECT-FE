import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { apiErrorMessage, buildClinicalDetails } from '../../components/referral/referralPayload';
import { EMPTY_FORM, type FormState } from '../../components/referral/referralTypes';

function form(patch: Partial<FormState>): FormState {
  return { ...EMPTY_FORM, ...patch };
}

describe('buildClinicalDetails', () => {
  it('returns nothing before a treatment is chosen', () => {
    expect(buildClinicalDetails(EMPTY_FORM)).toBeUndefined();
  });

  it('sends the rTMS answers and only the ticked documents', () => {
    const details = buildClinicalDetails(form({
      treatmentType: 5,
      rtms: {
        ...EMPTY_FORM.rtms,
        sessionPlan: 'double',
        indication: '  Terapiresistent depression  ',
        previousTreatments: 'Sertralin',
        treatmentGoal: '',
        contraindicationChecklistComplete: true,
        metalImplantsOrDevices: false,
        seizureHistory: false,
        documents: { ...EMPTY_FORM.rtms.documents, contraindicationChecklist: true, implantCheck: true },
      },
      // ECT answers left over from switching track must not be sent.
      ect: { ...EMPTY_FORM.ect, indication: 'gammal ECT-text' },
    }));

    expect(details).toEqual({
      indication: 'Terapiresistent depression',
      rtmsSessionPlan: 'double',
      previousTreatments: 'Sertralin',
      treatmentGoal: null,
      contraindicationChecklistComplete: true,
      metalImplantsOrDevices: false,
      seizureHistory: false,
      completedDocuments: ['contraindicationChecklist', 'implantCheck'],
    });
  });

  it('sends the ECT answers and health declaration', () => {
    const details = buildClinicalDetails(form({
      treatmentType: 2,
      health: { ...EMPTY_FORM.health, fastaOk: true, viktKg: '72', allergi: '' },
      ect: { ...EMPTY_FORM.ect, indication: 'Psykotisk depression', documents: { ...EMPTY_FORM.ect.documents, healthDeclaration: true } },
      rtms: { ...EMPTY_FORM.rtms, indication: 'gammal rTMS-text' },
    }));

    expect(details?.indication).toBe('Psykotisk depression');
    expect(details?.fastingConfirmed).toBe(true);
    expect(details?.weightKg).toBe('72');
    expect(details?.allergies).toBeNull();
    expect(details?.completedDocuments).toEqual(['healthDeclaration']);
    expect(details).not.toHaveProperty('rtmsSessionPlan');
  });
});

describe('apiErrorMessage', () => {
  it('shows the message the backend sent', () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: 'Personnumret är ogiltigt.' },
    });

    expect(apiErrorMessage(error, 'fallback')).toBe('Personnumret är ogiltigt.');
  });

  it('falls back when there is no message', () => {
    expect(apiErrorMessage(new Error('network'), 'fallback')).toBe('fallback');
    expect(apiErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
