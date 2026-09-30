import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { TREATMENT_TYPE_OPTIONS, isEctType, isRtmsType, type TreatmentType } from '../../types';
import { PILOT_CARE_UNITS } from '../../config/pilot';
import type { FormState } from './referralTypes';
import { PRIORITY_OPTIONS } from './referralTypes';

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReferralStep2({ form, setForm, onNext, onBack }: Props) {
  // The department submits a referral request. The treatment unit assigns the exact time later.
  const preferredDateInputRef = useRef<HTMLInputElement>(null);
  const [showErrors, setShowErrors] = useState(false);
  const canProceed = form.treatmentType !== null && Boolean(form.preferredDate) && Boolean(form.department.trim());
  const showTreatmentError = showErrors && form.treatmentType === null;
  const showDateError = showErrors && !form.preferredDate;
  const showDepartmentError = showErrors && !form.department.trim();
  const selectedFamily = form.treatmentType === null ? null : isEctType(form.treatmentType) ? 'ect' : 'rtms';
  const ectOptions = TREATMENT_TYPE_OPTIONS.filter((opt) => isEctType(opt.value));
  const rtmsOptions = TREATMENT_TYPE_OPTIONS.filter((opt) => isRtmsType(opt.value));
  const visibleTreatmentOptions = selectedFamily === 'rtms' ? rtmsOptions : ectOptions;
  const preferredDateLabel = form.preferredDate
    ? new Date(`${form.preferredDate}T12:00:00`).toLocaleDateString('sv-SE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : 'Välj önskat startdatum';

  function selectFamily(family: 'ect' | 'rtms') {
    const defaultTreatmentType: TreatmentType = family === 'ect' ? 2 : 5;
    setForm({
      ...form,
      treatmentType: defaultTreatmentType,
      preferredTime: '',
    });
  }

  function openPreferredDatePicker() {
    const input = preferredDateInputRef.current;
    if (!input) return;

    input.focus();
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (pickerInput.showPicker) {
      pickerInput.showPicker();
    } else {
      input.click();
    }
  }

  function handleNext() {
    if (!canProceed) {
      setShowErrors(true);
      return;
    }

    onNext();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2332] mb-1">Behandling &amp; prioritet</h2>
      <p className="text-sm text-[#8494AA] mb-5">
        Ange behandlingstyp, urgensgrad och önskat startdatum. Exakt tid sätts senare av ECT/rTMS-enheten.
      </p>

      <div className="space-y-5">
        {/* Treatment type */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${showTreatmentError ? 'text-[#C42B2B]' : 'text-[#4B5770]'}`}>
            Välj remissflöde
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => selectFamily('ect')}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                selectedFamily === 'ect'
                  ? 'border-[#1A4F8A] bg-[#EFF6FF]'
                  : showTreatmentError
                    ? 'border-[#C42B2B] bg-[#FDEAEA]'
                  : 'border-[#DDE3EC] bg-white hover:border-[#1A4F8A]'
              }`}
            >
              <div className="text-sm font-bold text-[#1A2332]">ECT-remiss</div>
              <div className="text-xs text-[#8494AA] mt-1">
                För elektrokonvulsiv behandling med hälsodeklaration, fasta och anestesiunderlag.
              </div>
            </button>
            <button
              type="button"
              onClick={() => selectFamily('rtms')}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                selectedFamily === 'rtms'
                  ? 'border-[#1A9E5F] bg-[#E8F7F1]'
                  : showTreatmentError
                    ? 'border-[#C42B2B] bg-[#FDEAEA]'
                  : 'border-[#DDE3EC] bg-white hover:border-[#1A9E5F]'
              }`}
            >
              <div className="text-sm font-bold text-[#1A2332]">rTMS-remiss</div>
              <div className="text-xs text-[#8494AA] mt-1">
                För magnetstimulering med kontraindikationer, implantat och tidigare behandlingar.
              </div>
            </button>
          </div>
          {showTreatmentError && (
            <p className="mt-2 text-xs font-semibold text-[#C42B2B]">
              Välj om remissen gäller ECT eller rTMS.
            </p>
          )}
        </div>

        {selectedFamily && (
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-2">
              {selectedFamily === 'ect' ? 'ECT-typ' : 'rTMS-typ'}
            </label>
            <div className="flex flex-wrap gap-2">
              {visibleTreatmentOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, treatmentType: opt.value })}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  form.treatmentType === opt.value
                    ? 'border-[#1A4F8A] bg-[#EFF6FF] text-[#1A4F8A]'
                    : 'border-[#DDE3EC] bg-white text-[#4B5770] hover:border-[#1A4F8A]'
                }`}
              >
                {opt.label}
              </button>
              ))}
            </div>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-2">Urgensgrad</label>
          <div className="space-y-2">
            {PRIORITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setForm({ ...form, priority: o.value })}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  form.priority === o.value ? `${o.bg} ${o.border}` : 'border-[#DDE3EC] bg-white hover:border-[#DDE3EC]'
                }`}
              >
                <div className={`text-sm font-semibold ${form.priority === o.value ? o.text : 'text-[#1A2332]'}`}>
                  {o.label}
                </div>
                <div className="text-xs text-[#8494AA] mt-0.5">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Requested start date */}
        <div className="rounded-xl border border-[#DDE3EC] bg-[#F8FAFC] p-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${showDateError ? 'text-[#C42B2B]' : 'text-[#4B5770]'}`}>
              Önskat startdatum
            </label>
            <div className="relative">
              <input
                ref={preferredDateInputRef}
                type="date"
                value={form.preferredDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
                aria-label="Önskat startdatum"
              />
              <button
                type="button"
                onClick={openPreferredDatePicker}
                className={`flex min-h-[64px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 px-4 py-3 text-center transition-colors hover:border-[#1A4F8A] hover:bg-[#EFF6FF] ${
                showDateError
                  ? 'border-[#C42B2B] bg-[#FDEAEA] text-[#1A2332]'
                  : form.preferredDate
                    ? 'border-[#1A4F8A] bg-white text-[#1A2332]'
                    : 'border-[#DDE3EC] bg-white text-[#8494AA]'
              }`}
              >
                <CalendarDays size={26} color="#185FA5" aria-hidden="true" />
                <div>
                  <div className="text-sm font-bold text-[#1A2332]">{preferredDateLabel}</div>
                  <div className="text-xs text-[#8494AA]">Klicka för att öppna kalendern</div>
                </div>
              </button>
            </div>
            {showDateError && (
              <p className="mt-2 text-xs font-semibold text-[#C42B2B]">
                Välj ett önskat startdatum för behandlingen.
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-[#8494AA]">
            Detta är inte en bokad tid. Behandlingsenheten går igenom prioritet, tillgängliga platser och bekräftar faktisk tid.
          </p>
        </div>

        {/* The department block collects information about where the patient is from. */}
        <div className="border border-[#DDE3EC] rounded-xl p-4 bg-[#F8FAFC]">
          <h3 className="text-sm font-semibold text-[#1A2332] mb-1">Remitterande avdelning</h3>
          <p className="text-xs text-[#8494AA] mb-3">Visas i dashboarden så koordinatorn direkt ser var patienten är bokad ifrån.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${showDepartmentError ? 'text-[#C42B2B]' : 'text-[#4B5770]'}`}>
                Avdelning/enhet *
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                list="pilot-care-units"
                placeholder="t.ex. Avd 361"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  showDepartmentError
                    ? 'border-[#C42B2B] bg-[#FDEAEA] focus:ring-[#C42B2B]'
                    : 'border-[#DDE3EC] focus:ring-[#1A4F8A]'
                }`}
              />
              <datalist id="pilot-care-units">
                {PILOT_CARE_UNITS.map((careUnit) => (
                  <option key={careUnit} value={careUnit} />
                ))}
              </datalist>
              {showDepartmentError && (
                <p className="mt-1.5 text-xs font-semibold text-[#C42B2B]">
                  Fyll i vilken avdelning eller enhet som skickar remissen.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Kontaktperson</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Namn"
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Telefon</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="031-..."
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-3 justify-between">
          <button onClick={onBack}
            className="px-5 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
            ← Tillbaka
          </button>
          <button onClick={handleNext}
            className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors">
            Nästa →
          </button>
        </div>
      </div>
    </div>
  );
}
