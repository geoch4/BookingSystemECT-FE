import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient } from '../api/patients';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/useAuth';
import { isEctType, isRtmsType, TREATMENT_TYPE_LABELS } from '../types';
import type { CreateBookingDto } from '../types';
import { DEMO_MODE } from '../config/demo';
import { PILOT_REGION_CODE, PILOT_SOURCE_SYSTEM } from '../config/pilot';
import { saveBookingReferralMeta } from '../utils/bookingMeta';
import StepBar from '../components/referral/StepBar';
import ReferralStep1 from '../components/referral/ReferralStep1';
import ReferralStep2 from '../components/referral/ReferralStep2';
import ReferralStep3 from '../components/referral/ReferralStep3';
import ReferralReviewStep from '../components/referral/ReferralReviewStep';
import { EMPTY_FORM, type FormState } from '../components/referral/referralTypes';
import { maskPersonnummer } from '../utils/personnummer';
import { rtmsSessionPlanLabel } from '../utils/rtmsTreatmentPlan';

function createInitialForm(treatment?: string | null): FormState {
  if (treatment === 'ect') return { ...EMPTY_FORM, treatmentType: 2 };
  if (treatment === 'rtms') return { ...EMPTY_FORM, treatmentType: 5 };
  return EMPTY_FORM;
}

function getSubmissionStatuses(form: FormState): Pick<
  CreateBookingDto,
  'healthDeclarationStatus' | 'anesthesiaAssessmentStatus'
> {
  const isEctReferral = form.treatmentType !== null && isEctType(form.treatmentType);

  if (!isEctReferral) {
    return {
      healthDeclarationStatus: 'Complete',
      anesthesiaAssessmentStatus: 'NotRequired',
    };
  }

  const healthDeclarationComplete =
    form.health.fastaOk !== null
    && form.ect.documents.healthDeclaration
    && form.ect.documents.medicationReview
    && form.ect.documents.somaticAssessment;

  return {
    healthDeclarationStatus: healthDeclarationComplete ? 'Complete' : 'Incomplete',
    anesthesiaAssessmentStatus: form.ect.documents.anesthesiaAssessment ? 'Complete' : 'Incomplete',
  };
}

function getPatientSummary(form: FormState) {
  const name = form.patient?.fullName || form.newPatientName.trim();
  const pnr = form.patient?.socialSecurityNumber || form.newPatientPnr.trim();
  if (!name && !pnr) return 'Ej vald';
  if (!name) return maskPersonnummer(pnr);
  return `${name}${pnr ? ` · ${maskPersonnummer(pnr)}` : ''}`;
}

function getTreatmentSummary(form: FormState) {
  if (form.treatmentType === null) return 'Ej vald';
  const treatment = TREATMENT_TYPE_LABELS[form.treatmentType];
  if (isRtmsType(form.treatmentType)) {
    return `${treatment}${form.rtms.sessionPlan ? ` · ${rtmsSessionPlanLabel(form.rtms.sessionPlan)}` : ''}`;
  }
  return treatment;
}

function getMissingSummary(form: FormState) {
  const items: string[] = [];
  const hasPatient = Boolean(form.patient || (form.newPatientName.trim() && form.newPatientPnr.trim()));
  if (!hasPatient) items.push('Patient');
  if (form.treatmentType === null) items.push('Behandling');
  if (!form.preferredDate) items.push('Önskat startdatum');
  if (!form.department.trim()) items.push('Avdelning');

  if (form.treatmentType !== null && isEctType(form.treatmentType)) {
    if (!form.ect.indication.trim()) items.push('ECT-indikation');
    if (form.health.fastaOk === null) items.push('Fastekrav');
    if (!Object.values(form.ect.documents).every(Boolean)) items.push('ECT-underlag');
  }

  if (form.treatmentType !== null && isRtmsType(form.treatmentType)) {
    if (form.rtms.sessionPlan === null) items.push('rTMS-upplägg');
    if (!form.rtms.indication.trim()) items.push('rTMS-indikation');
    if (!form.rtms.previousTreatments.trim()) items.push('Tidigare behandlingar');
    if (
      form.rtms.contraindicationChecklistComplete === null
      || form.rtms.metalImplantsOrDevices === null
      || form.rtms.seizureHistory === null
    ) items.push('rTMS-säkerhetsfrågor');
    if (!Object.values(form.rtms.documents).every(Boolean)) items.push('rTMS-underlag');
  }

  return items;
}

