import { TREATMENT_TYPE_OPTIONS } from '../../types';
import type { FormState } from './referralTypes';
import { PRIORITY_OPTIONS } from './referralTypes';

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReferralStep2({ form, setForm, onNext, onBack }: Props) {
  // Användaren får inte gå vidare utan behandling, datum, tid och avdelning.
  const canProceed = form.treatmentType !== null && form.preferredDate && form.preferredTime && form.department.trim();

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2332] mb-1">Behandling &amp; prioritet</h2>
      <p className="text-sm text-[#8494AA] mb-5">Ange behandlingstyp, urgensgrad och önskat datum.</p>

      <div className="space-y-5">
        {/* Treatment type */}
        <div>
          <label className="block text-sm font-medium text-[#4B5770] mb-2">Behandlingstyp</label>
          <div className="flex flex-wrap gap-2">
            {TREATMENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
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

        {/* Date + time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Önskat datum</label>
            <input
              type="date"
              value={form.preferredDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Önskad tid</label>
            <select
              value={form.preferredTime}
              onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            >
              <option value="">Välj tid...</option>
              <optgroup label="ECT – förmiddag">
                {['09:00','09:15','09:30','09:45','10:00','10:15','10:30','10:45','11:00','11:15','11:30','11:45'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
              <optgroup label="rTMS – eftermiddag">
                {['13:00','13:15','13:30','13:45','14:00','14:15','14:30','14:45','15:00','15:15','15:30'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Avdelningsblocket samlar information om var patienten kommer ifrån. */}
        <div className="border border-[#DDE3EC] rounded-xl p-4 bg-[#F8FAFC]">
          <h3 className="text-sm font-semibold text-[#1A2332] mb-1">Remitterande avdelning</h3>
          <p className="text-xs text-[#8494AA] mb-3">Visas i dashboarden så koordinatorn direkt ser var patienten är bokad ifrån.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#4B5770] mb-1">Avdelning/enhet *</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="t.ex. Avd 361"
                className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
              />
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
        {!canProceed && (
          <p className="text-xs text-[#8494AA] mb-2 text-right">
            {!form.treatmentType && 'Välj behandlingstyp · '}
            {!form.preferredDate && 'Ange datum · '}
            {!form.preferredTime && 'Välj tid · '}
            {!form.department.trim() && 'Fyll i avdelning'}
          </p>
        )}
        <div className="flex gap-3 justify-between">
          <button onClick={onBack}
            className="px-5 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
            ← Tillbaka
          </button>
          <button onClick={onNext} disabled={!canProceed}
            className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Nästa →
          </button>
        </div>
      </div>
    </div>
  );
}
