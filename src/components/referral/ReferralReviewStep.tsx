import { isRtmsType, TREATMENT_TYPE_LABELS } from '../../types';
import { maskPersonnummer } from '../../utils/personnummer';
import { rtmsSessionPlanLabel } from '../../utils/rtmsTreatmentPlan';
import type { FormState } from './referralTypes';

interface Props {
  form: FormState;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: boolean;
  errorMessage?: string;
}

export default function ReferralReviewStep({ form, onBack, onSubmit, isLoading, error, errorMessage }: Props) {
  const patientName = form.patient?.fullName || form.newPatientName;
  const patientPnr = form.patient?.socialSecurityNumber || form.newPatientPnr;
  const externalPatientId = form.externalPatientId || form.patient?.externalPatientId;
  const isRtmsReferral = form.treatmentType !== null && isRtmsType(form.treatmentType);

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2332] mb-1">Granska remiss</h2>
      <p className="text-sm text-[#8494AA] mb-5">
        Kontrollera uppgifterna innan remissen skickas till ECT/rTMS-enheten för prioritering och tidsbokning.
      </p>

      <div className="space-y-4">
        <section className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
          <h3 className="text-sm font-bold text-[#1A2332] mb-3">Patient</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Namn</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{patientName}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Personnummer</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{maskPersonnummer(patientPnr)}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Extern referens</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{externalPatientId || 'Ej angiven'}</div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
          <h3 className="text-sm font-bold text-[#1A2332] mb-3">Remiss</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Behandling</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                {form.treatmentType ? TREATMENT_TYPE_LABELS[form.treatmentType] : 'Ej vald'}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Önskad start</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.preferredDate}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Prioritet</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.priority}</div>
            </div>
            {isRtmsReferral && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">rTMS-upplägg</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                  {rtmsSessionPlanLabel(form.rtms.sessionPlan)}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
          <h3 className="text-sm font-bold text-[#1A2332] mb-3">
            {isRtmsReferral ? 'rTMS-underlag' : 'ECT-underlag'}
          </h3>
          {isRtmsReferral ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Indikation</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.rtms.indication || 'Ej angiven'}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Tidigare behandlingar</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.rtms.previousTreatments || 'Ej angiven'}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Anestesi</div>
                <div className="mt-1 text-sm font-semibold text-[#0F766E]">Ej aktuellt för rTMS</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Fasta</div>
                <div className="mt-1 text-sm font-semibold text-[#0F766E]">Ej aktuellt för rTMS</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Indikation</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.ect.indication || 'Ej angiven'}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Fastekrav</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                  {form.health.fastaOk === null ? 'Ej angivet' : form.health.fastaOk ? 'Uppfyllt' : 'Bruten fasta'}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Anestesiunderlag</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">
                  {form.ect.documents.anesthesiaAssessment ? 'Kontrollerat' : 'Saknas'}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Somatisk risk</div>
                <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.ect.somaticRisk || 'Ej angiven'}</div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
          <h3 className="text-sm font-bold text-[#1A2332] mb-3">Avdelning</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Avdelning/enhet</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.department}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Kontaktperson</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.contactName || 'Ej angiven'}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-[#8494AA]">Telefon</div>
              <div className="mt-1 text-sm font-semibold text-[#1A2332]">{form.contactPhone || 'Ej angiven'}</div>
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-[#B8CBE0] bg-[#EFF6FF] p-4 text-sm text-[#185FA5]">
          När du skickar remissen hamnar den hos ECT/rTMS-enheten. Enheten prioriterar ärendet och bekräftar faktisk behandlingstid.
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">
          {errorMessage ?? 'Något gick fel. Kontrollera uppgifterna och försök igen.'}
        </div>
      )}

      <div className="mt-6 flex gap-3 justify-between">
        <button onClick={onBack}
          className="px-5 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
          ← Tillbaka
        </button>
        <button onClick={onSubmit} disabled={isLoading}
          className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-40">
          {isLoading ? 'Skickar remiss...' : 'Bekräfta och skicka remiss'}
        </button>
      </div>
    </div>
  );
}