function ReferralSummaryPanel({ form, step }: { form: FormState; step: number }) {
  const missing = getMissingSummary(form);
  const isReadyForReview = missing.length === 0;
  const treatmentTrack = form.treatmentType === null
    ? 'Ej valt'
    : isEctType(form.treatmentType)
      ? 'ECT'
      : 'rTMS';

  return (
    <aside className="rounded-2xl border border-[#DDE3EC] bg-white p-4 shadow-sm lg:sticky lg:top-6">
      <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Remissöversikt</div>
      <h2 className="mt-1 text-lg font-bold text-[#1A2332]">
        {treatmentTrack === 'Ej valt' ? 'Ny remiss' : `${treatmentTrack}-remiss`}
      </h2>
      <p className="mt-1 text-sm text-[#64748B]">
        Sammanfattning medan remissen förbereds.
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Patient</div>
          <div className="mt-1 font-semibold text-[#1A2332]">{getPatientSummary(form)}</div>
        </div>
        <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
          <div className="mt-1 font-semibold text-[#1A2332]">{getTreatmentSummary(form)}</div>
        </div>
        <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning och start</div>
          <div className="mt-1 font-semibold text-[#1A2332]">{form.department.trim() || 'Avdelning saknas'}</div>
          <div className="mt-0.5 text-xs text-[#64748B]">{form.preferredDate || 'Önskat startdatum saknas'}</div>
        </div>
      </div>

      <div className={`mt-4 rounded-xl border p-3 ${
        isReadyForReview ? 'border-[#A9D8BE] bg-[#E8F7F1]' : 'border-[#E6C77A] bg-[#FFF8E8]'
      }`}>
        <div className={`text-sm font-bold ${isReadyForReview ? 'text-[#0F6840]' : 'text-[#875100]'}`}>
          {isReadyForReview ? 'Klar för granskning' : `${missing.length} saknas innan granskning`}
        </div>
        {!isReadyForReview && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missing.slice(0, 6).map((item) => (
              <span key={item} className="rounded-full border border-[#E6C77A] bg-white px-2 py-0.5 text-xs font-bold text-[#875100]">
                {item}
              </span>
            ))}
            {missing.length > 6 && (
              <span className="rounded-full border border-[#E6C77A] bg-white px-2 py-0.5 text-xs font-bold text-[#875100]">
                +{missing.length - 6}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#E5EAF1] pt-3 text-xs text-[#64748B]">
        Steg {step} av 4. Tiden bokas inte här; behandlingsenheten prioriterar och bekräftar faktisk tid.
      </div>
    </aside>
  );
}

export default function ReferralPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const requestedTreatment = searchParams.get('treatment');
  const initialForm = {...createInitialForm(requestedTreatment), department: user?.careUnitId ?? ''};
  const referralTitle =
    requestedTreatment === 'ect' ? 'Ny ECT-remiss'
      : requestedTreatment === 'rtms' ? 'Ny rTMS-remiss'
        : 'Ny remiss';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const createPatientMutation = useMutation({ mutationFn: createPatient });
  const createBookingMutation = useMutation({
    mutationFn: (dto: CreateBookingDto) => createBooking(dto, { auditReason: 'Remiss skapad från avdelningsflödet.' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['patients'] });
      setSubmitted(true);
    },
  });

  const isLoading = createPatientMutation.isPending || createBookingMutation.isPending;
  const isError   = createPatientMutation.isError   || createBookingMutation.isError;

  // Creates the patient first if this is a new patient, then submits the booking.
  async function handleSubmit() {
    let patientId = form.patient?.patientId;
    const externalPatientId = (form.externalPatientId || form.patient?.externalPatientId || '').trim() || undefined;
    const careUnitId = form.department.trim();

    // Only create a new patient record if the user didn't pick an existing one in step 1.
    if (!patientId) {
      const newPatient = await createPatientMutation.mutateAsync({
        fullName: form.newPatientName,
        socialSecurityNumber: form.newPatientPnr,
        externalPatientId,
        sourceSystem: PILOT_SOURCE_SYSTEM,
        regionCode: PILOT_REGION_CODE,
        integrationStatus: 'Manual',
      });
      patientId = newPatient.patientId;
    }

    const internalReferralTime = form.treatmentType && form.treatmentType >= 5 ? '13:00' : '09:00';
    const submissionStatuses = getSubmissionStatuses(form);
    const payload: CreateBookingDto = {
      date: `${form.preferredDate}T${internalReferralTime}:00`,
      patientId: patientId!,
      treatmentTypeId: form.treatmentType!,
      createdById: Number(user?.id ?? 0),
      createdAt: new Date().toISOString(),
      priority: form.priority,
      status: 'Pending',
      referralDepartment: careUnitId,
      referralContactName: form.contactName.trim(),
      referralContactPhone: form.contactPhone.trim(),
      externalPatientId,
      sourceSystem: PILOT_SOURCE_SYSTEM,
      careUnitId,
      departmentId: careUnitId,
      treatmentUnitId: form.treatmentUnitId || undefined,
      regionCode: PILOT_REGION_CODE,
      integrationStatus: 'Manual',
      ...submissionStatuses,
    };

    const booking = await createBookingMutation.mutateAsync(payload);

    const shouldSavePilotMeta =
      DEMO_MODE
      && (!booking.referralDepartment || (form.treatmentType !== null && isRtmsType(form.treatmentType)));

    if (shouldSavePilotMeta) {
      saveBookingReferralMeta(booking.bookingId, {
        department: form.department.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        rtmsSessionPlan: form.treatmentType !== null && isRtmsType(form.treatmentType)
          ? form.rtms.sessionPlan ?? undefined
          : undefined,
      });
    }
  }

  // Success screen shown after the referral/booking has been created.
  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-[#DDE3EC] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#E8F7F1] flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 className="text-xl font-bold text-[#1A2332] mb-2">Remiss inskickad</h2>
          <p className="text-sm text-[#8494AA] mb-6">
            Remissen är registrerad med status <strong>Väntande</strong> och granskas av ECT-koordinator.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setForm(initialForm); setStep(1); setSubmitted(false); }}
              className="px-5 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
              Ny remiss
            </button>
            <button onClick={() => navigate('/referrals')}
              className="px-5 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors">
              Visa mina remisser
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">{referralTitle}</h1>
        <p className="mt-0.5 text-sm text-[#8494AA]">
          {requestedTreatment === 'ect'
            ? 'ECT-spår - remissen kommer att visa ECT-specifika frågor och dokumentkrav.'
            : requestedTreatment === 'rtms'
              ? 'rTMS-spår - remissen kommer att visa rTMS-specifika frågor och dokumentkrav.'
              : 'ECT / rTMS - välj behandlingsspår i formuläret.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-[#DDE3EC] bg-white p-6">
          <StepBar current={step} />

          {/* Three-step wizard: patient → treatment/priority → health declaration */}
          {step === 1 && (
            <ReferralStep1 form={form} setForm={setForm} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <ReferralStep2 form={form} setForm={setForm} onNext={() => setStep(3)} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <ReferralStep3
              form={form}
              setForm={setForm}
              onSubmit={() => setStep(4)}
              onBack={() => setStep(2)}
              isLoading={false}
              error={false}
              submitLabel="Granska remiss"
            />
          )}
          {step === 4 && (
            <ReferralReviewStep
              form={form}
              onSubmit={handleSubmit}
              onBack={() => setStep(3)}
              isLoading={isLoading}
              error={isError}
            />
          )}
        </div>

        <ReferralSummaryPanel form={form} step={step} />
      </div>
    </div>
  );
}
