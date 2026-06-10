import type { FormState, HealthDeclaration } from './referralTypes';

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: boolean;
}

export default function ReferralStep3({ form, setForm, onSubmit, onBack, isLoading, error }: Props) {
  const h = form.health;

  function updateHealth(patch: Partial<HealthDeclaration>) {
    setForm({ ...form, health: { ...h, ...patch } });
  }

  const canSubmit = h.fastaOk !== null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2332] mb-1">Hälsodeklaration</h2>
      <p className="text-sm text-[#8494AA] mb-5">Fyll i patientens aktuella status inför behandlingen.</p>

      <div className="space-y-4">
        {/* Fasta */}
        <div className="bg-[#F0F4F8] rounded-xl p-4">
          <label className="block text-sm font-semibold text-[#1A2332] mb-2">
            Fastekrav uppfyllt? <span className="text-[#C42B2B]">*</span>
          </label>
          <div className="flex gap-3">
            {([{ val: true, label: 'Ja – minst 6 h' }, { val: false, label: 'Nej – bruten fasta' }] as const).map(({ val, label }) => (
              <button key={String(val)} onClick={() => updateHealth({ fastaOk: val })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  h.fastaOk === val
                    ? val ? 'border-[#1A9E5F] bg-[#E8F7F1] text-[#1A9E5F]' : 'border-[#C42B2B] bg-[#FDEAEA] text-[#C42B2B]'
                    : 'border-[#DDE3EC] bg-white text-[#4B5770] hover:border-[#1A4F8A]'
                }`}>
                {label}
              </button>
            ))}
          </div>
          {h.fastaOk === false && (
            <p className="text-xs text-[#C42B2B] mt-2 font-medium">
              OBS: Bruten fasta – kontakta anestesiansvarig innan behandling.
            </p>
          )}
        </div>

        {/* Vitals grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Blodtryck</label>
            <input type="text" value={h.blodtryck} onChange={(e) => updateHealth({ blodtryck: e.target.value })}
              placeholder="t.ex. 130/80"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Vikt (kg)</label>
            <input type="number" value={h.viktKg} onChange={(e) => updateHealth({ viktKg: e.target.value })}
              placeholder="t.ex. 72"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Allergi</label>
          <input type="text" value={h.allergi} onChange={(e) => updateHealth({ allergi: e.target.value })}
            placeholder="Inga kända / specificera..."
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Aktuella läkemedel</label>
          <textarea value={h.lakemedel} onChange={(e) => updateHealth({ lakemedel: e.target.value })}
            placeholder="Lista relevanta läkemedel..."
            rows={2}
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-1">Övrig information</label>
          <textarea value={h.extraInfo} onChange={(e) => updateHealth({ extraInfo: e.target.value })}
            placeholder="MADRS-S, anestesibedömning, eller annat relevant..."
            rows={2}
            className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none" />
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">
          Något gick fel. Kontrollera uppgifterna och försök igen.
        </div>
      )}

      <div className="mt-6 flex gap-3 justify-between">
        <button onClick={onBack}
          className="px-5 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
          ← Tillbaka
        </button>
        <button onClick={onSubmit} disabled={!canSubmit || isLoading}
          className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-40">
          {isLoading ? 'Skickar remiss...' : 'Skicka remiss'}
        </button>
      </div>
    </div>
  );
}
