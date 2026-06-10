import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient } from '../api/patients';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/useAuth';
import type { CreateBookingDto } from '../types';
// Tillfällig fallback medan äldre backendversioner inte returnerar remissmetadata.
import { saveBookingReferralMeta } from '../utils/bookingMeta';
import StepBar from '../components/referral/StepBar';
import ReferralStep1 from '../components/referral/ReferralStep1';
import ReferralStep2 from '../components/referral/ReferralStep2';
import ReferralStep3 from '../components/referral/ReferralStep3';
import { EMPTY_FORM, type FormState } from '../components/referral/referralTypes';

export default function ReferralPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const createPatientMutation = useMutation({ mutationFn: createPatient });
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['patients'] });
      setSubmitted(true);
    },
  });

  const isLoading = createPatientMutation.isPending || createBookingMutation.isPending;
  const isError   = createPatientMutation.isError   || createBookingMutation.isError;

  async function handleSubmit() {
    let patientId = form.patient?.patientId;

    if (!patientId) {
      const newPatient = await createPatientMutation.mutateAsync({
        fullName: form.newPatientName,
        socialSecurityNumber: form.newPatientPnr,
      });
      patientId = newPatient.patientId;
    }

    const payload: CreateBookingDto = {
      date: `${form.preferredDate}T${(form.preferredTime || '09:00')}:00`,
      patientId: patientId!,
      treatmentTypeId: form.treatmentType!,
      createdById: Number(user?.id ?? 0),
      createdAt: new Date().toISOString(),
      priority: form.priority,
      status: 'Pending',
      referralDepartment: form.department.trim(),
      referralContactName: form.contactName.trim(),
      referralContactPhone: form.contactPhone.trim(),
    };
    console.log('[DEBUG] Booking payload:', JSON.stringify(payload, null, 2));

    const booking = await createBookingMutation.mutateAsync(payload);

    if (!booking.referralDepartment) {
      saveBookingReferralMeta(booking.bookingId, {
        department: form.department.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
      });
    }
  }

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
            <button onClick={() => { setForm(EMPTY_FORM); setStep(1); setSubmitted(false); }}
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
        <h1 className="text-2xl font-bold text-[#1A2332]">Ny remiss</h1>
        <p className="text-sm text-[#8494AA] mt-0.5">ECT / rTMS — Psykiatri Affektiva, Sahlgrenska</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE3EC] p-6">
        <StepBar current={step} />

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
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
            isLoading={isLoading}
            error={isError}
          />
        )}
      </div>
    </div>
  );
}
