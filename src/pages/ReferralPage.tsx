import { useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatients, createPatient } from '../api/patients';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/useAuth';
import type { BookingPriority, PatientDto, TreatmentType } from '../types';
import { TREATMENT_TYPE_OPTIONS } from '../types';
// Tillfällig fallback medan äldre backendversioner inte returnerar remissmetadata.
import { saveBookingReferralMeta } from '../utils/bookingMeta';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthDeclaration {
  fastaOk: boolean | null;
  blodtryck: string;
  viktKg: string;
  allergi: string;
  lakemedel: string;
  extraInfo: string;
}

interface FormState {
  // Step 1
  patient: PatientDto | null;
  newPatientName: string;
  newPatientPnr: string;
  // Step 2
  treatmentType: TreatmentType | null;
  priority: BookingPriority;
  preferredDate: string;
  preferredTime: string;
  // Dessa fält gör att koordinatorn kan se vilken avdelning som skickat remissen.
  department: string;
  contactName: string;
  contactPhone: string;
  // Step 3
  health: HealthDeclaration;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Patient' },
  { n: 2, label: 'Behandling & prioritet' },
  { n: 3, label: 'Hälsodeklaration' },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center gap-2 ${current >= s.n ? 'text-[#1A4F8A]' : 'text-[#8494AA]'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              current > s.n
                ? 'bg-[#1A4F8A] border-[#1A4F8A] text-white'
                : current === s.n
                ? 'border-[#1A4F8A] text-[#1A4F8A]'
                : 'border-[#DDE3EC] text-[#8494AA]'
            }`}>
              {current > s.n ? '✓' : s.n}
            </div>
            <span className="text-sm font-medium">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 ${current > s.n ? 'bg-[#1A4F8A]' : 'bg-[#DDE3EC]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Patient ──────────────────────────────────────────────────────────

function Step1({ form, setForm, onNext }: {
  form: FormState;
  setForm: (f: FormState) => void;
  onNext: () => void;
}) {
  const { data: patients = [], isLoading: patientsLoading, isError: patientsError } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
  });
  const [searchPnr, setSearchPnr] = useState('');
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedSearch = searchPnr.trim().toLowerCase();
  const matchingPatients = patients
    .filter((patient) =>
      !normalizedSearch
      || patient.socialSecurityNumber.includes(normalizedSearch)
      || patient.fullName.toLowerCase().includes(normalizedSearch)
    )
    .slice(0, 6);

  const canProceed = Boolean(form.patient ?? (form.newPatientName.trim() && form.newPatientPnr.trim()));

  function handleNewPatientKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || !canProceed) return;

    event.preventDefault();
    onNext();
  }

  function selectMode(nextMode: 'search' | 'new') {
    setMode(nextMode);
    setForm({ ...form, patient: null });

    if (nextMode === 'search') {
      setSearchPnr('');
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2332] mb-1">Patient</h2>
      <p className="text-sm text-[#8494AA] mb-5">Sök befintlig patient på personnummer eller namn, eller registrera ny.</p>

      <div className="flex gap-2 mb-4">
        {(['search', 'new'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => selectMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              mode === m ? 'bg-[#1A4F8A] text-white' : 'bg-white border border-[#DDE3EC] text-[#4B5770] hover:bg-[#F0F4F8]'
            }`}
          >
            {m === 'search' ? 'Sök befintlig patient' : 'Ny patient'}
          </button>
        ))}
      </div>

      {mode === 'search' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Personnummer eller namn</label>
            <input
              ref={searchInputRef}
              type="text"
              value={searchPnr}
              onChange={(e) => { setSearchPnr(e.target.value); setForm({ ...form, patient: null }); }}
              placeholder="YYYYMMDDXXXX eller efternamn..."
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] font-mono"
            />
          </div>

          <div className="space-y-2">
            {patientsLoading ? (
              <div className="text-sm text-[#8494AA] bg-[#F0F4F8] px-4 py-3 rounded-lg">
                Hämtar patienter...
              </div>
            ) : patientsError ? (
              <div className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-4 py-3 rounded-lg">
                Kunde inte hämta patientlistan.
              </div>
            ) : matchingPatients.length > 0 ? (
              matchingPatients.map((patient) => (
                <button
                  key={patient.patientId}
                  type="button"
                  onClick={() => setForm({ ...form, patient })}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    form.patient?.patientId === patient.patientId
                      ? 'border-[#1A4F8A] bg-[#EFF6FF]'
                      : 'border-[#DDE3EC] bg-white hover:border-[#1A4F8A]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#1A2332]">{patient.fullName}</div>
                  <div className="text-xs text-[#8494AA] font-mono">{patient.socialSecurityNumber}</div>
                </button>
              ))
            ) : (
              <div className="text-sm text-[#8494AA] bg-[#F0F4F8] px-4 py-3 rounded-lg">
                Ingen patient hittades — byt till "Ny patient" för att registrera.
              </div>
            )}
          </div>

          {form.patient && (
            <div className="flex items-center gap-2 text-sm text-[#1A9E5F] bg-[#E8F7F1] px-3 py-2 rounded-lg">
              <span>✓</span>
              <span>Vald: <strong>{form.patient.fullName}</strong></span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Fullständigt namn</label>
            <input
              type="text"
              value={form.newPatientName}
              onChange={(e) => setForm({ ...form, newPatientName: e.target.value })}
              onKeyDown={handleNewPatientKeyDown}
              placeholder="Andersson, Anna"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Personnummer</label>
            <input
              type="text"
              value={form.newPatientPnr}
              onChange={(e) => setForm({ ...form, newPatientPnr: e.target.value })}
              onKeyDown={handleNewPatientKeyDown}
              placeholder="YYYYMMDDXXXX"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] font-mono"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-40"
        >
          Nästa →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Treatment + Priority ─────────────────────────────────────────────

const PRIORITY_OPTIONS: Array<{ value: BookingPriority; label: string; desc: string; bg: string; border: string; text: string }> = [
  { value: 'Green',  label: 'Grön – Elektiv',   desc: 'Stabil, ingen akut suicidrisk. Behandling inom planerat schema.',      bg: 'bg-[#E8F7F1]', border: 'border-[#1A9E5F]', text: 'text-[#1A9E5F]' },
  { value: 'Yellow', label: 'Gul – Halvakut',   desc: 'Tydlig försämring, ej fullgod respons på läkemedel. Prioriteras upp.', bg: 'bg-[#FEF3DC]', border: 'border-[#D4860A]', text: 'text-[#D4860A]' },
  { value: 'Red',    label: 'Röd – Akut',       desc: 'Vitalindikation. Suicidrisk, katatoni eller livshotande tillstånd.',   bg: 'bg-[#FDEAEA]', border: 'border-[#C42B2B]', text: 'text-[#C42B2B]' },
];

function Step2({ form, setForm, onNext, onBack }: {
  form: FormState;
  setForm: (f: FormState) => void;
  onNext: () => void;
  onBack: () => void;
}) {
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

      <div className="mt-6 flex gap-3 justify-between">
        <button onClick={onBack}
          className="px-5 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors">
          ← Tillbaka
        </button>
        <button onClick={onNext} disabled={!canProceed}
          className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-40">
          Nästa →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Health declaration ───────────────────────────────────────────────

function Step3({ form, setForm, onSubmit, onBack, isLoading, error }: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: boolean;
}) {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  patient: null,
  newPatientName: '',
  newPatientPnr: '',
  treatmentType: null,
  priority: 'Green',
  preferredDate: '',
  preferredTime: '',
  department: '',
  contactName: '',
  contactPhone: '',
  health: {
    fastaOk: null,
    blodtryck: '',
    viktKg: '',
    allergi: '',
    lakemedel: '',
    extraInfo: '',
  },
};

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
  const isError = createPatientMutation.isError || createBookingMutation.isError;

  async function handleSubmit() {
    let patientId = form.patient?.patientId;

    if (!patientId) {
      const newPatient = await createPatientMutation.mutateAsync({
        fullName: form.newPatientName,
        socialSecurityNumber: form.newPatientPnr,
      });
      patientId = newPatient.patientId;
    }

    const booking = await createBookingMutation.mutateAsync({
      date: `${form.preferredDate}T${(form.preferredTime || '09:00')}:00`,
      patientId: patientId!,
      treatmentType: form.treatmentType!,
      createdById: Number(user?.id ?? 0),
      createdAt: new Date().toISOString(),
      priority: form.priority,
      status: 'Pending',
      referralDepartment: form.department.trim(),
      referralContactName: form.contactName.trim(),
      referralContactPhone: form.contactPhone.trim(),
    });

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
          <Step1
            form={form}
            setForm={setForm}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            form={form}
            setForm={setForm}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3
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
