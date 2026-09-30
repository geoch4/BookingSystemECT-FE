import { isEctType } from '../../types';
import type { EctReferralDetails, FormState, HealthDeclaration, RtmsReferralDetails } from './referralTypes';

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: boolean;
  submitLabel?: string;
}

export default function ReferralStep3({ form, setForm, onSubmit, onBack, isLoading, error, submitLabel = 'Skicka remiss' }: Props) {
  const h = form.health;
  const isEctReferral = form.treatmentType !== null && isEctType(form.treatmentType);
  const ectDocumentsComplete = Object.values(form.ect.documents).every(Boolean);
  const rtmsDocumentsComplete = Object.values(form.rtms.documents).every(Boolean);

  function updateHealth(patch: Partial<HealthDeclaration>) {
    setForm({ ...form, health: { ...h, ...patch } });
  }

  function updateEct(patch: Partial<EctReferralDetails>) {
    setForm({ ...form, ect: { ...form.ect, ...patch } });
  }

  function updateRtms(patch: Partial<RtmsReferralDetails>) {
    setForm({ ...form, rtms: { ...form.rtms, ...patch } });
  }

  function updateEctDocument(field: keyof EctReferralDetails['documents'], checked: boolean) {
    setForm({
      ...form,
      ect: {
        ...form.ect,
        documents: { ...form.ect.documents, [field]: checked },
      },
    });
  }

  function updateRtmsDocument(field: keyof RtmsReferralDetails['documents'], checked: boolean) {
    setForm({
      ...form,
      rtms: {
        ...form.rtms,
        documents: { ...form.rtms.documents, [field]: checked },
      },
    });
  }

  const canSubmit = isEctReferral
    ? h.fastaOk !== null && form.ect.indication.trim() && ectDocumentsComplete
    : form.rtms.indication.trim()
      && form.rtms.previousTreatments.trim()
      && form.rtms.contraindicationChecklistComplete !== null
      && form.rtms.metalImplantsOrDevices !== null
      && form.rtms.seizureHistory !== null
      && rtmsDocumentsComplete;

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2332] mb-1">
        {isEctReferral ? 'ECT-remiss' : 'rTMS-remiss'}
      </h2>
      <p className="text-sm text-[#8494AA] mb-5">
        {isEctReferral
          ? 'Fyll i ECT-specifika uppgifter, hälsodeklaration och dokumentkontroll.'
          : 'Fyll i rTMS-specifika uppgifter, kontraindikationer och tidigare behandlingar.'}
      </p>

      {isEctReferral ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">
              Indikation för ECT <span className="text-[#C42B2B]">*</span>
            </label>
            <textarea
              value={form.ect.indication}
              onChange={(e) => updateEct({ indication: e.target.value })}
              placeholder="Beskriv indikation, symtom, svårighetsgrad och varför ECT önskas..."
              rows={3}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none"
            />
          </div>

          <div className="bg-[#F0F4F8] rounded-xl p-4">
            <label className="block text-sm font-semibold text-[#1A2332] mb-2">
              Fastekrav uppfyllt? <span className="text-[#C42B2B]">*</span>
            </label>
            <div className="flex gap-3">
              {([{ val: true, label: 'Ja - minst 6 h' }, { val: false, label: 'Nej - bruten fasta' }] as const).map(({ val, label }) => (
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
                OBS: Bruten fasta - kontakta anestesiansvarig innan behandling.
              </p>
            )}
          </div>

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
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Anestesiinformation</label>
            <textarea value={form.ect.anesthesiaInfo} onChange={(e) => updateEct({ anesthesiaInfo: e.target.value })}
              placeholder="Anestesiunderlag, tidigare narkosproblem eller annan relevant information..."
              rows={2}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Somatisk riskbedömning</label>
            <textarea value={form.ect.somaticRisk} onChange={(e) => updateEct({ somaticRisk: e.target.value })}
              placeholder="Hjärt-/lungsjukdom, aktuellt status, särskilda risker..."
              rows={2}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none" />
          </div>

          <div className="bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1A2332]">Obligatoriska ECT-underlag</h3>
                <p className="text-xs text-[#8494AA] mt-0.5">
                  Alla punkter måste vara kontrollerade innan remissen kan skickas.
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                ectDocumentsComplete ? 'bg-[#E8F7F1] text-[#1A9E5F]' : 'bg-[#FEF3DC] text-[#D4860A]'
              }`}>
                {ectDocumentsComplete ? 'Komplett' : 'Saknas'}
              </span>
            </div>

            <div className="space-y-2">
              {([
                ['healthDeclaration', 'Hälsodeklaration är ifylld och aktuell'],
                ['anesthesiaAssessment', 'Anestesi-/narkosunderlag är kontrollerat'],
                ['medicationReview', 'Läkemedel och allergier är genomgångna'],
                ['somaticAssessment', 'Somatisk riskbedömning finns med'],
              ] as const).map(([field, label]) => (
                <label key={field} className="flex items-start gap-3 text-sm text-[#4B5770]">
                  <input
                    type="checkbox"
                    checked={form.ect.documents[field]}
                    onChange={(e) => updateEctDocument(field, e.target.checked)}
                    className="mt-1"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">
              Indikation för rTMS <span className="text-[#C42B2B]">*</span>
            </label>
            <textarea
              value={form.rtms.indication}
              onChange={(e) => updateRtms({ indication: e.target.value })}
              placeholder="Beskriv indikation, symtom, svårighetsgrad och varför rTMS önskas..."
              rows={3}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">
              Tidigare behandlingsförsök <span className="text-[#C42B2B]">*</span>
            </label>
            <textarea
              value={form.rtms.previousTreatments}
              onChange={(e) => updateRtms({ previousTreatments: e.target.value })}
              placeholder="Läkemedel, psykoterapi, tidigare ECT/rTMS eller annan relevant behandling..."
              rows={3}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none"
            />
          </div>

          {([
            ['contraindicationChecklistComplete', 'Kontraindikationschecklista genomgången?'],
            ['metalImplantsOrDevices', 'Metallimplantat, pacemaker eller annat medicintekniskt implantat?'],
            ['seizureHistory', 'Tidigare epilepsi eller krampanfall?'],
          ] as const).map(([field, label]) => (
            <div key={field} className="bg-[#F0F4F8] rounded-xl p-4">
              <label className="block text-sm font-semibold text-[#1A2332] mb-2">
                {label} <span className="text-[#C42B2B]">*</span>
              </label>
              <div className="flex gap-3">
                {([{ val: true, label: 'Ja' }, { val: false, label: 'Nej' }] as const).map(({ val, label: optionLabel }) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => updateRtms({ [field]: val })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      form.rtms[field] === val
                        ? val ? 'border-[#D4860A] bg-[#FEF3DC] text-[#D4860A]' : 'border-[#1A9E5F] bg-[#E8F7F1] text-[#1A9E5F]'
                        : 'border-[#DDE3EC] bg-white text-[#4B5770] hover:border-[#1A4F8A]'
                    }`}
                  >
                    {optionLabel}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Behandlingsmål eller önskat protokoll</label>
            <textarea
              value={form.rtms.treatmentGoal}
              onChange={(e) => updateRtms({ treatmentGoal: e.target.value })}
              placeholder="Exempel: depressionsprotokoll, behandlingsmål eller särskilda önskemål..."
              rows={2}
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] resize-none"
            />
          </div>

          <div className="bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1A2332]">Obligatoriska rTMS-underlag</h3>
                <p className="text-xs text-[#8494AA] mt-0.5">
                  Alla punkter måste vara kontrollerade innan remissen kan skickas.
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                rtmsDocumentsComplete ? 'bg-[#E8F7F1] text-[#1A9E5F]' : 'bg-[#FEF3DC] text-[#D4860A]'
              }`}>
                {rtmsDocumentsComplete ? 'Komplett' : 'Saknas'}
              </span>
            </div>

            <div className="space-y-2">
              {([
                ['contraindicationChecklist', 'Kontraindikationschecklista är ifylld'],
                ['implantCheck', 'Implantat/medicinteknisk utrustning är kontrollerad'],
                ['treatmentHistory', 'Tidigare behandlingsförsök är dokumenterade'],
                ['patientInformation', 'Patientinformation och behandlingsmål är dokumenterade'],
              ] as const).map(([field, label]) => (
                <label key={field} className="flex items-start gap-3 text-sm text-[#4B5770]">
                  <input
                    type="checkbox"
                    checked={form.rtms.documents[field]}
                    onChange={(e) => updateRtmsDocument(field, e.target.checked)}
                    className="mt-1"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

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
          {isLoading ? 'Skickar remiss...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
