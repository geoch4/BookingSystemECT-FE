import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPatientUnits, updatePatientUnit, transferPatient, getDepartments, type PatientUnitMembership } from '../../api/patients';
import { getTreatmentUnits } from '../../api/bookings';
import { useAuth } from '../../context/useAuth';
export default function PatientUnitAccessDialog({patientId,onClose}:{patientId:number;onClose:()=>void}) {
  const { isAdmin } = useAuth();
  const qc=useQueryClient();
  const [kind,setKind]=useState<'department'|'treatment'>('department');
  const [unit,setUnit]=useState('');
  const [reason,setReason]=useState('');
  const memberships=useQuery({queryKey:['patient-units',patientId],queryFn:()=>getPatientUnits(patientId),enabled:isAdmin});
  const departments=useQuery({queryKey:['departments'],queryFn:getDepartments,enabled:isAdmin});
  const treatment=useQuery({queryKey:['treatment-units'],queryFn:getTreatmentUnits,enabled:isAdmin});
  const mutation=useMutation({mutationFn:({membership,transfer}:{membership:PatientUnitMembership;transfer?:boolean})=>transfer?transferPatient(patientId,membership.unitId,reason):updatePatientUnit(patientId,membership),onSuccess:()=>{void qc.invalidateQueries();}});
  if(!isAdmin) return null;
  const apply=(membership:PatientUnitMembership,transfer=false)=>mutation.mutate({membership:{...membership,reason:reason.trim()},transfer});
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="patient-units-title" className="w-full max-w-xl rounded-xl bg-white p-6">
      <h2 id="patient-units-title" className="text-xl font-bold">Patientens enhetsåtkomst</h2>
      <p className="my-3 text-sm">En aktiv relation ger åtkomst till patienten. Återkallad åtkomst gäller även när äldre remisser finns kvar.</p>
      {memberships.isLoading && <p>Laddar relationer…</p>}
      {memberships.isError && <p role="alert">Relationerna kunde inte hämtas.</p>}
      <ul>{(memberships.data ?? []).map(m=><li key={m.kind+':'+m.unitId} className="my-2 flex items-center justify-between gap-3">
        <span>{m.unitId} · {m.kind==='department'?'Avdelning':'Behandlingsenhet'} · {m.isActive?'Aktiv':'Återkallad'}</span>
        <button disabled={!reason.trim()||mutation.isPending} onClick={()=>apply({...m,isActive:!m.isActive})}>{m.isActive?'Återkalla':'Återaktivera'}</button>
      </li>)}</ul>
      <label className="block mt-4">Orsak<textarea maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} className="block w-full rounded border p-2" /></label>
      <label className="block mt-3">Enhetstyp<select value={kind} onChange={e=>{setKind(e.target.value as typeof kind);setUnit('');}} className="block w-full rounded border p-2"><option value="department">Avdelning</option><option value="treatment">Behandlingsenhet</option></select></label>
      <label className="block mt-3">Enhet<select value={unit} onChange={e=>setUnit(e.target.value)} className="block w-full rounded border p-2"><option value="">Välj enhet</option>{((kind==='department'?departments.data:treatment.data)??[]).map(id=><option key={id} value={id}>{id}</option>)}</select></label>
      <div className="mt-4 flex flex-wrap gap-4">
        <button disabled={!unit||!reason.trim()||mutation.isPending} onClick={()=>apply({unitId:unit,kind,isActive:true,reason})}>Lägg till åtkomst</button>
        {kind==='department'&&<button disabled={!unit||!reason.trim()||mutation.isPending} onClick={()=>apply({unitId:unit,kind,isActive:true,reason},true)}>Flytta hit och återkalla övriga avdelningar</button>}
        <button onClick={onClose}>Stäng</button>
      </div>
      {mutation.isError&&<p role="alert">Ändringen kunde inte sparas.</p>}
      {mutation.isSuccess&&<p role="status">Enhetsåtkomsten har uppdaterats.</p>}
    </section>
  </div>;
}
