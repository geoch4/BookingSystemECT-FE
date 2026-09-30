import { useRef, useState, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPatients } from '../../api/patients';
import type { FormState } from './referralTypes';
import { validatePersonnummer } from '../../utils/personnummer';

interface Props {
  form: FormState;
  setForm: (f: FormState) => void;
  onNext: () => void;
}

export default function ReferralStep1({ form, setForm, onNext }: Props) {
  const { data: patients = [], isLoading: patientsLoading, isError: patientsError } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
  });
  const [searchPnr, setSearchPnr] = useState('');
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedSearch = searchPnr.trim().toLowerCase();
  const searchDigits = searchPnr.replace(/\D/g, '');
  const newPatientPnrValidation = validatePersonnummer(form.newPatientPnr);
  const matchingPatients = patients
    .filter((p) =>
      !normalizedSearch
      || p.socialSecurityNumber.toLowerCase().includes(normalizedSearch)
      || p.socialSecurityNumber.replace(/\D/g, '').includes(searchDigits)
      || p.fullName.toLowerCase().includes(normalizedSearch)
    )
    .slice(0, 6);

  const canProceed = Boolean(form.patient ?? (form.newPatientName.trim() && newPatientPnrValidation.isValid));

  function handleNewPatientKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || !canProceed) return;
    event.preventDefault();
    handleNext();
  }

  function handleNext() {
    if (mode === 'new') {
      const validation = validatePersonnummer(form.newPatientPnr);
      if (!validation.isValid) return;
      setForm({ ...form, newPatientPnr: validation.normalized });
    }
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
            <p className="mt-1 text-xs text-[#8494AA]">
              Du kan skriva med eller utan bindestreck, t.ex. 198001011234 eller 800101-1234.
            </p>
          </div>

          <div className="space-y-2">
            {patientsLoading ? (
              <div className="text-sm text-[#8494AA] bg-[#F0F4F8] px-4 py-3 rounded-lg">Hämtar patienter...</div>
            ) : patientsError ? (
              <div className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-4 py-3 rounded-lg">Kunde inte hämta patientlistan.</div>
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#1A9E5F] bg-[#E8F7F1] px-3 py-2 rounded-lg">
                <span>✓</span>
                <span>Vald: <strong>{form.patient.fullName}</strong></span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B5770] mb-1">Extern patientreferens</label>
                <input
                  type="text"
                  value={form.externalPatientId || form.patient.externalPatientId || ''}
                  onChange={(e) => setForm({ ...form, externalPatientId: e.target.value })}
                  placeholder="Valfri lokal/journalnära referens"
                  className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
                />
              </div>
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
              onBlur={() => {
                const validation = validatePersonnummer(form.newPatientPnr);
                if (validation.normalized) setForm({ ...form, newPatientPnr: validation.normalized });
              }}
              onKeyDown={handleNewPatientKeyDown}
              placeholder="YYYYMMDDXXXX"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono ${
                form.newPatientPnr && !newPatientPnrValidation.isValid
                  ? 'border-[#C42B2B] focus:ring-[#C42B2B]'
                  : 'border-[#DDE3EC] focus:ring-[#1A4F8A]'
              }`}
            />
            {form.newPatientPnr && !newPatientPnrValidation.isValid && (
              <p className="mt-1 text-xs font-medium text-[#C42B2B]">
                {newPatientPnrValidation.message}
              </p>
            )}
            {newPatientPnrValidation.isValid && (
              <p className="mt-1 text-xs font-medium text-[#1A9E5F]">
                Personnummer är giltigt.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Extern patientreferens</label>
            <input
              type="text"
              value={form.externalPatientId}
              onChange={(e) => setForm({ ...form, externalPatientId: e.target.value })}
              placeholder="Valfri lokal/journalnära referens"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-40"
        >
          Nästa →
        </button>
      </div>
    </div>
  );
}
