import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient } from '../api/patients';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/useAuth';
import { isEctType } from '../types';
import type { CreateBookingDto } from '../types';
import { PILOT_REGION_CODE, PILOT_SOURCE_SYSTEM } from '../config/pilot';
// Temporary fallback while older backend versions don't return referral metadata.
import { saveBookingReferralMeta } from '../utils/bookingMeta';
import StepBar from '../components/referral/StepBar';
import ReferralStep1 from '../components/referral/ReferralStep1';
import ReferralStep2 from '../components/referral/ReferralStep2';
import ReferralStep3 from '../components/referral/ReferralStep3';
import ReferralReviewStep from '../components/referral/ReferralReviewStep';
import { EMPTY_FORM, type FormState } from '../components/referral/referralTypes';

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

export default function ReferralPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const requestedTreatment = searchParams.get('treatment');
  const initialForm = createInitialForm(requestedTreatment);
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
      regionCode: PILOT_REGION_CODE,
      integrationStatus: 'Manual',
      ...submissionStatuses,
    };

    const booking = await createBookingMutation.mutateAsync(payload);

    // If the backend didn't persist the referral fields, keep them in local storage instead.
    if (!booking.referralDepartment) {
      saveBookingReferralMeta(booking.bookingId, {
        department: form.department.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
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
            <button onClick={() => navigate('/bookings')}
              className="px-5 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors">
              Visa bokningar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2332]">{referralTitle}</h1>
        <p className="text-sm text-[#8494AA] mt-0.5">
          {requestedTreatment === 'ect'
            ? 'ECT-spår - remissen kommer att visa ECT-specifika frågor och dokumentkrav.'
            : requestedTreatment === 'rtms'
              ? 'rTMS-spår - remissen kommer att visa rTMS-specifika frågor och dokumentkrav.'
              : 'ECT / rTMS - välj behandlingsspår i formuläret.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE3EC] p-6">
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
    </div>
  );
}
