import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatients, createPatient, updatePatient, deletePatient } from '../api/patients';
import type { PatientDto, CreatePatientDto } from '../types';
import BackendErrorState from '../components/common/BackendErrorState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Spinner from '../components/common/Spinner';

// ─── Create/edit patient modal ─────────────────────────────────────────────────

interface PatientModalProps {
  existing?: PatientDto;
  onClose: () => void;
}

function PatientModal({ existing, onClose }: PatientModalProps) {
  const qc = useQueryClient();
  // If an existing patient was passed in, this modal edits it instead of creating a new one.
  const isEdit = !!existing;

  const [form, setForm] = useState<CreatePatientDto>({
    fullName: existing?.fullName ?? '',
    socialSecurityNumber: existing?.socialSecurityNumber ?? '',
  });

  // Creates a new patient and refreshes the patient list on success.
  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); onClose(); },
  });

  // Updates the existing patient and refreshes the patient list on success.
  const updateMutation = useMutation({
    mutationFn: (dto: CreatePatientDto) => updatePatient(existing!.patientId, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); onClose(); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;

  // Routes the form submit to create or update depending on the modal mode.
  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (isEdit) updateMutation.mutate(form);
    else createMutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A2332]">
            {isEdit ? 'Redigera patient' : 'Ny patient'}
          </h2>
          <button onClick={onClose} aria-label="Stäng dialog" className="text-[#8494AA] hover:text-[#1A2332] text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Fullständigt namn</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Andersson, Anna"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B5770] mb-1">Personnummer</label>
            <input
              type="text"
              required
              value={form.socialSecurityNumber}
              onChange={(e) => setForm((f) => ({ ...f, socialSecurityNumber: e.target.value }))}
              placeholder="YYYYMMDDXXXX"
              className="w-full px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4F8A] font-mono"
            />
          </div>

          {isError && (
            <div className="text-sm text-[#C42B2B] bg-[#FDEAEA] px-3 py-2 rounded-lg">
              Kunde inte spara patient.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#DDE3EC] rounded-lg text-sm text-[#4B5770] hover:bg-[#F0F4F8] transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-[#1A4F8A] text-white rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:opacity-60"
            >
              {isPending ? 'Sparar...' : isEdit ? 'Spara ändringar' : 'Lägg till'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; patient?: PatientDto }>({ open: false });
  const [confirmDialog, setConfirmDialog] = useState<{ patientId: number; name: string } | null>(null);
  const [search, setSearch] = useState('');

  const patientsQuery = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
  });
  const patients = patientsQuery.data ?? [];
  const isLoading = patientsQuery.isLoading;

  // Deletes a patient and refreshes the patient list on success.
  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });

  // Filters the patient list by name or social security number as the user types.
  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.socialSecurityNumber.includes(search)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Patienter</h1>
          <p className="text-sm text-[#8494AA] mt-0.5">{patients.length} registrerade</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          disabled={patientsQuery.isError}
          className="bg-[#1A4F8A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a3f6f] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Ny patient
        </button>
      </div>

      {patientsQuery.isError && (
        <div className="mb-4">
          <BackendErrorState
            error={patientsQuery.error}
            onRetry={() => void patientsQuery.refetch()}
          />
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Sök på namn eller personnummer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-[#DDE3EC] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A4F8A]"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#DDE3EC]">
        {patientsQuery.isError ? (
          <div className="p-8 text-center text-sm font-medium text-[#854D0E]">Patientdata visas igen när anslutningen fungerar.</div>
        ) : isLoading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-sm text-[#8494AA]">
            <Spinner size={18} />
            Laddar patienter...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8494AA]">
            {search ? 'Inga patienter matchar sökningen.' : 'Inga patienter registrerade.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[#8494AA] uppercase tracking-wider border-b border-[#DDE3EC]">
                  <th scope="col" className="px-4 py-3">ID</th>
                  <th scope="col" className="px-4 py-3">Namn</th>
                  <th scope="col" className="px-4 py-3">Personnummer</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Åtgärder</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.patientId} className="border-b border-[#DDE3EC] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[#8494AA]">#{p.patientId}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1A2332]">{p.fullName}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[#4B5770]">{p.socialSecurityNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setModal({ open: true, patient: p })}
                          className="text-xs text-[#1A4F8A] hover:underline"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => setConfirmDialog({ patientId: p.patientId, name: p.fullName })}
                          className="text-xs text-[#C42B2B] hover:underline"
                        >
                          Radera
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/edit modal, shared for both flows via the optional `patient` prop */}
      {modal.open && (
        <PatientModal
          existing={modal.patient}
          onClose={() => setModal({ open: false })}
        />
      )}

      {/* Delete confirmation, shown before the delete mutation actually fires */}
      {confirmDialog && (
        <ConfirmDialog
          title="Radera patient"
          message={`${confirmDialog.name} tas bort permanent och kan inte återställas.`}
          confirmLabel="Radera"
          onConfirm={() => {
            deleteMutation.mutate(confirmDialog.patientId);
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
